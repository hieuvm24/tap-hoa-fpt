"use client";

import { useState, useEffect, use, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { Minus, Plus, ShoppingCart, Zap, ChevronLeft } from "lucide-react";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { Button, Badge, StarRating, Card, Textarea } from "@/components/ui";
import { ProductRecommendations } from "@/components/customer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { useRequireLogin } from "@/hooks/useRequireLogin";
import { Product, Review } from "@/types";

function ProductDetailContent({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const requireLogin = useRequireLogin();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    api.products.getBySlug(slug).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setProduct(res.data.product);
        setReviews(res.data.reviews);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const reloadProduct = () => {
    api.products.getBySlug(slug).then((res) => {
      if (res.success && res.data) {
        setProduct(res.data.product);
        setReviews(res.data.reviews);
      }
    });
  };

  if (loading) {
    return <div className="p-8 text-center">Đang tải...</div>;
  }

  if (!product) notFound();

  const discount = calculateDiscount(product.price, product.originalPrice);

  const handleAddToCart = () => {
    if (!requireLogin(`/san-pham/${slug}`)) return;
    addItem(product, quantity);
  };

  const handleBuyNow = () => {
    if (!requireLogin(`/san-pham/${slug}`)) return;
    addItem(product, quantity);
    router.push("/thanh-toan");
  };

  const handleSubmitReview = async () => {
    if (!requireLogin(`/san-pham/${slug}`)) return;
    setSubmittingReview(true);
    const res = await api.reviews.create({
      productId: product.id,
      rating,
      comment,
    });
    setSubmittingReview(false);
    if (res.success) {
      setComment("");
      setRating(5);
      reloadProduct();
    } else {
      alert(res.error || "Không gửi được đánh giá");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/danh-muc"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại danh mục
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-white border border-gray-100 mb-4">
            <Image
              src={product.images[selectedImage] || product.image}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
            {discount > 0 && (
              <Badge variant="danger" className="absolute top-4 left-4 text-sm px-3 py-1">
                -{discount}%
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-lg border-2 transition-colors ${
                  selectedImage === i ? "border-primary-500" : "border-gray-200"
                }`}
              >
                <Image src={img} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-primary-600 font-medium mb-1">{product.brand}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={product.rating} size="md" />
            <span className="text-sm text-gray-500">
              {product.rating} ({product.reviewCount} đánh giá)
              {product.soldCount > 0 ? ` · Đã bán ${product.soldCount}` : ""}
            </span>
          </div>
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-primary-600">{formatPrice(product.price)}</span>
            {discount > 0 && (
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm text-gray-500">Số lượng:</span>
            <div className="flex items-center rounded-lg border border-gray-200">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 hover:bg-gray-50 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="p-2 hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 mb-8">
            <Button size="lg" className="flex-1 sm:flex-none gap-2" onClick={handleAddToCart}>
              <ShoppingCart className="h-5 w-5" />
              Thêm vào giỏ
            </Button>
            <Button variant="secondary" size="lg" className="flex-1 sm:flex-none gap-2" onClick={handleBuyNow}>
              <Zap className="h-5 w-5" />
              Mua ngay
            </Button>
          </div>
          <Card padding="sm" className="bg-gray-50">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key} className="text-sm">
                  <span className="text-gray-500">{key}: </span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Mô tả sản phẩm</h2>
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          </Card>
        </div>
        <div>
          <Card>
            <h2 className="text-lg font-semibold mb-4">Đánh giá ({product.reviewCount})</h2>
            <div className="space-y-4 mb-6">
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <StarRating rating={review.rating} />
                    <span className="text-sm font-medium">{review.customerName}</span>
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-sm text-gray-500">Chưa có đánh giá nào.</p>
              )}
            </div>
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-medium text-sm">Viết đánh giá</h3>
              <p className="text-xs text-gray-500">
                Chỉ khách đã mua và nhận hàng thành công mới gửi được đánh giá (mỗi SP một lần).
              </p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Số sao:</span>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <Textarea
                rows={3}
                placeholder="Chia sẻ trải nghiệm của bạn..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <Button size="sm" onClick={handleSubmitReview} isLoading={submittingReview}>
                {isAuthenticated ? "Gửi đánh giá" : "Đăng nhập để đánh giá"}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-gray-100">
        <ProductRecommendations product={product} variant="bought-together" limit={4} />
        <ProductRecommendations product={product} variant="similar" limit={4} />
        <ProductRecommendations product={product} variant="recent" limit={4} />
      </div>
    </div>
  );
}

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = use(params);
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <ProductDetailContent slug={slug} />
    </Suspense>
  );
}
