import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEnquiryEmails } from "../../src/lib/email";

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

const enquiry = {
  id: "enquiry-123",
  siteUrl: "https://zabshipping.com",
  fullName: '<img src=x onerror="alert(1)">\r\nInjected subject',
  company: "",
  email: "customer@example.com",
  phone: "+971 50 123 4567",
  serviceType: "OCEAN",
  origin: "",
  destination: "",
  cargoType: "",
  weightVolume: "",
  message: "<script>alert('xss')</script>",
  consent: true,
  honeypot: "",
  turnstileToken: "",
  sourcePage: "/contact",
} satisfies Parameters<typeof sendEnquiryEmails>[0];

describe("enquiry email templates", () => {
  beforeEach(() => {
    vi.stubEnv("EMAIL_FROM", "ZAB Shipping <no-reply@example.test>");
    vi.stubEnv("ENQUIRY_NOTIFY_TO", "ops@example.test");
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    sendMock.mockReset().mockResolvedValue({
      data: { id: "email-123" },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("sends a safe team notification and customer confirmation", async () => {
    await sendEnquiryEmails(enquiry);

    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls[0]?.[0]).toMatchObject({
      to: "ops@example.test",
      subject:
        'New enquiry: Ocean Freight from <img src=x onerror="alert(1)">  Injected subject',
      html: expect.stringContaining(
        "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
      ),
    });
    expect(sendMock.mock.calls[0]?.[0].subject).not.toMatch(/[\r\n]/);
    expect(sendMock.mock.calls[0]?.[0].html).not.toContain("<script>");
    expect(sendMock.mock.calls[0]?.[0].html).toContain(
      "&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
    );
    expect(sendMock.mock.calls[1]?.[0]).toMatchObject({
      to: "customer@example.com",
      subject: "Thanks for contacting ZAB Shipping",
      text: expect.stringContaining("Ocean Freight"),
    });
  });

  it("fails explicitly when email configuration is incomplete", async () => {
    vi.stubEnv("EMAIL_FROM", "");
    await expect(sendEnquiryEmails(enquiry)).rejects.toThrow(
      "EMAIL_FROM and ENQUIRY_NOTIFY_TO must be configured.",
    );

    vi.stubEnv("EMAIL_FROM", "ZAB Shipping <no-reply@example.test>");
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(sendEnquiryEmails(enquiry)).rejects.toThrow(
      "RESEND_API_KEY must be configured outside development.",
    );
  });

  it("logs both messages in development when no provider key is set", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RESEND_API_KEY", "");
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);

    await sendEnquiryEmails(enquiry);

    expect(info).toHaveBeenCalledTimes(2);
    expect(info.mock.calls[0]?.[1]).toMatchObject({
      to: "ops@example.test",
      subject: expect.stringContaining("Ocean Freight"),
    });
    expect(sendMock).not.toHaveBeenCalled();
  });
});
