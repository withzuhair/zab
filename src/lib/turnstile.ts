type TurnstileResponse = {
  success: boolean;
};

export async function verifyTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Turnstile is not configured; skipping verification in development.",
      );
      return true;
    }

    throw new Error(
      "Turnstile verification is unavailable because its secret is not configured.",
    );
  }

  if (!token) {
    return false;
  }

  const body = new URLSearchParams({ secret, response: token });

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5000),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Turnstile verification service returned HTTP ${response.status}.`,
    );
  }

  const result = (await response.json()) as TurnstileResponse;
  return result.success;
}
