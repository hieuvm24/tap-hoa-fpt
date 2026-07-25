type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Gioi han so lan goi theo key (IP/email) trong cua so thoi gian. */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cur = buckets.get(key);

  if (!cur || now >= cur.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (cur.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)),
    };
  }

  cur.count += 1;
  return { ok: true, retryAfterSec: 0 };
}
