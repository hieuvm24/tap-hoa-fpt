"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Apple,
  Candy,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Home,
  Milk,
  Salad,
  Search,
  SlidersHorizontal,
  Snowflake,
  Soup,
  Sparkles,
  UtensilsCrossed,
  X,
  type LucideIcon,
} from "lucide-react";
import { ProductCard, ProductRecommendations } from "@/components/customer";
import { Button, ProductCardSkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { addSearchHistory } from "@/lib/search-history";
import { normalizeVi } from "@/lib/normalize-vi";
import { Product, Category } from "@/types";

type SortOption = "newest" | "price-asc" | "price-desc";

const iconMap: Record<string, LucideIcon> = {
  Salad,
  Apple,
  Coffee,
  Soup,
  Candy,
  Snowflake,
  UtensilsCrossed,
  Milk,
  Home,
  Sparkles,
};

const PRICE_RANGES = [
  { label: "Tất cả", hint: "Mọi mức giá", min: 0, max: Number.MAX_SAFE_INTEGER },
  { label: "< 20K", hint: "Dưới 20.000đ", min: 0, max: 20000 },
  { label: "20–50K", hint: "20.000 – 50.000đ", min: 20000, max: 50000 },
  { label: "50–100K", hint: "50.000 – 100.000đ", min: 50000, max: 100000 },
  { label: "> 100K", hint: "Trên 100.000đ", min: 100000, max: Number.MAX_SAFE_INTEGER },
] as const;

function getVisiblePages(current: number, total: number): Array<number | "…"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set<number>([1, total]);
  for (let p = current - 1; p <= current + 1; p++) {
    if (p >= 1 && p <= total) set.add(p);
  }
  if (current <= 3) {
    set.add(2);
    set.add(3);
    set.add(4);
  }
  if (current >= total - 2) {
    set.add(total - 1);
    set.add(total - 2);
    set.add(total - 3);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const pages: Array<number | "…"> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) pages.push("…");
    pages.push(sorted[i]);
  }
  return pages;
}

function CategoryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");
  const searchQuery = searchParams.get("search") || "";

  const [sort, setSort] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([
    0,
    Number.MAX_SAFE_INTEGER,
  ]);
  const [selectedCategory, setSelectedCategory] = useState(categorySlug || "");
  const [keyword, setKeyword] = useState(searchQuery);
  const [onlyPromo, setOnlyPromo] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const perPage = 12;

  useEffect(() => {
    setSelectedCategory(categorySlug || "");
  }, [categorySlug]);

  useEffect(() => {
    setKeyword(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    api.categories.list().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    setCurrentPage(1);
    const params: Record<string, string> = { limit: "500" };
    if (selectedCategory) params.category = selectedCategory;
    if (searchQuery) params.search = searchQuery;
    if (sort !== "newest") params.sort = sort;
    api.products.list(params).then((res) => {
      if (res.success && res.data) {
        const data = Array.isArray(res.data)
          ? { products: res.data }
          : res.data;
        setProducts(data.products);
      }
      setLoading(false);
    });
  }, [selectedCategory, sort, searchQuery]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    result = result.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );
    const q = keyword.trim().toLowerCase();
    if (q && q !== searchQuery.toLowerCase()) {
      const nq = normalizeVi(q);
      result = result.filter((p) => {
        const hay = normalizeVi(`${p.name} ${p.brand} ${p.category}`);
        return hay.includes(nq) || p.name.toLowerCase().includes(q);
      });
    }
    if (onlyPromo) result = result.filter((p) => p.isPromotion);
    if (inStockOnly) result = result.filter((p) => p.stock > 0);
    return result;
  }, [products, priceRange, keyword, searchQuery, onlyPromo, inStockOnly]);

  useEffect(() => {
    setCurrentPage(1);
  }, [priceRange, onlyPromo, inStockOnly, keyword]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safePage - 1) * perPage,
    safePage * perPage
  );
  const visiblePages = getVisiblePages(safePage, totalPages);

  const activeCategory = categories.find((c) => c.slug === selectedCategory);
  const activePrice = PRICE_RANGES.find(
    (r) => r.min === priceRange[0] && r.max === priceRange[1]
  );
  const hasFilters =
    !!selectedCategory ||
    priceRange[1] !== Number.MAX_SAFE_INTEGER ||
    priceRange[0] !== 0 ||
    onlyPromo ||
    inStockOnly ||
    !!keyword.trim();

  const selectCategory = (slug: string) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (searchQuery) params.set("search", searchQuery);
    const qs = params.toString();
    router.push(qs ? `/danh-muc?${qs}` : "/danh-muc");
  };

  const applyKeywordSearch = () => {
    const q = keyword.trim();
    if (q) addSearchHistory(q);
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (q) params.set("search", q);
    const qs = params.toString();
    router.push(qs ? `/danh-muc?${qs}` : "/danh-muc");
  };

  const clearFilters = () => {
    setPriceRange([0, Number.MAX_SAFE_INTEGER]);
    setOnlyPromo(false);
    setInStockOnly(false);
    setKeyword("");
    setSelectedCategory("");
    setCurrentPage(1);
    router.push("/danh-muc");
  };

  const sidebar = (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 to-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Tìm nhanh</h2>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-primary-600 hover:underline"
            >
              Xóa lọc
            </button>
          )}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyKeywordSearch();
            }}
            placeholder="Tên SP, thương hiệu..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => {
                setKeyword("");
                if (searchQuery) {
                  const params = new URLSearchParams();
                  if (selectedCategory) params.set("category", selectedCategory);
                  const qs = params.toString();
                  router.push(qs ? `/danh-muc?${qs}` : "/danh-muc");
                }
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button size="sm" className="mt-2 w-full" onClick={applyKeywordSearch}>
          Tìm sản phẩm
        </Button>
      </div>

      <div>
        <h3 className="mb-2.5 text-sm font-semibold text-gray-900">Danh mục</h3>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => selectCategory("")}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
              selectedCategory === ""
                ? "bg-primary-500 text-white shadow-sm"
                : "text-gray-700 hover:bg-primary-50"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                selectedCategory === ""
                  ? "bg-white/20"
                  : "bg-primary-50 text-primary-600"
              )}
            >
              <UtensilsCrossed className="h-4 w-4" />
            </span>
            <span className="flex-1 font-medium">Tất cả</span>
            <span
              className={cn(
                "text-xs tabular-nums",
                selectedCategory === "" ? "text-white/80" : "text-gray-400"
              )}
            >
              {categories.reduce((s, c) => s + (c.productCount || 0), 0) ||
                products.length}
            </span>
          </button>

          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Salad;
            const active = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => selectCategory(cat.slug)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  active
                    ? "bg-primary-500 text-white shadow-sm"
                    : "text-gray-700 hover:bg-primary-50"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    active ? "bg-white/20" : "bg-primary-50 text-primary-600"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 font-medium">{cat.name}</span>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    active ? "text-white/80" : "text-gray-400"
                  )}
                >
                  {cat.productCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2.5 text-sm font-semibold text-gray-900">Khoảng giá</h3>
        <div className="grid grid-cols-2 gap-2">
          {PRICE_RANGES.map((range) => {
            const active =
              priceRange[0] === range.min && priceRange[1] === range.max;
            return (
              <button
                key={range.label}
                type="button"
                title={range.hint}
                onClick={() => setPriceRange([range.min, range.max])}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-center text-xs font-medium transition-colors sm:text-sm",
                  active
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50"
                )}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="mb-2.5 text-sm font-semibold text-gray-900">Tuỳ chọn</h3>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-sm hover:bg-primary-50/50">
            <input
              type="checkbox"
              checked={onlyPromo}
              onChange={(e) => setOnlyPromo(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="flex-1 text-gray-700">Đang khuyến mãi</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5 text-sm hover:bg-primary-50/50">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="flex-1 text-gray-700">Còn hàng</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Danh mục sản phẩm
        </h1>
        <p className="mt-1 text-gray-500">
          {filteredProducts.length} sản phẩm
          {activeCategory ? ` · ${activeCategory.name}` : ""}
          {searchQuery ? ` · “${searchQuery}”` : ""}
        </p>

        {(activeCategory ||
          (activePrice && activePrice.label !== "Tất cả") ||
          onlyPromo ||
          inStockOnly) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeCategory && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                {activeCategory.name}
                <button type="button" onClick={() => selectCategory("")}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {activePrice && activePrice.label !== "Tất cả" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                {activePrice.hint}
                <button
                  type="button"
                  onClick={() => setPriceRange([0, Number.MAX_SAFE_INTEGER])}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {onlyPromo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                Khuyến mãi
                <button type="button" onClick={() => setOnlyPromo(false)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                Còn hàng
                <button type="button" onClick={() => setInStockOnly(false)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-6">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[300px] overflow-y-auto bg-white p-5 shadow-xl transition-transform lg:static lg:z-0 lg:w-72 lg:shrink-0 lg:rounded-2xl lg:border lg:border-gray-100 lg:bg-white lg:p-4 lg:shadow-sm",
            showFilters ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {showFilters && (
            <div
              className="fixed inset-0 -z-10 bg-black/50 lg:hidden"
              onClick={() => setShowFilters(false)}
            />
          )}
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <h2 className="font-semibold text-gray-900">Bộ lọc</h2>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="rounded-lg p-1.5 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {sidebar}
          {showFilters && (
            <Button
              className="mt-5 w-full lg:hidden"
              onClick={() => setShowFilters(false)}
            >
              Xem {filteredProducts.length} sản phẩm
            </Button>
          )}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Bộ lọc
            </button>
            <div className="ml-auto flex items-center gap-2">
              <span className="hidden text-sm text-gray-500 sm:inline">
                Sắp xếp:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center">
              <p className="mb-3 text-gray-500">Không tìm thấy sản phẩm phù hợp</p>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Xóa bộ lọc
              </Button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang trước"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Trước</span>
              </button>

              {visiblePages.map((page, idx) =>
                page === "…" ? (
                  <span
                    key={`e-${idx}`}
                    className="flex h-9 w-9 items-center justify-center text-sm text-gray-400"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "h-9 min-w-9 rounded-lg px-2 text-sm font-medium transition-colors",
                      page === safePage
                        ? "bg-primary-500 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-primary-50"
                    )}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 text-sm text-gray-600 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Trang sau"
              >
                <span className="hidden sm:inline">Sau</span>
                <ChevronRight className="h-4 w-4" />
              </button>

              <span className="ml-1 w-full text-center text-xs text-gray-400 sm:ml-2 sm:w-auto">
                Trang {safePage}/{totalPages}
              </span>
            </div>
          )}

          <div className="mt-10 border-t border-gray-100 pt-2">
            <ProductRecommendations variant="bestsellers" limit={4} />
            <ProductRecommendations variant="personalized" limit={4} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <CategoryPageContent />
    </Suspense>
  );
}
