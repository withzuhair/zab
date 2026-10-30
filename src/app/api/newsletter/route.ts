import { createHmac } from "node:crypto";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getFieldErrors, newsletterSchema } from "@/lib/validation";

function getIpHash(request: Request) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET must be configured before accepting subscriptions.",
    );
  }

  const ip =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const salt = createHmac("sha256", secret)
    .update("newsletter-ip-salt")
    .digest();
  return createHmac("sha256", salt).update(ip).digest("hex");
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "VALIDATION", "Submit a valid email address.");
  }

  const parsed = newsletterSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      400,
      "VALIDATION",
      "Enter a valid email address.",
      getFieldErrors(parsed.error),
    );
  }

  try {
    const key = getIpHash(request);
    const allowed = await consumeRateLimit(key);

    if (!allowed) {
      return apiError(
        429,
        "RATE_LIMIT",
        "Too many submissions. Please try again in a few minutes.",
      );
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email: parsed.data.email.toLowerCase() },
      update: { unsubscribed: false },
      create: { email: parsed.data.email.toLowerCase() },
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Newsletter subscription could not be saved.", error);
    return apiError(500, "SERVER", "Something went wrong. Please try again.");
  }
}
