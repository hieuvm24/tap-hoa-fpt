"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sparkles,
  ShoppingBag,
  Eye,
  TrendingUp,
  PackagePlus,
} from "lucide-react";
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
import { ProductPagedGrid } from "./ProductPagedGrid";
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
  /** Ẩn subtitle lý do gợi ý */
  hideReasons?: boolean;
}

export function ProductRecommendations({
  product,
  cartProductIds,
  variant = "personalized",
  title,
  limit = 4,
  className,
  hideReasons = false,
}: ProductRecommendationsProps) {
  const [items, setItems] = useState<Product[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [source, setSource] = useState<string>("");
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const cartKey = useMemo(
    () => (cartProductIds || []).join(","),
    [cartProductIds]
  );

  useEffect(() => {
    api.products.list({ limit: "120", sort: "sold" }).then((res) => {
      if (res.success && res.data) {
        const list = Array.isArray(res.data) ? res.data : res.data.products;
        setAllProducts(list);
      }
    });
  }, []);

  useEffect(() => {
    if (product) trackRecentlyViewed(product.id);

    const recentIds = getRecentIds();

    if (variant === "recent") {
      const ids = recentIds.filter((id) => id !== product?.id).slice(0, limit);
      if (ids.length === 0) {
        setItems([]);
        setReasons({});
        return;
      }
      api.recommendations
        .get({
          type: "recent",
          recentIds: ids.join(","),
          limit: String(limit),
          ...(product?.id ? { productId: product.id } : {}),
        })
        .then((res) => {
          if (res.success && res.data?.products?.length) {
            setItems(res.data.products);
            setSource(res.data.source || "content");
            setReasons(res.data.reasons || {});
          } else if (allProducts.length) {
            setItems(getRecentlyViewed(allProducts, product?.id).slice(0, limit));
            setSource("content");
          }
        });
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
    if (recentIds.length) params.recentIds = recentIds.join(",");
    if (variant === "cart" && cartProductIds?.length) {
      params.cartIds = cartProductIds.join(",");
    }

    let cancelled = false;
    api.recommendations.get(params).then((res) => {
      if (cancelled) return;
      if (res.success && res.data?.products?.length) {
        setItems(res.data.products);
        setSource(res.data.source || "");
        setReasons(res.data.reasons || {});
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
          result = getPersonalizedRecommendations(
            allProducts,
            limit,
            recentIds
          );
      }
      setItems(result);
      setSource("content");
      setReasons({});
    });

    return () => {
      cancelled = true;
    };
  }, [product, variant, limit, allProducts, cartKey, cartProductIds]);

  if (items.length === 0) return null;

  const config = {
    similar: {
      icon: Sparkles,
      defaultTitle: "Sản phẩm tương tự",
      subtitle: "Theo danh mục, giá và hành vi mua hàng",
    },
    "bought-together": {
      icon: ShoppingBag,
      defaultTitle: "Thường mua kèm",
      subtitle: "Từ đơn hàng thực tế & thói quen mua sắm tạp hóa",
    },
    personalized: {
      icon: Sparkles,
      defaultTitle: "Gợi ý dành cho bạn",
      subtitle: "Dựa trên đã xem, đã mua và sản phẩm yêu thích",
    },
    recent: {
      icon: Eye,
      defaultTitle: "Đã xem gần đây",
      subtitle: "Tiếp tục mua sắm",
    },
    bestsellers: {
      icon: TrendingUp,
      defaultTitle: "Bán chạy nhất cửa hàng",
      subtitle: "Kết hợp doanh số tổng & xu hướng 14 ngày gần đây",
    },
    cart: {
      icon: PackagePlus,
      defaultTitle: "Có thể bạn cần thêm",
      subtitle: "Gợi ý bổ sung dựa trên giỏ hàng của bạn",
    },
  }[variant];

  const Icon = config.icon;
  const sourceLabel =
    source === "hybrid"
      ? "Hybrid"
      : source === "orders"
        ? "Đơn hàng"
        : source === "popularity"
          ? "Xu hướng"
          : null;

  return (
    <section className={className ?? "py-8"}>
      <div className="mb-6">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Icon className="h-5 w-5 text-primary-500" />
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
            {title || config.defaultTitle}
          </h2>
          {sourceLabel && (
            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
              {sourceLabel}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{config.subtitle}</p>
      </div>
      <ProductPagedGrid
        products={items}
        reasons={reasons}
        hideReasons={hideReasons}
      />
    </section>
  );
}
