"use client";

import { useState, useEffect } from "react";
import { Eye } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { Badge, Button } from "@/components/ui";
import { Order, OrderStatus } from "@/types";
import { OrderDetailModal } from "./OrderDetailModal";
import { api } from "@/lib/api";

const statusConfig: Record<OrderStatus, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
  pending: { label: "Chờ xác nhận", variant: "warning" },
  confirmed: { label: "Đã xác nhận", variant: "info" },
  shipping: { label: "Đang giao", variant: "info" },
  delivered: { label: "Hoàn thành", variant: "success" },
  cancelled: { label: "Đã hủy", variant: "danger" },
};

const paymentLabels = {
  cod: "Khi nhận hàng",
  transfer: "Chuyển khoản",
  vnpay: "VNPay",
};

export function OrderTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadOrders = () => {
    api.orders.list().then((res) => {
      if (res.success && res.data) setOrders(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { loadOrders(); }, []);

  const handleStatusUpdate = async (id: string, status: OrderStatus) => {
    const res =
      status === "cancelled"
        ? await api.orders.cancel(id, "Cửa hàng hủy đơn")
        : await api.orders.updateStatus(id, status);
    if (res.success && res.data) {
      setSelectedOrder(res.data);
      loadOrders();
    } else if (!res.success) {
      alert(res.error || "Cập nhật thất bại");
    }
  };

  if (loading) return <p className="text-gray-500">Đang tải...</p>;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Mã đơn</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Khách hàng</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">Tổng tiền</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">Thanh toán</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Trạng thái</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium text-primary-600">{order.orderCode}</span>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{order.customerName}</p>
                  <p className="text-xs text-gray-400">{order.customerPhone}</p>
                </td>
                <td className="px-4 py-3 font-medium hidden sm:table-cell">{formatPrice(order.total)}</td>
                <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{paymentLabels[order.paymentMethod]}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusConfig[order.status].variant}>{statusConfig[order.status].label}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(order)} className="gap-1">
                    <Eye className="h-4 w-4" />
                    Chi tiết
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
        />
      )}
    </>
  );
}
