import { afterEach, describe, expect, it } from "vitest";
import {
  contactSettingsSchema,
  enquiryUpdateSchema,
  galleryUpdateSchema,
  passwordChangeSchema,
  serviceUpdateSchema,
  userCreateSchema,
} from "../../src/lib/admin/validation";
import { getLoginThrottleKeys } from "../../src/lib/admin/login-throttle-policy";

describe("admin mutation validation", () => {
  it("rejects malformed enquiry status updates", () => {
    expect(
      enquiryUpdateSchema.safeParse({
        id: "enquiry-id",
        status: "UNKNOWN",
        internalNotes: "",
      }).success,
    ).toBe(false);
  });

  it("rejects oversized service body and invalid gallery category", () => {
    expect(
      serviceUpdateSchema.safeParse({
        id: "service-id",
        headline: "Headline for a logistics service",
        summary: "A useful summary for this service",
        body: "x".repeat(20_001),
        highlights: [],
        sortOrder: 0,
        published: true,
      }).success,
    ).toBe(false);
    expect(
      galleryUpdateSchema.safeParse({
        id: "gallery-id",
        title: "Gallery title",
        caption: "",
        alt: "Descriptive image text",
        category: "INVALID",
        sortOrder: 0,
        published: true,
      }).success,
    ).toBe(false);
  });

  it("requires a long password and valid contact settings", () => {
    expect(
      userCreateSchema.safeParse({
        name: "Staff User",
        email: "staff@example.com",
        password: "short",
        role: "STAFF",
      }).success,
    ).toBe(false);
    expect(
      contactSettingsSchema.safeParse({
        name: "ZAB Shipping LLC",
        address: "Dubai, United Arab Emirates",
        phone: "+971 50 123 4567",
        email: "invalid",
        hubs: [],
        hubsConfirmed: false,
        statistics: [],
      }).success,
    ).toBe(false);
  });

  it("requires matching, different, sufficiently long replacement passwords", () => {
    const validPasswordChange = {
      currentPassword: "temporary-admin-password",
      newPassword: "new-admin-password-2026",
      confirmPassword: "new-admin-password-2026",
    };

    expect(passwordChangeSchema.safeParse(validPasswordChange).success).toBe(
      true,
    );
    expect(
      passwordChangeSchema.safeParse({
        ...validPasswordChange,
        confirmPassword: "different-new-password",
      }).success,
    ).toBe(false);
    expect(
      passwordChangeSchema.safeParse({
        ...validPasswordChange,
        newPassword: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);
    expect(
      passwordChangeSchema.safeParse({
        ...validPasswordChange,
        newPassword: validPasswordChange.currentPassword,
        confirmPassword: validPasswordChange.currentPassword,
      }).success,
    ).toBe(false);
  });
});

describe("admin login throttle keys", () => {
  const previousSecret = process.env.AUTH_SECRET;

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.AUTH_SECRET;
    } else {
      process.env.AUTH_SECRET = previousSecret;
    }
  });

  it("stores only keyed hashes for the IP and normalized email dimensions", () => {
    process.env.AUTH_SECRET = "unit-test-auth-secret";
    const keys = getLoginThrottleKeys("203.0.113.1", "admin@example.com");

    expect(keys).toHaveLength(2);
    expect(keys.every((key) => /^[a-f0-9]{64}$/.test(key))).toBe(true);
    expect(keys).not.toContain("203.0.113.1");
    expect(keys).not.toContain("admin@example.com");
  });
});
