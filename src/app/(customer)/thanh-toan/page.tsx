"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Banknote, LogIn, QrCode } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";
import type { Address, StoreInfo } from "@/types";

type PaymentMethod = "cod" | "transfer" | "vnpay";

function CheckoutContent() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const { isAuthenticated, user } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const voucherCode = searchParams.get("voucher") || "";

  useEffect(() => {
    if (user) {
      setCustomerName(user.name);
      setCustomerPhone(user.phone || "");
    }
  }, [user]);

  useEffect(() => {
    api.store.get().then((res) => {
      if (res.success && res.data) setStore(res.data);
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.addresses.list().then((res) => {
      if (res.success && res.data) {
        setAddresses(res.data);
        const def = res.data.find((a) => a.isDefault) || res.data[0];
        if (def) {
          setCustomerName(def.fullName);
          setCustomerPhone(def.phone);
          setAddress(def.address);
        }
      }
    });
  }, [isAuthenticated]);

  useEffect(() => {
    if (voucherCode && subtotal > 0) {
      api.vouchers.validate(voucherCode, subtotal).then((res) => {
        if (res.success && res.data) setDiscount(res.data.discount);
      });
    }
  }, [voucherCode, subtotal]);

  const shippingFee = subtotal >= 200000 ? 0 : 15000;
  const total = subtotal + shippingFee - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;
    setIsSubmitting(true);
    const res = await api.orders.create({
      customerName,
      customerPhone,
      customerEmail: user?.email,
      address,
      note,
      paymentMethod,
      voucherCode: voucherCode || undefined,
      items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });

    if (!res.success || !res.data) {
      setIsSubmitting(false);
      alert(res.error || "Đặt hàng thất bại");
      return;
    }

    clearCart();

    if (paymentMethod === "vnpay") {
      const pay = await api.payments.createVnpay({ orderCode: res.data.orderCode });
      setIsSubmitting(false);
      if (pay.success && pay.data?.paymentUrl) {
        window.location.href = pay.data.paymentUrl;
        return;
      }
      alert(pay.error || "Không tạo được link VNPay. Đơn đã được lưu, bạn có thể thanh toán sau.");
      router.push(`/don-hang?code=${res.data.orderCode}`);
      return;
    }

    setIsSubmitting(false);
    router.push(`/don-hang?code=${res.data.orderCode}`);
  };

  if (!items.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Giỏ hàng trống</p>
        <Link href="/danh-muc">
          <Button>Tiếp tục mua sắm</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Thanh toán</h1>
      {!isAuthenticated && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
          <p className="text-sm text-primary-800">
            <LogIn className="inline h-4 w-4 mr-1" />
            Đăng nhập để theo dõi đơn hàng dễ dàng hơn
          </p>
          <Link href="/dang-nhap?redirect=/thanh-toan">
            <Button size="sm" variant="outline">
              Đăng nhập
            </Button>
          </Link>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Thông tin giao hàng</h2>
              {addresses.length > 0 && (
                <div className="mb-4 space-y-2">
                  <p className="text-sm text-gray-500">Chọn địa chỉ đã lưu</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {addresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setCustomerName(a.fullName);
                          setCustomerPhone(a.phone);
                          setAddress(a.address);
                        }}
                        className="rounded-xl border border-gray-200 p-3 text-left text-sm hover:border-primary-400"
                      >
                        <p className="font-medium">
                          {a.label} {a.isDefault ? "(Mặc định)" : ""}
                        </p>
                        <p className="text-gray-500 line-clamp-2">{a.address}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Họ tên"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
                <Input
                  label="Số điện thoại"
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <Input
                  label="Địa chỉ giao hàng"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="mt-4">
                <Textarea
                  label="Ghi chú"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </Card>
            <Card>
              <h2 className="text-lg font-semibold mb-4">Phương thức thanh toán</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("cod")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-4",
                    paymentMethod === "cod"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200"
                  )}
                >
                  <Banknote className="h-6 w-6 text-primary-600" />
                  <div className="text-left">
                    <p className="font-medium">COD</p>
                    <p className="text-xs text-gray-500">Khi nhận hàng</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("transfer")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-4",
                    paymentMethod === "transfer"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200"
                  )}
                >
                  <CreditCard className="h-6 w-6 text-primary-600" />
                  <div className="text-left">
                    <p className="font-medium">Chuyển khoản</p>
                    <p className="text-xs text-gray-500">Ngân hàng</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("vnpay")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-4",
                    paymentMethod === "vnpay"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200"
                  )}
                >
                  <QrCode className="h-6 w-6 text-primary-600" />
                  <div className="text-left">
                    <p className="font-medium">VNPay</p>
                    <p className="text-xs text-gray-500">QR / Thẻ / App</p>
                  </div>
                </button>
              </div>
              {paymentMethod === "transfer" && store && (
                <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm space-y-1">
                  <p>
                    <span className="text-gray-500">Ngân hàng:</span>{" "}
                    <strong>{store.bankName || "Vietcombank"}</strong>
                  </p>
                  <p>
                    <span className="text-gray-500">STK:</span>{" "}
                    <strong>{store.bankAccount || "0123456789"}</strong>
                  </p>
                  <p>
                    <span className="text-gray-500">Chủ TK:</span>{" "}
                    <strong>{store.bankOwner || "TAP HOA FPT"}</strong>
                  </p>
                  <p className="text-gray-500 pt-1">
                    Nội dung CK: mã đơn hàng (hiển thị sau khi đặt)
                  </p>
                </div>
              )}
              {paymentMethod === "vnpay" && (
                <p className="mt-3 text-sm text-gray-500">
                  Sau khi đặt hàng, bạn sẽ được chuyển tới cổng VNPay để thanh toán
                  an toàn. (Chế độ demo hoạt động khi chưa cấu hình khóa sandbox.)
                </p>
              )}
            </Card>
          </div>
          <div>
            <Card className="sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Đơn hàng</h2>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
              <div className="space-y-2 text-sm border-t pt-4 mb-4">
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
                    <span>Giảm giá</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2">
                  <span>Tổng cộng</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
                {paymentMethod === "vnpay" ? "Đặt hàng & thanh toán VNPay" : "Đặt hàng"}
              </Button>
              <Link
                href="/gio-hang"
                className="block text-center text-sm text-gray-500 hover:text-primary-600 mt-3"
              >
                ← Quay lại giỏ hàng
              </Link>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
