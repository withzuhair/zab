import { prisma } from "@/lib/db";
import {
  RATE_LIMIT_MAX_HITS,
  RATE_LIMIT_WINDOW_MS,
} from "@/lib/rate-limit-policy";

export { getLoginThrottleKeys } from "@/lib/admin/login-throttle-policy";

export async function isLoginThrottled(keys: string[]) {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const hits = await prisma.rateLimitHit.groupBy({
    by: ["key"],
    where: { key: { in: keys }, createdAt: { gte: windowStart } },
    _count: { _all: true },
  });

  return hits.some((hit) => hit._count._all >= RATE_LIMIT_MAX_HITS);
}

export async function recordLoginFailure(keys: string[]) {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  return prisma.$transaction(async (transaction) => {
    for (const key of keys) {
      await transaction.$queryRaw<{ locked: number }[]>`
        WITH lock_result AS MATERIALIZED (
          SELECT pg_advisory_xact_lock(hashtext(${key}))
        )
        SELECT 1 AS locked FROM lock_result
      `;
    }

    await transaction.rateLimitHit.deleteMany({
      where: { key: { in: keys }, createdAt: { lt: windowStart } },
    });

    const hits = await transaction.rateLimitHit.groupBy({
      by: ["key"],
      where: { key: { in: keys }, createdAt: { gte: windowStart } },
      _count: { _all: true },
    });

    if (hits.some((hit) => hit._count._all >= RATE_LIMIT_MAX_HITS)) {
      return;
    }

    await transaction.rateLimitHit.createMany({
      data: keys.map((key) => ({ key })),
    });
  });
}
