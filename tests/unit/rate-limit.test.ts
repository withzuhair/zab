import { describe, expect, it } from "vitest";
import {
  hasReachedRateLimit,
  RATE_LIMIT_MAX_HITS,
  RATE_LIMIT_WINDOW_MS,
} from "../../src/lib/rate-limit-policy";

describe("rate-limit thresholds", () => {
  it("allows the first five hits and blocks the sixth", () => {
    expect(RATE_LIMIT_MAX_HITS).toBe(5);
    expect(hasReachedRateLimit(4)).toBe(false);
    expect(hasReachedRateLimit(5)).toBe(true);
  });

  it("uses a ten-minute window", () => {
    expect(RATE_LIMIT_WINDOW_MS).toBe(10 * 60 * 1000);
  });
});
