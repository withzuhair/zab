import { prisma } from "@/lib/db";
import {
  hasReachedRateLimit,
  RATE_LIMIT_MAX_HITS,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/rate-limit-policy";

export { hasReachedRateLimit, RATE_LIMIT_MAX_HITS, RATE_LIMIT_WINDOW_MS };

let nextCleanupAt = 0;
let cleanupTask: Promise<void> | null = null;

async function cleanupExpiredHits(now: number) {
  if (now < nextCleanupAt) {
    return;
  }

  if (!cleanupTask) {
    nextCleanupAt = now + 60_000;
    cleanupTask = prisma.rateLimitHit
      .deleteMany({
        where: {
          createdAt: {
            lt: new Date(now - RATE_LIMIT_WINDOW_MS),
          },
        },
      })
      .then(() => undefined)
      .finally(() => {
        cleanupTask = null;
      });
  }

  try {
    await cleanupTask;
  } catch (error) {
    nextCleanupAt = 0;
    throw error;
  }
}

export async function consumeRateLimit(key: string) {
  const now = Date.now();
  const windowStart = new Date(now - RATE_LIMIT_WINDOW_MS);
  await cleanupExpiredHits(now);

  return prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw<{ locked: number }[]>`
      WITH lock_result AS MATERIALIZED (
        SELECT pg_advisory_xact_lock(hashtext(${key}))
      )
      SELECT 1 AS locked FROM lock_result
    `;
    const recentHits = await transaction.rateLimitHit.count({
      where: { key, createdAt: { gte: windowStart } },
    });

    if (hasReachedRateLimit(recentHits)) {
      return false;
    }

    await transaction.rateLimitHit.create({ data: { key } });
    return true;
  });
}
