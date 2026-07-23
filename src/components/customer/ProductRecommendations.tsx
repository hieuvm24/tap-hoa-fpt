"use client";

import { useEffect, useState } from "react";
import { Sparkles, ShoppingBag, Eye } from "lucide-react";
import { Product } from "@/types";
import {
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getPersonalizedRecommendations,
  trackRecentlyViewed,
  getRecentlyViewed,
} from "@/lib/recommendations";
import { ProductCard } from "./ProductCard";
import { api } from "@/lib/api";

interface ProductRecommendationsProps {
  product?: Product;
  variant?: "similar" | "bought-together" | "personalized" | "recent";
  title?: string;
  limit?: number;
}

export function ProductRecommendations({
  product,
  variant = "personalized",
  title,
  limit = 4,
}: ProductRecommendationsProps) {
  const [items, setItems] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.products.list({ limit: "100" }).then((res) => {
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.products;
        setAllProducts(list);
      }
    });
  }, []);

  useEffect(() => {
    if (product) trackRecentlyViewed(product.id);

    const recentIds =
      typeof window !== "undefined"
        ? (() => {
            try {
              return (JSON.parse(localStorage.getItem("taphoa_recently_viewed") || "[]") as string[]).join(",");
            } catch {
              return "";
            }
          })()
        : "";

    if (variant === "recent") {
      if (!allProducts.length) return;
      setItems(getRecentlyViewed(allProducts, product?.id));
      return;
    }

    const params: Record<string, string> = {
      type: variant === "bought-together" ? "bought-together" : variant === "similar" ? "similar" : "personalized",
      limit: String(limit),
    };
    if (product?.id) params.productId = product.id;
    if (recentIds) params.recentIds = recentIds;

    api.recommendations.get(params).then((res) => {
      if (res.success && res.data?.products?.length) {
        setItems(res.data.products);
        return;
      }
      if (!allProducts.length) return;
      let result: Product[] = [];
      switch (variant) {
        case "similar":
          if (product) result = getSimilarProducts(product, allProducts, limit);
          break;
        case "bought-together":
          if (product) result = getFrequentlyBoughtTogether(product, allProducts, limit);
          break;
        default:
          result = getPersonalizedRecommendations(allProducts, limit);
      }
      setItems(result);
    });
  }, [product, variant, limit, allProducts]);

  if (items.length === 0) return null;

  const config = {
    similar: {
      icon: Sparkles,
      defaultTitle: "Sản phẩm tương tự",
      subtitle: "Gợi ý dựa trên danh mục, giá và đánh giá",
    },
    "bought-together": {
      icon: ShoppingBag,
      defaultTitle: "Thường mua kèm",
      subtitle: "Khách hàng thường mua cùng sản phẩm này",
    },
    personalized: {
      icon: Sparkles,
      defaultTitle: "Gợi ý dành cho bạn",
      subtitle: "Dựa trên sản phẩm bạn đã xem",
    },
    recent: {
      icon: Eye,
      defaultTitle: "Đã xem gần đây",
      subtitle: "Tiếp tục mua sắm",
    },
  }[variant];

  const Icon = config.icon;

  return (
    <section className="py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-5 w-5 text-primary-500" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {title || config.defaultTitle}
          </h2>
        </div>
        <p className="text-sm text-gray-500">{config.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
