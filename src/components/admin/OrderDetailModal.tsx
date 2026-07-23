"use client";

import Image from "next/image";
import { Check, Truck, Package, X } from "lucide-react";
import { Order, OrderStatus } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { Modal, Badge, Button } from "@/components/ui";

interface OrderDetailModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (id: string, status: OrderStatus) => void;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao hàng",
  delivered: "Hoàn thành",
  cancelled: "Đã hủy",
};

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "shipping",
  shipping: "delivered",
};

export function OrderDetailModal({ order, isOpen, onClose, onStatusUpdate }: OrderDetailModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Đơn hàng ${order.orderCode}`} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Khách hàng</p>
            <p className="font-medium">{order.customerName}</p>
            <p className="text-gray-600">{order.customerPhone}</p>
          </div>
          <div>
            <p className="text-gray-500">Địa chỉ giao hàng</p>
            <p className="font-medium">{order.address}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Sản phẩm</p>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <Image src={item.product.image} alt={item.product.name} width={48} height={48} className="rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">SL: {item.quantity}</p>
                </div>
                <p className="text-sm font-medium text-primary-600">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 space-y-1 text-sm">
          <div className="flex justify-between font-bold text-base pt-1">
            <span>Tổng cộng</span>
            <span className="text-primary-600">{formatPrice(order.total)}</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Trạng thái đơn hàng</p>
          <div className="space-y-3">
            {order.timeline.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-600 flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <div>
                  <p className="text-sm font-medium">{statusLabels[step.status]}</p>
                  <p className="text-xs text-gray-400">{formatDate(step.date)}</p>
                  {step.note && <p className="text-xs text-gray-500 mt-0.5">{step.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {order.status !== "delivered" && order.status !== "cancelled" && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {nextStatus[order.status] && (
              <Button size="sm" className="gap-1" onClick={() => onStatusUpdate(order.id, nextStatus[order.status]!)}>
                {order.status === "pending" && <><Check className="h-4 w-4" /> Xác nhận</>}
                {order.status === "confirmed" && <><Truck className="h-4 w-4" /> Đang giao</>}
                {order.status === "shipping" && <><Package className="h-4 w-4" /> Hoàn thành</>}
              </Button>
            )}
            <Button variant="danger" size="sm" className="gap-1" onClick={() => onStatusUpdate(order.id, "cancelled")}>
              <X className="h-4 w-4" />
              Hủy đơn
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
