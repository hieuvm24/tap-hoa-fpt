"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Search,
  TrendingUp,
  X,
  ArrowRight,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { api } from "@/lib/api";
import {
  addSearchHistory,
  clearSearchHistory,
  getSearchHistory,
  removeSearchHistory,
} from "@/lib/search-history";
import type { Product } from "@/types";

const QUICK_SUGGESTS = [
  "Rau củ",
  "Sữa",
  "Mì gói",
  "Nước ngọt",
  "Gia vị",
  "Bánh kẹo",
];

interface SearchBoxProps {
  className?: string;
  inputClassName?: string;
  onSearched?: () => void;
  autoFocus?: boolean;
}

export function SearchBox({
  className,
  inputClassName,
  onSearched,
  autoFocus,
}: SearchBoxProps) {
  const router = useRouter();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshHistory = useCallback(() => {
    setHistory(getSearchHistory());
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    api.recommendations.get({ type: "bestsellers", limit: "5" }).then((res) => {
      if (res.success && res.data?.products) setTrending(res.data.products);
    });
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      api.products
        .list({ search: q, limit: "6" })
        .then((res) => {
          if (res.success && res.data) {
            const list = Array.isArray(res.data) ? res.data : res.data.products;
            setSuggestions(list);
          }
        })
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const goSearch = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    addSearchHistory(q);
    refreshHistory();
    setQuery(q);
    setOpen(false);
    router.push(`/danh-muc?search=${encodeURIComponent(q)}`);
    onSearched?.();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    goSearch(query);
  };

  const showPanel = open;
  const hasQuery = query.trim().length > 0;

  return (
    <div ref={wrapRef} className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative w-full" role="search">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          autoComplete="off"
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder="Tìm rau, sữa, mì, đồ uống..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            refreshHistory();
            setOpen(true);
          }}
          className={cn(
            "w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-10 text-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20",
            inputClassName
          )}
        />
        {query && (
          <button
            type="button"
            aria-label="Xóa"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {showPanel && (
        <div
          id={listId}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,420px)] overflow-y-auto rounded-2xl border border-gray-100 bg-white py-2 shadow-xl"
        >
          {!hasQuery && history.length > 0 && (
            <div className="px-2 pb-2">
              <div className="mb-1 flex items-center justify-between px-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Lịch sử tìm kiếm
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearSearchHistory();
                    setHistory([]);
                  }}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Xóa tất cả
                </button>
              </div>
              <ul className="space-y-0.5">
                {history.map((h) => (
                  <li key={h}>
                    <div className="group flex items-center gap-1 rounded-xl hover:bg-primary-50">
                      <button
                        type="button"
                        onClick={() => goSearch(h)}
                        className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700"
                      >
                        <Clock className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="truncate">{h}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Xóa ${h}`}
                        onClick={() => {
                          removeSearchHistory(h);
                          refreshHistory();
                        }}
                        className="mr-2 rounded-lg p-1.5 text-gray-300 opacity-0 hover:bg-white hover:text-gray-500 group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!hasQuery && (
            <div className="border-t border-gray-50 px-2 pt-2">
              <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Gợi ý nhanh
              </p>
              <div className="mb-2 flex flex-wrap gap-1.5 px-2">
                {QUICK_SUGGESTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => goSearch(s)}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
              {trending.length > 0 && (
                <>
                  <p className="mb-1 flex items-center gap-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Đang bán chạy
                  </p>
                  <ul>
                    {trending.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/san-pham/${p.slug}`}
                          onClick={() => {
                            setOpen(false);
                            onSearched?.();
                          }}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary-50"
                        >
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {p.name}
                            </p>
                            <p className="text-xs text-primary-600">
                              {formatPrice(p.price)}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {hasQuery && (
            <div className="px-2">
              <button
                type="button"
                onClick={() => goSearch(query)}
                className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-primary-700 hover:bg-primary-50"
              >
                <Search className="h-4 w-4" />
                <span className="truncate">Tìm “{query.trim()}”</span>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0" />
              </button>

              {loading && (
                <p className="px-3 py-2 text-xs text-gray-400">Đang tìm...</p>
              )}

              {!loading && suggestions.length === 0 && (
                <p className="px-3 py-3 text-sm text-gray-500">
                  Không có sản phẩm khớp. Thử từ khóa khác hoặc Enter để xem danh sách.
                </p>
              )}

              {suggestions.length > 0 && (
                <>
                  <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Sản phẩm gợi ý
                  </p>
                  <ul>
                    {suggestions.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/san-pham/${p.slug}`}
                          onClick={() => {
                            addSearchHistory(query.trim());
                            refreshHistory();
                            setOpen(false);
                            onSearched?.();
                          }}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-primary-50"
                        >
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-50">
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {p.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {p.category} ·{" "}
                              <span className="text-primary-600">
                                {formatPrice(p.price)}
                              </span>
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
