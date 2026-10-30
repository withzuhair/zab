import { afterEach, describe, expect, it, vi } from "vitest";
import { trackQuoteSubmitted } from "@/lib/analytics";

describe("trackQuoteSubmitted", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.plausible;
  });

  it("sends the custom event only when analytics is configured", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "zabshipping.com");

    trackQuoteSubmitted();

    expect(plausible).toHaveBeenCalledWith("quote_submitted");
  });

  it("does not send an event when analytics is disabled", () => {
    const plausible = vi.fn();
    window.plausible = plausible;
    vi.stubEnv("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "");

    trackQuoteSubmitted();

    expect(plausible).not.toHaveBeenCalled();
  });
});
