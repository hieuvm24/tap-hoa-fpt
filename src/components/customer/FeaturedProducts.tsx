"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Button, ProductCardSkeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { Product } from "@/types";

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.products
      .list({ featured: "true", limit: "8" })
      .then((res) => {
        if (res.success && res.data) {
          setProducts(Array.isArray(res.data) ? res.data : res.data.products);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-12 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Sản phẩm nổi bật</h2>
            <p className="text-gray-500">Hàng tươi, giá tốt mỗi ngày</p>
          </div>
          <Link href="/danh-muc" className="hidden sm:block">
            <Button variant="ghost" className="gap-1">
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link href="/danh-muc">
            <Button variant="outline" className="gap-1">
              Xem tất cả sản phẩm
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
