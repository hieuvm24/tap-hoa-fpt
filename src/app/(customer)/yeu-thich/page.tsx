"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { AuthGuard } from "@/components/auth";
import { ProductCard } from "@/components/customer";
import { Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import type { Product } from "@/types";
import { useCart } from "@/context/CartContext";

function WishlistContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  const load = () => {
    api.wishlist.list().then((res) => {
      if (res.success && res.data) {
        setProducts(res.data.map((i) => i.product));
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (productId: string) => {
    await api.wishlist.remove(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Đang tải...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Heart className="h-7 w-7 text-red-500" />
        Sản phẩm yêu thích
      </h1>
      <p className="text-gray-500 mb-8">{products.length} sản phẩm đã lưu</p>

      {products.length === 0 ? (
        <Card className="text-center py-12">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Chưa có sản phẩm yêu thích</p>
          <Link href="/danh-muc">
            <Button>Khám phá sản phẩm</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="relative">
              <ProductCard product={p} />
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={() => addItem(p, 1)}
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Thêm giỏ
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(p.id)}
                  className="text-red-500"
                >
                  Xóa
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WishlistPage() {
  return (
    <AuthGuard allowedRoles={["CUSTOMER"]}>
      <WishlistContent />
    </AuthGuard>
  );
}
