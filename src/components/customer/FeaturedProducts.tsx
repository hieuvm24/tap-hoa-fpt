"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductPagedGrid } from "./ProductPagedGrid";
import { Button } from "@/components/ui";
import { api } from "@/lib/api";
import { Product } from "@/types";

const FETCH_LIMIT = 32;

export function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const featuredRes = await api.products.list({
        featured: "true",
        limit: String(FETCH_LIMIT),
      });
      let list: Product[] = [];
      if (featuredRes.success && featuredRes.data) {
        list = Array.isArray(featuredRes.data)
          ? featuredRes.data
          : featuredRes.data.products;
      }

      if (list.length < FETCH_LIMIT) {
        const moreRes = await api.products.list({
          limit: String(FETCH_LIMIT),
          sort: "sold",
        });
        if (moreRes.success && moreRes.data) {
          const more = Array.isArray(moreRes.data)
            ? moreRes.data
            : moreRes.data.products;
          const seen = new Set(list.map((p) => p.id));
          for (const p of more) {
            if (seen.has(p.id)) continue;
            list.push(p);
            seen.add(p.id);
            if (list.length >= FETCH_LIMIT) break;
          }
        }
      }

      if (!cancelled) {
        setProducts(list.slice(0, FETCH_LIMIT));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-12 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              Sản phẩm nổi bật
            </h2>
            <p className="text-gray-500">Hàng tươi, giá tốt mỗi ngày</p>
          </div>
          <Link href="/danh-muc" className="hidden sm:block">
            <Button variant="ghost" className="gap-1">
              Xem tất cả
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <ProductPagedGrid products={products} loading={loading} />

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
