"use client";

import { useEffect, useState } from "react";
import { Sparkles, ShoppingBag, Eye, TrendingUp, PackagePlus } from "lucide-react";
import { Product } from "@/types";
import {
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getPersonalizedRecommendations,
  getCartRecommendations,
  getBestsellers,
  trackRecentlyViewed,
  getRecentlyViewed,
  getRecentIds,
} from "@/lib/recommendations";
import { ProductCard } from "./ProductCard";
import { api } from "@/lib/api";

export type RecVariant =
  | "similar"
  | "bought-together"
  | "personalized"
  | "recent"
  | "bestsellers"
  | "cart";

interface ProductRecommendationsProps {
  product?: Product;
  /** ID sản phẩm trong giỏ — dùng với variant=cart */
  cartProductIds?: string[];
  variant?: RecVariant;
  title?: string;
  limit?: number;
  className?: string;
}

export function ProductRecommendations({
  product,
  cartProductIds,
  variant = "personalized",
  title,
  limit = 4,
  className,
}: ProductRecommendationsProps) {
  const [items, setItems] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    api.products.list({ limit: "200" }).then((res) => {
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.products;
        setAllProducts(list);
      }
    });
  }, []);

  useEffect(() => {
    if (product) trackRecentlyViewed(product.id);

    const recentIds = getRecentIds().join(",");

    if (variant === "recent") {
      if (!allProducts.length) return;
      setItems(getRecentlyViewed(allProducts, product?.id));
      return;
    }

    const params: Record<string, string> = {
      type:
        variant === "bought-together"
          ? "bought-together"
          : variant === "similar"
            ? "similar"
            : variant === "bestsellers"
              ? "bestsellers"
              : variant === "cart"
                ? "cart"
                : "personalized",
      limit: String(limit),
    };
    if (product?.id) params.productId = product.id;
    if (recentIds) params.recentIds = recentIds;
    if (variant === "cart" && cartProductIds?.length) {
      params.cartIds = cartProductIds.join(",");
    }

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
          if (product)
            result = getFrequentlyBoughtTogether(product, allProducts, limit);
          break;
        case "bestsellers":
          result = getBestsellers(allProducts, limit);
          break;
        case "cart": {
          const cartPs = (cartProductIds || [])
            .map((id) => allProducts.find((p) => p.id === id))
            .filter((p): p is Product => !!p);
          result = getCartRecommendations(cartPs, allProducts, limit);
          break;
        }
        default:
          result = getPersonalizedRecommendations(allProducts, limit);
      }
      setItems(result);
    });
  }, [product, variant, limit, allProducts, cartProductIds]);

  if (items.length === 0) return null;

  const config = {
    similar: {
      icon: Sparkles,
      defaultTitle: "Sản phẩm tương tự",
      subtitle: "Gợi ý theo danh mục, giá và đánh giá",
    },
    "bought-together": {
      icon: ShoppingBag,
      defaultTitle: "Thường mua kèm",
      subtitle: "Dựa trên đơn hàng thực tế & thói quen mua sắm",
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
    bestsellers: {
      icon: TrendingUp,
      defaultTitle: "Bán chạy tại quầy",
      subtitle: "Sản phẩm được mua nhiều nhất",
    },
    cart: {
      icon: PackagePlus,
      defaultTitle: "Có thể bạn cần thêm",
      subtitle: "Gợi ý bổ sung dựa trên giỏ hàng của bạn",
    },
  }[variant];

  const Icon = config.icon;

  return (
    <section className={className ?? "py-8"}>
      <div className="mb-6">
        <div className="mb-1 flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary-500" />
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {title || config.defaultTitle}
          </h2>
        </div>
        <p className="text-sm text-gray-500">{config.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
