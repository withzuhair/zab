export const RATE_LIMIT_MAX_HITS = 5;
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

export function hasReachedRateLimit(
  hitCount: number,
  limit = RATE_LIMIT_MAX_HITS,
) {
  return hitCount >= limit;
}
