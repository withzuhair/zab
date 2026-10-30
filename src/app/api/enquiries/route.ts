import { createHmac } from "node:crypto";
import { apiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { sendEnquiryEmails } from "@/lib/email";
import { consumeRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { getFieldErrors, quoteSchema } from "@/lib/validation";

function getClientIp(request: Request) {
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function getIpHash(ip: string) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "AUTH_SECRET must be configured before accepting enquiries.",
    );
  }

  const salt = createHmac("sha256", secret).update("enquiry-ip-salt").digest();
  return createHmac("sha256", salt).update(ip).digest("hex");
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  let ipHash: string;

  try {
    ipHash = getIpHash(ip);
  } catch (error) {
    console.error("Enquiry IP hashing is not configured.", error);
    return apiError(500, "SERVER", "Something went wrong. Please try again.");
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError(400, "VALIDATION", "Submit a valid enquiry.");
  }

  if (typeof body === "object" && body !== null && "honeypot" in body) {
    const honeypot = body.honeypot;

    if (typeof honeypot === "string" && honeypot.length > 0) {
      return Response.json({ ok: true });
    }
  }

  const parsed = quoteSchema.safeParse(body);

  if (!parsed.success) {
    return apiError(
      400,
      "VALIDATION",
      "Check the highlighted fields and try again.",
      getFieldErrors(parsed.error),
    );
  }

  let turnstileValid: boolean;

  try {
    turnstileValid = await verifyTurnstile(parsed.data.turnstileToken);
  } catch (error) {
    console.error("Turnstile verification request failed.", error);
    return apiError(
      503,
      "SERVER",
      "Spam protection is temporarily unavailable.",
    );
  }

  if (!turnstileValid) {
    return apiError(400, "SPAM", "Spam verification failed. Please try again.");
  }

  try {
    const allowed = await consumeRateLimit(ipHash);

    if (!allowed) {
      return apiError(
        429,
        "RATE_LIMIT",
        "Too many submissions. Please try again in a few minutes.",
      );
    }

    const data = parsed.data;
    const enquiry = await prisma.enquiry.create({
      data: {
        fullName: data.fullName,
        company: data.company || null,
        email: data.email,
        phone: data.phone || null,
        serviceType: data.serviceType,
        origin: data.origin || null,
        destination: data.destination || null,
        cargoType: data.cargoType || null,
        weightVolume: data.weightVolume || null,
        message: data.message,
        consent: data.consent,
        sourcePage: data.sourcePage,
        ipHash,
        userAgent: request.headers.get("user-agent")?.slice(0, 512) ?? null,
      },
      select: { id: true },
    });

    await sendEnquiryEmails({
      ...data,
      id: enquiry.id,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    });

    return Response.json({ ok: true, data: { id: enquiry.id } });
  } catch (error) {
    console.error("Enquiry could not be saved or notified.", error);
    return apiError(500, "SERVER", "Something went wrong. Please try again.");
  }
}
