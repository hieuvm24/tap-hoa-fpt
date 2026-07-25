"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/customer";
import { Button, ProductCardSkeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Product, Category } from "@/types";

type SortOption = "newest" | "price-asc" | "price-desc";

function CategoryPageContent() {
  const searchParams = useSearchParams();
  const categorySlug = searchParams.get("category");
  const searchQuery = searchParams.get("search") || "";
  const [sort, setSort] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Number.MAX_SAFE_INTEGER]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categorySlug || "");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const perPage = 8;

  useEffect(() => {
    setSelectedCategory(categorySlug || "");
  }, [categorySlug]);

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
        const data = Array.isArray(res.data) ? { products: res.data, brands: [] } : res.data;
        setProducts(data.products);
        setBrands(data.brands);
      }
      setLoading(false);
    });
  }, [selectedCategory, sort, searchQuery]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand));
    }
    return result;
  }, [products, priceRange, selectedBrands]);

  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * perPage,
    currentPage * perPage
  );

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    setCurrentPage(1);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Danh mục sản phẩm</h1>
        <p className="text-gray-500 mt-1">
          {filteredProducts.length} sản phẩm
          {searchQuery ? ` cho “${searchQuery}”` : ""}
        </p>
      </div>

      <div className="flex gap-6">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-white p-6 shadow-xl transition-transform lg:static lg:shadow-none lg:p-0 lg:w-64 flex-shrink-0 overflow-y-auto",
            showFilters ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          {showFilters && (
            <div className="fixed inset-0 bg-black/50 lg:hidden -z-10" onClick={() => setShowFilters(false)} />
          )}
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Loại sản phẩm</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === ""}
                    onChange={() => { setSelectedCategory(""); setCurrentPage(1); }}
                    className="text-primary-500 focus:ring-primary-500"
                  />
                  Tất cả
                </label>
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat.slug}
                      onChange={() => { setSelectedCategory(cat.slug); setCurrentPage(1); }}
                      className="text-primary-500 focus:ring-primary-500"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Giá</h3>
              <div className="space-y-2">
                {[
                  { label: "Tất cả mức giá", min: 0, max: Number.MAX_SAFE_INTEGER },
                  { label: "Dưới 20.000đ", min: 0, max: 20000 },
                  { label: "20.000 - 50.000đ", min: 20000, max: 50000 },
                  { label: "50.000 - 100.000đ", min: 50000, max: 100000 },
                  { label: "Trên 100.000đ", min: 100000, max: Number.MAX_SAFE_INTEGER },
                ].map((range) => (
                  <label key={range.label} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="price"
                      checked={priceRange[0] === range.min && priceRange[1] === range.max}
                      onChange={() => { setPriceRange([range.min, range.max]); setCurrentPage(1); }}
                      className="text-primary-500 focus:ring-primary-500"
                    />
                    {range.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Thương hiệu</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {brands.map((brand) => (
                  <label key={brand} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                      className="rounded text-primary-500 focus:ring-primary-500"
                    />
                    {brand}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 gap-3">
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Bộ lọc
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-500 hidden sm:inline">Sắp xếp:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                <option value="newest">Mới nhất</option>
                <option value="price-asc">Giá tăng dần</option>
                <option value="price-desc">Giá giảm dần</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500">Không tìm thấy sản phẩm phù hợp</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "h-9 w-9 rounded-lg text-sm font-medium transition-colors",
                    page === currentPage
                      ? "bg-primary-500 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-primary-50"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
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
