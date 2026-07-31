"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Truck, Package, X, Store, Wallet, Printer, RotateCcw } from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { Modal, Button, Badge } from "@/components/ui";
import { api } from "@/lib/api";

interface OrderDetailModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (id: string, status: OrderStatus) => void;
  onMarkPaid?: (id: string) => void;
  onRefund?: (id: string) => void;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  delivered: "Hoàn thành",
  cancelled: "Đã hủy",
};

const paymentMethodLabels = {
  cod: "Khi nhận hàng",
  transfer: "Chuyển khoản",
  vnpay: "VNPay",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Chưa thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  refunded: "Đã hoàn tiền",
};

function nextStatusFor(order: Order): OrderStatus | null {
  if (order.status === "pending") return "confirmed";
  if (order.status === "confirmed") {
    return order.fulfillmentType === "pickup" ? "delivered" : "shipping";
  }
  if (order.status === "shipping") return "delivered";
  return null;
}

function ProductThumb({ src, alt }: { src?: string; alt: string }) {
  const [broken, setBroken] = useState(!src);
  if (broken) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-[10px] text-gray-400">
        Ảnh
      </div>
    );
  }
  return (
    <Image
      src={src!}
      alt={alt}
      width={40}
      height={40}
      className="h-10 w-10 shrink-0 rounded-md object-cover"
      onError={() => setBroken(true)}
    />
  );
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusUpdate,
  onMarkPaid,
  onRefund,
}: OrderDetailModalProps) {
  const canAct = order.status !== "delivered" && order.status !== "cancelled";
  const next = nextStatusFor(order);
  const isPickup = order.fulfillmentType === "pickup";
  const canMarkPaid =
    order.paymentStatus !== "paid" &&
    order.paymentStatus !== "refunded" &&
    order.status !== "cancelled" &&
    (order.paymentMethod === "cod" || order.paymentMethod === "transfer");
  const canRefund =
    order.paymentStatus === "paid" &&
    (order.status === "cancelled" || canAct);

  const footer = (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        className="gap-1"
        onClick={() =>
          window.open(api.orders.receiptUrl(order.id, { print: true }), "_blank")
        }
      >
        <Printer className="h-4 w-4" /> In hóa đơn
      </Button>
      {canMarkPaid && onMarkPaid && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => onMarkPaid(order.id)}
        >
          <Wallet className="h-4 w-4" /> Đã thu tiền
        </Button>
      )}
      {canRefund && onRefund && (
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => onRefund(order.id)}
        >
          <RotateCcw className="h-4 w-4" /> Hoàn tiền
        </Button>
      )}
      {canAct && next && (
        <Button
          size="sm"
          className="gap-1"
          onClick={() => onStatusUpdate(order.id, next)}
        >
          {order.status === "pending" && (
            <>
              <Check className="h-4 w-4" /> Xác nhận
            </>
          )}
          {order.status === "confirmed" && !isPickup && (
            <>
              <Truck className="h-4 w-4" /> Đang giao
            </>
          )}
          {order.status === "confirmed" && isPickup && (
            <>
              <Store className="h-4 w-4" /> Đã lấy tại quầy
            </>
          )}
          {order.status === "shipping" && (
            <>
              <Package className="h-4 w-4" /> Hoàn thành
            </>
          )}
        </Button>
      )}
      {canAct && (
        <Button
          variant="danger"
          size="sm"
          className="gap-1"
          onClick={() => onStatusUpdate(order.id, "cancelled")}
        >
          <X className="h-4 w-4" />
          Hủy đơn
        </Button>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Đơn ${order.orderCode}`}
      size="lg"
      footer={footer}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={isPickup ? "info" : "default"}>
            {isPickup ? "Đến lấy tại quầy" : "Giao tận nơi"}
          </Badge>
          <Badge
            variant={
              order.paymentStatus === "paid"
                ? "success"
                : order.paymentStatus === "refunded"
                  ? "info"
                  : "warning"
            }
          >
            {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
          </Badge>
          <Badge variant="default">
            {paymentMethodLabels[order.paymentMethod]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="mb-1 text-xs text-gray-500">Khách hàng</p>
            <p className="font-medium text-gray-900">{order.customerName}</p>
            <p className="text-gray-600">{order.customerPhone}</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="mb-1 text-xs text-gray-500">
              {isPickup ? "Nhận hàng" : "Địa chỉ giao"}
            </p>
            <p className="font-medium text-gray-900">{order.address}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Sản phẩm ({order.items.length})
          </p>
          <div className="max-h-40 space-y-1.5 overflow-y-auto sm:max-h-48">
            {order.items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-lg border border-gray-100 px-2.5 py-2"
              >
                <ProductThumb
                  src={item.product?.image}
                  alt={item.product?.name || "SP"}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {item.product?.name || "Sản phẩm"}
                  </p>
                  <p className="text-xs text-gray-500">x{item.quantity}</p>
                </div>
                <p className="shrink-0 text-sm font-medium text-primary-600">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-1 border-t border-gray-100 pt-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Phí ship</span>
            <span>
              {order.shippingFee === 0
                ? "Miễn phí"
                : formatPrice(order.shippingFee)}
            </span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Giảm giá</span>
              <span>-{formatPrice(order.discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="font-semibold text-gray-900">Tổng cộng</span>
            <span className="text-base font-bold text-primary-600">
              {formatPrice(order.total)}
            </span>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Tiến trình</p>
          <div className="space-y-2">
            {order.timeline.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                  <Check className="h-3 w-3" />
                </div>
                <div className="min-w-0 flex-1 sm:flex sm:items-baseline sm:justify-between sm:gap-3">
                  <p className="text-sm font-medium text-gray-800">
                    {statusLabels[step.status]}
                    {step.note ? (
                      <span className="ml-1 font-normal text-gray-500">
                        — {step.note}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-400">{formatDate(step.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
