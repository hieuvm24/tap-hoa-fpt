/** Client-only: sản phẩm đã xem (localStorage) */

const RECENTLY_VIEWED_KEY = "taphoa_recently_viewed";
const MAX_RECENT = 20;

export function trackRecentlyViewed(productId: string): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    const ids: string[] = stored ? JSON.parse(stored) : [];
    const updated = [productId, ...ids.filter((id) => id !== productId)].slice(
      0,
      MAX_RECENT
    );
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}

export function getRecentIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
    if (!stored) return [];
    return (JSON.parse(stored) as string[]).filter(Boolean);
  } catch {
    return [];
  }
}
