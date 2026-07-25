"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Package, Check, Truck, Clock, X, Store } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge, Card, Button, Input } from "@/components/ui";
import { Order, OrderStatus } from "@/types";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    variant: "default" | "success" | "warning" | "danger" | "info";
    icon: typeof Package;
  }
> = {
  pending: { label: "Chờ xác nhận", variant: "warning", icon: Clock },
  confirmed: { label: "Đã xác nhận", variant: "info", icon: Check },
  shipping: { label: "Đang giao", variant: "info", icon: Truck },
  delivered: { label: "Hoàn thành", variant: "success", icon: Package },
  cancelled: { label: "Đã hủy", variant: "danger", icon: X },
};

const paymentMethodLabels: Record<string, string> = {
  cod: "Khi nhận hàng / tại quầy",
  transfer: "Chuyển khoản",
  vnpay: "VNPay",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Chưa thanh toán",
  paid: "Đã thanh toán",
  failed: "Thanh toán thất bại",
};

function deliverySteps(order: Order): OrderStatus[] {
  if (order.fulfillmentType === "pickup") {
    return ["pending", "confirmed", "delivered"];
  }
  return ["pending", "confirmed", "shipping", "delivered"];
}

function OrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [lookupCode, setLookupCode] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [guestMode, setGuestMode] = useState(false);
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const newOrderCode = searchParams.get("code");
  const phoneParam = searchParams.get("phone") || "";

  useEffect(() => {
    if (newOrderCode) setLookupCode(newOrderCode);
    if (phoneParam) setLookupPhone(phoneParam);
  }, [newOrderCode, phoneParam]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      // Tự tra cứu nếu có code + phone trên URL (sau đặt hàng khách)
      if (newOrderCode && phoneParam) {
        void lookupOrder(newOrderCode, phoneParam);
      }
      return;
    }
    api.orders.list({ mine: "true" }).then((res) => {
      if (res.success && res.data) {
        setOrders(res.data);
        const selected = newOrderCode
          ? res.data.find((o) => o.orderCode === newOrderCode) || res.data[0]
          : res.data[0];
        setSelectedOrder(selected || null);
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, newOrderCode]);

  async function lookupOrder(code: string, phone: string) {
    setLookupError("");
    setLoading(true);
    const res = await api.orders.list({
      code: code.trim().toUpperCase(),
      phone: phone.trim(),
    });
    setLoading(false);
    if (res.success && res.data?.length) {
      setOrders(res.data);
      setSelectedOrder(res.data[0]);
      setGuestMode(true);
    } else {
      setLookupError(res.error || "Không tìm thấy đơn hàng");
      setOrders([]);
      setSelectedOrder(null);
    }
  }

  if (!isAuthenticated && !guestMode) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tra cứu đơn hàng</h1>
        <p className="text-gray-500 text-sm mb-6">
          Nhập mã đơn và số điện thoại đã dùng khi đặt hàng. Hoặc{" "}
          <Link href="/dang-nhap?redirect=/don-hang" className="text-primary-600 underline">
            đăng nhập
          </Link>{" "}
          để xem toàn bộ lịch sử.
        </p>
        {newOrderCode && (
          <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
            Đặt hàng thành công! Mã đơn: <strong>{newOrderCode}</strong>
          </div>
        )}
        <Card className="space-y-4">
          <Input
            label="Mã đơn hàng"
            placeholder="VD: DH..."
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value)}
          />
          <Input
            label="Số điện thoại"
            type="tel"
            placeholder="SĐT đặt hàng"
            value={lookupPhone}
            onChange={(e) => setLookupPhone(e.target.value)}
          />
          {lookupError && <p className="text-sm text-red-600">{lookupError}</p>}
          <Button
            className="w-full"
            isLoading={loading}
            onClick={() => lookupOrder(lookupCode, lookupPhone)}
            disabled={!lookupCode.trim() || !lookupPhone.trim()}
          >
            Tra cứu
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  if (!orders.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào</p>
        <Link href="/danh-muc">
          <Button>Mua sắm ngay</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
        {guestMode ? "Chi tiết đơn hàng" : "Đơn hàng của tôi"}
      </h1>
      {newOrderCode && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-green-800 text-sm">
          Đặt hàng thành công! Mã đơn: <strong>{newOrderCode}</strong>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {orders.map((order) => {
            const config = statusConfig[order.status];
            return (
              <Card
                key={order.id}
                hover
                className={cn(
                  "cursor-pointer transition-all",
                  selectedOrder?.id === order.id && "ring-2 ring-primary-500"
                )}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-primary-600">{order.orderCode}</span>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  {order.fulfillmentType === "pickup" ? (
                    <span className="inline-flex items-center gap-1">
                      <Store className="h-3 w-3" /> Đến lấy
                    </span>
                  ) : (
                    "Giao tận nơi"
                  )}
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{formatDate(order.createdAt)}</span>
                  <span className="font-medium">{formatPrice(order.total)}</span>
                </div>
              </Card>
            );
          })}
        </div>
        {selectedOrder && (
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">
                  Chi tiết đơn {selectedOrder.orderCode}
                </h2>
                <Badge variant={statusConfig[selectedOrder.status].variant}>
                  {statusConfig[selectedOrder.status].label}
                </Badge>
              </div>
              <div className="mb-8">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Trạng thái đơn hàng</h3>
                <div className="flex items-center justify-between relative">
                  <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
                  {deliverySteps(selectedOrder).map((status, i) => {
                    const steps = deliverySteps(selectedOrder);
                    const currentIndex = steps.indexOf(
                      selectedOrder.status === "cancelled"
                        ? "pending"
                        : selectedOrder.status
                    );
                    const isCompleted =
                      i <= currentIndex && selectedOrder.status !== "cancelled";
                    const isCurrent = status === selectedOrder.status;
                    const Icon = statusConfig[status].icon;
                    return (
                      <div key={status} className="relative flex flex-col items-center z-10">
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                            isCompleted
                              ? "bg-primary-500 border-primary-500 text-white"
                              : "bg-white border-gray-300 text-gray-400"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <span
                          className={cn(
                            "text-xs mt-2 text-center max-w-[70px]",
                            isCurrent ? "font-medium text-primary-600" : "text-gray-500"
                          )}
                        >
                          {status === "delivered" &&
                          selectedOrder.fulfillmentType === "pickup"
                            ? "Đã lấy"
                            : statusConfig[status].label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">{selectedOrder.address}</p>
              <div className="space-y-3 mb-6">
                {selectedOrder.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm py-2 border-b border-gray-100 last:border-0"
                  >
                    <span>
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-1 text-sm">
                <div className="flex justify-between font-bold text-base pt-2">
                  <span>Tổng cộng</span>
                  <span className="text-primary-600">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
                <p className="text-gray-500 pt-2">
                  Thanh toán:{" "}
                  {paymentMethodLabels[selectedOrder.paymentMethod] ||
                    selectedOrder.paymentMethod}{" "}
                  · {paymentStatusLabels[selectedOrder.paymentStatus] ||
                    selectedOrder.paymentStatus}
                </p>
                {isAuthenticated &&
                  (selectedOrder.status === "pending" ||
                    selectedOrder.status === "confirmed") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={async () => {
                        if (!confirm("Bạn chắc chắn muốn hủy đơn này?")) return;
                        const res = await api.orders.cancel(selectedOrder.id);
                        if (res.success && res.data) {
                          setOrders((prev) =>
                            prev.map((o) => (o.id === res.data!.id ? res.data! : o))
                          );
                          setSelectedOrder(res.data);
                        } else {
                          alert(res.error || "Không hủy được đơn");
                        }
                      }}
                    >
                      Hủy đơn hàng
                    </Button>
                  )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
