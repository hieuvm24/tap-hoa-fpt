"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Banknote, QrCode, Truck, Store } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { api } from "@/lib/api";
import { FREE_SHIP_THRESHOLD, SHIPPING_FEE, DEFAULT_STORE } from "@/config/defaults";
import { calcPromotionDiscount } from "@/lib/promotions";
import type { Address, Promotion, StoreInfo } from "@/types";

type PaymentMethod = "cod" | "transfer" | "vnpay";
type Fulfillment = "delivery" | "pickup";

function CheckoutContent() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoLabels, setPromoLabels] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const { isAuthenticated, user } = useAuth();
  const { items, subtotal, clearCart, syncFromServer } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const voucherCode = searchParams.get("voucher") || "";

  useEffect(() => {
    if (items.length === 0) return;
    void syncFromServer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    api.promotions.list().then((res) => {
      if (res.success && res.data) setPromotions(res.data);
    });
  }, []);

  useEffect(() => {
    const { amount, labels } = calcPromotionDiscount(
      promotions.map((p) => ({
        title: p.title,
        discount: p.discount,
        ruleType: p.ruleType,
        categorySlug: p.categorySlug ?? null,
      })),
      items
        .filter((i) => i.categorySlug)
        .map((i) => ({
          categorySlug: i.categorySlug!,
          price: i.price,
          quantity: i.quantity,
        }))
    );
    setPromoDiscount(amount);
    setPromoLabels(labels);
  }, [items, promotions]);

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

  const shippingFee =
    fulfillment === "pickup"
      ? 0
      : subtotal >= FREE_SHIP_THRESHOLD
        ? 0
        : SHIPPING_FEE;
  const totalDiscount = Math.min(subtotal, discount + promoDiscount);
  const total = subtotal + shippingFee - totalDiscount;
  const storeAddress = store?.address || DEFAULT_STORE.address;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;
    setIsSubmitting(true);

    const sync = await syncFromServer();
    if (sync.warnings.length) {
      const cont = confirm(
        sync.warnings.join("\n") + "\n\nTiếp tục đặt hàng với giỏ đã cập nhật?"
      );
      if (!cont) {
        setIsSubmitting(false);
        return;
      }
    }

    // Lấy lại snapshot sau sync (state React có thể chưa kịp cập nhật)
    const validated = await api.cart.validate(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
    );
    const orderItems =
      validated.success && validated.data
        ? validated.data.items
            .filter((i) => !i.removed && i.quantity > 0)
            .map((i) => ({ productId: i.productId, quantity: i.quantity }))
        : items.map((i) => ({ productId: i.productId, quantity: i.quantity }));

    if (!orderItems.length) {
      setIsSubmitting(false);
      alert("Giỏ hàng trống hoặc hết hàng. Vui lòng chọn lại sản phẩm.");
      return;
    }

    const res = await api.orders.create({
      customerName,
      customerPhone,
      customerEmail: user?.email,
      address: fulfillment === "pickup" ? storeAddress : address,
      note,
      paymentMethod:
        fulfillment === "pickup" && paymentMethod === "cod"
          ? "cod"
          : paymentMethod,
      fulfillmentType: fulfillment,
      voucherCode: voucherCode || undefined,
      items: orderItems,
    });

    if (!res.success || !res.data) {
      setIsSubmitting(false);
      alert(res.error || "Đặt hàng thất bại");
      return;
    }

    const orderCode = res.data.orderCode;

    if (paymentMethod === "vnpay") {
      const pay = await api.payments.createVnpay({ orderCode });
      setIsSubmitting(false);
      if (pay.success && pay.data?.paymentUrl) {
        clearCart();
        window.location.href = pay.data.paymentUrl;
        return;
      }
      alert(
        pay.error ||
          "Không tạo được link VNPay. Đơn đã được lưu — bạn có thể thanh toán sau hoặc chọn COD."
      );
      clearCart();
      router.push(
        `/don-hang?code=${orderCode}&phone=${encodeURIComponent(customerPhone)}`
      );
      return;
    }

    clearCart();
    setIsSubmitting(false);
    router.push(
      `/don-hang?code=${orderCode}&phone=${encodeURIComponent(customerPhone)}`
    );
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
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-lg font-semibold mb-4">Hình thức nhận hàng</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setFulfillment("delivery")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-4 text-left",
                    fulfillment === "delivery"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200"
                  )}
                >
                  <Truck className="h-6 w-6 text-primary-600 shrink-0" />
                  <div>
                    <p className="font-medium">Giao tận nơi</p>
                    <p className="text-xs text-gray-500">
                      Phí {formatPrice(SHIPPING_FEE)} · miễn phí từ{" "}
                      {FREE_SHIP_THRESHOLD / 1000}K
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillment("pickup")}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border-2 p-4 text-left",
                    fulfillment === "pickup"
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-200"
                  )}
                >
                  <Store className="h-6 w-6 text-primary-600 shrink-0" />
                  <div>
                    <p className="font-medium">Đến lấy tại quầy</p>
                    <p className="text-xs text-gray-500">Không tính phí ship</p>
                  </div>
                </button>
              </div>

              <h2 className="text-lg font-semibold mb-4">Thông tin người nhận</h2>
              {fulfillment === "delivery" && addresses.length > 0 && (
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
              {fulfillment === "delivery" ? (
                <div className="mt-4">
                  <Input
                    label="Địa chỉ giao hàng"
                    required
                    placeholder="Thôn/xóm, xã, huyện Gia Viễn..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-900">
                  <p className="font-medium mb-1">Nhận tại cửa hàng</p>
                  <p>{storeAddress}</p>
                  <p className="text-emerald-700 mt-1">
                    Giờ mở cửa: {store?.openHours || DEFAULT_STORE.openHours}
                  </p>
                </div>
              )}
              <div className="mt-4">
                <Textarea
                  label="Ghi chú"
                  rows={3}
                  placeholder={
                    fulfillment === "pickup"
                      ? "VD: Lấy sau 17h, gọi trước khi đến..."
                      : "VD: Gọi trước khi giao..."
                  }
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
                    <p className="font-medium">
                      {fulfillment === "pickup" ? "Trả tại quầy" : "Khi nhận hàng"}
                    </p>
                    <p className="text-xs text-gray-500">Tiền mặt</p>
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
                    <strong>{store.bankName || DEFAULT_STORE.bankName}</strong>
                  </p>
                  <p>
                    <span className="text-gray-500">STK:</span>{" "}
                    <strong>{store.bankAccount || DEFAULT_STORE.bankAccount}</strong>
                  </p>
                  <p>
                    <span className="text-gray-500">Chủ TK:</span>{" "}
                    <strong>{store.bankOwner || DEFAULT_STORE.bankOwner}</strong>
                  </p>
                  <p className="text-gray-500 pt-1">
                    Nội dung CK: mã đơn hàng (hiển thị sau khi đặt). Có thể cập nhật STK trong Cài đặt cửa hàng.
                  </p>
                </div>
              )}
              {paymentMethod === "vnpay" && (
                <p className="mt-3 text-sm text-gray-500">
                  Sau khi đặt hàng bạn sẽ chuyển tới cổng VNPay. Nếu chưa cấu hình khóa thật, hệ thống dùng chế độ demo cho đồ án.
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
                  <span className="text-gray-500">
                    {fulfillment === "pickup" ? "Phí nhận tại quầy" : "Phí giao hàng"}
                  </span>
                  <span>{shippingFee === 0 ? "Miễn phí" : formatPrice(shippingFee)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span className="truncate pr-2">
                      KM {promoLabels[0] || ""}
                    </span>
                    <span>-{formatPrice(promoDiscount)}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Voucher</span>
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
