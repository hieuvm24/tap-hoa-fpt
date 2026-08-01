"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

/** 2 hàng × 4 cột trên desktop */
const PAGE_SIZE = 8;

type Props = {
  products: Product[];
  loading?: boolean;
  reasons?: Record<string, string>;
  hideReasons?: boolean;
  className?: string;
};

export function ProductPagedGrid({
  products,
  loading,
  reasons,
  hideReasons,
  className,
}: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  useEffect(() => {
    setPage(0);
  }, [products]);

  useEffect(() => {
    if (page > totalPages - 1) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  const visible = useMemo(() => {
    const start = page * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [products, page]);

  const showNav = products.length > PAGE_SIZE;

  return (
    <div className={cn("relative", className)}>
      {showNav && (
        <div className="mb-3 flex items-center justify-end gap-2">
          <span className="mr-auto text-xs text-gray-400">
            {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, products.length)} / {products.length}
          </span>
          <button
            type="button"
            aria-label="Trang trước"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-primary-300 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Trang sau"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:border-primary-300 hover:text-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {loading
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : visible.map((p) => (
              <div key={p.id} className="min-w-0">
                <ProductCard product={p} />
                {!hideReasons && reasons?.[p.id] && (
                  <p className="mt-1.5 line-clamp-1 px-0.5 text-[11px] text-gray-400">
                    {reasons[p.id]}
                  </p>
                )}
              </div>
            ))}
      </div>

      {showNav && (
        <div className="mt-4 flex justify-center gap-1.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Trang ${i + 1}`}
              onClick={() => setPage(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === page
                  ? "w-6 bg-primary-500"
                  : "w-2 bg-gray-300 hover:bg-gray-400"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export const PRODUCT_GRID_PAGE_SIZE = PAGE_SIZE;
