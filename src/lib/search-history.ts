const KEY = "taphoa_search_history";
const MAX = 8;

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as unknown;
    if (!Array.isArray(list)) return [];
    return list
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim())
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): void {
  if (typeof window === "undefined") return;
  const q = query.trim();
  if (q.length < 1) return;
  try {
    const prev = getSearchHistory().filter(
      (h) => h.toLowerCase() !== q.toLowerCase()
    );
    localStorage.setItem(KEY, JSON.stringify([q, ...prev].slice(0, MAX)));
  } catch {
    /* ignore */
  }
}

export function removeSearchHistory(query: string): void {
  if (typeof window === "undefined") return;
  try {
    const next = getSearchHistory().filter(
      (h) => h.toLowerCase() !== query.toLowerCase()
    );
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
