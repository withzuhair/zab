import { createHmac } from "node:crypto";

function hashKey(value: string) {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET must be configured for admin sign-in.");
  }

  return createHmac("sha256", secret)
    .update(`admin-login:${value}`)
    .digest("hex");
}

export function getLoginThrottleKeys(ip: string, email: string) {
  return [hashKey(`ip:${ip}`), hashKey(`email:${email}`)].sort();
}
