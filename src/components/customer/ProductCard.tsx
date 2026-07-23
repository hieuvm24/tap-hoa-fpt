"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Eye, Heart } from "lucide-react";
import { Product } from "@/types";
import { formatPrice, calculateDiscount, cn } from "@/lib/utils";
import { Card, Button, StarRating, Badge } from "@/components/ui";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const discount = calculateDiscount(product.price, product.originalPrice);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [liked, setLiked] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product);
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push("/dang-nhap?redirect=/yeu-thich");
      return;
    }
    const next = !liked;
    setLiked(next);
    const res = next
      ? await api.wishlist.add(product.id)
      : await api.wishlist.remove(product.id);
    if (!res.success) setLiked(!next);
  };

  return (
    <Card hover padding="none" className="group overflow-hidden">
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized={product.image.startsWith("/uploads/")}
        />
        {discount > 0 && (
          <Badge variant="danger" className="absolute top-2 left-2">
            -{discount}%
          </Badge>
        )}
        <button
          type="button"
          onClick={toggleWishlist}
          className={cn(
            "absolute top-2 right-2 z-10 rounded-full bg-white/90 p-1.5 shadow transition-colors",
            liked ? "text-red-500" : "text-gray-400 hover:text-red-500"
          )}
          aria-label="Yêu thích"
        >
          <Heart className={cn("h-4 w-4", liked && "fill-current")} />
        </button>
      </div>

      <div className="p-3 sm:p-4">
        <Link href={`/san-pham/${product.slug}`}>
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-primary-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-2">
          <StarRating rating={product.rating} />
          <span className="text-xs text-gray-400">({product.reviewCount})</span>
        </div>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-base sm:text-lg font-bold text-primary-600">
            {formatPrice(product.price)}
          </span>
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 gap-1" onClick={handleAddToCart}>
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Thêm giỏ</span>
          </Button>
          <Link href={`/san-pham/${product.slug}`}>
            <Button variant="outline" size="sm" className="px-2.5">
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
