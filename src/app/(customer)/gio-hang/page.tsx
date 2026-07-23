"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag, Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button, Card, Input } from "@/components/ui";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const [voucher, setVoucher] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState("");
  const [discount, setDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState("");

  const shippingFee = subtotal >= 200000 ? 0 : 15000;
  const total = subtotal + shippingFee - discount;

  const applyVoucher = async () => {
    if (!voucher.trim()) return;
    const res = await api.vouchers.validate(voucher, subtotal);
    if (res.success && res.data) {
      setDiscount(res.data.discount);
      setAppliedVoucher(res.data.code);
      setVoucherError("");
    } else {
      setDiscount(0);
      setAppliedVoucher("");
      setVoucherError(res.error || "Mã không hợp lệ");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Giỏ hàng</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Giỏ hàng trống</p>
          <Link href="/danh-muc">
            <Button>Tiếp tục mua sắm</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.productId} className="flex gap-4">
                <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-lg">
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/san-pham/${item.slug}`}>
                    <h3 className="font-medium text-gray-900 hover:text-primary-600 transition-colors truncate">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-primary-600 font-semibold mt-1">{formatPrice(item.price)}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center rounded-lg border border-gray-200">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="p-1.5 hover:bg-gray-50"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="p-1.5 hover:bg-gray-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="font-semibold text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          <div>
            <Card className="sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Tóm tắt đơn hàng</h2>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Tạm tính</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phí giao hàng</span>
                  <span>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá ({appliedVoucher})</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Mã voucher"
                  value={voucher}
                  onChange={(e) => setVoucher(e.target.value)}
                  icon={<Tag className="h-4 w-4" />}
                />
                <Button variant="outline" size="sm" className="flex-shrink-0" onClick={applyVoucher}>
                  Áp dụng
                </Button>
              </div>
              {voucherError && <p className="text-xs text-red-500 mb-2">{voucherError}</p>}

              <div className="flex justify-between font-bold text-lg border-t pt-4 mb-4">
                <span>Tổng cộng</span>
                <span className="text-primary-600">{formatPrice(total)}</span>
              </div>

              <Link
                href={`/thanh-toan${appliedVoucher ? `?voucher=${appliedVoucher}` : ""}`}
                className="block"
              >
                <Button size="lg" className="w-full">
                  Thanh toán
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
