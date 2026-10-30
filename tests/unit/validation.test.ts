import { describe, expect, it } from "vitest";
import { newsletterSchema, quoteSchema } from "@/lib/validation";

const validQuote = {
  fullName: "Aisha Khan",
  company: "",
  email: "aisha@example.com",
  phone: "+971 50 123 4567",
  serviceType: "OCEAN",
  origin: "",
  destination: "",
  cargoType: "",
  weightVolume: "",
  message: "Please send a quote for a shipment.",
  consent: true,
};

describe("quote validation", () => {
  it("accepts a valid quote and trims text fields", () => {
    const result = quoteSchema.safeParse({
      ...validQuote,
      fullName: "  Aisha Khan  ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.fullName).toBe("Aisha Khan");
      expect(result.data.honeypot).toBe("");
      expect(result.data.turnstileToken).toBe("");
    }
  });

  it("rejects missing consent and invalid contact data", () => {
    const result = quoteSchema.safeParse({
      ...validQuote,
      email: "invalid",
      phone: "call me",
      message: "short",
      consent: false,
    });

    expect(result.success).toBe(false);
  });
});

describe("newsletter validation", () => {
  it("accepts and normalizes a valid email address", () => {
    expect(newsletterSchema.parse({ email: "  News@Example.com " }).email).toBe(
      "news@example.com",
    );
  });

  it("rejects an invalid email address", () => {
    expect(newsletterSchema.safeParse({ email: "not-an-email" }).success).toBe(
      false,
    );
  });
});
