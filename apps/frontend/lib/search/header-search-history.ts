const STORAGE_KEY = "spliton-header-search-history-v1";
const MAX_ITEMS = 8;

export type HeaderSearchHistoryItem = {
  query: string;
  href?: string;
  at: number;
};

function readRaw(): HeaderSearchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HeaderSearchHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: HeaderSearchHistoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
}

export function getHeaderSearchHistory(): HeaderSearchHistoryItem[] {
  return readRaw().sort((a, b) => b.at - a.at);
}

export function pushHeaderSearchHistory(entry: { query: string; href?: string }) {
  const query = entry.query.trim();
  if (!query) return;
  const next = readRaw().filter((item) => item.query.toLowerCase() !== query.toLowerCase());
  next.unshift({ query, href: entry.href, at: Date.now() });
  write(next);
}

export function clearHeaderSearchHistory() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
