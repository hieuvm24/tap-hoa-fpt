"use client";

import { useMemo, useState, useEffect } from "react";
import { Eye, Search } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { normalizeVi } from "@/lib/normalize-vi";
import { Badge, Button, Input } from "@/components/ui";
import { Order, OrderStatus } from "@/types";
import { OrderDetailModal } from "./OrderDetailModal";
import { api } from "@/lib/api";

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    variant: "default" | "success" | "warning" | "danger" | "info";
  }
> = {
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

function toDateInputValue(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function OrderTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | OrderStatus>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadOrders = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    if (search.trim()) params.search = search.trim();
    api.orders.list(params).then((res) => {
      if (res.success && res.data) setOrders(res.data);
      else setOrders([]);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, dateFrom, dateTo]);

  // Client refine when typing search without hitting API every keystroke
  const filtered = useMemo(() => {
    const q = normalizeVi(search);
    if (!q) return orders;
    return orders.filter((o) => {
      const hay = normalizeVi(
        `${o.orderCode} ${o.customerName} ${o.customerPhone} ${o.customerEmail || ""}`
      );
      return hay.includes(q);
    });
  }, [orders, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const setPreset = (days: number | "today" | "month" | "clear") => {
    const now = new Date();
    if (days === "clear") {
      setDateFrom("");
      setDateTo("");
      return;
    }
    if (days === "today") {
      const t = toDateInputValue(now);
      setDateFrom(t);
      setDateTo(t);
      return;
    }
    if (days === "month") {
      setDateFrom(toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1)));
      setDateTo(toDateInputValue(now));
      return;
    }
    const from = new Date(now);
    from.setDate(from.getDate() - (days - 1));
    setDateFrom(toDateInputValue(from));
    setDateTo(toDateInputValue(now));
  };

  const handleStatusUpdate = async (id: string, next: OrderStatus) => {
    const res =
      next === "cancelled"
        ? await api.orders.cancel(id, "Cửa hàng hủy đơn")
        : await api.orders.updateStatus(id, next);
    if (res.success && res.data) {
      setSelectedOrder(res.data);
      loadOrders();
    } else if (!res.success) {
      alert(res.error || "Cập nhật thất bại");
    }
  };

  const handleMarkPaid = async (id: string) => {
    const res = await api.orders.markPaid(id);
    if (res.success && res.data) {
      setSelectedOrder(res.data);
      loadOrders();
    } else {
      alert(res.error || "Xác nhận thanh toán thất bại");
    }
  };

  const handleExport = () => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    const url = api.orders.exportCsv(params);
    window.open(url, "_blank");
  };

  const handleBulkConfirm = async () => {
    const pendingIds = filtered
      .filter((o) => o.status === "pending")
      .map((o) => o.id)
      .slice(0, 50);
    if (pendingIds.length === 0) {
      alert("Không có đơn chờ xác nhận trong danh sách hiện tại");
      return;
    }
    if (!confirm(`Xác nhận ${pendingIds.length} đơn đang chờ?`)) return;
    const res = await api.orders.bulkStatus(pendingIds, "confirmed");
    if (res.success && res.data) {
      alert(
        `Đã cập nhật ${res.data.updated} đơn` +
          (res.data.skipped ? `, bỏ qua ${res.data.skipped}` : "")
      );
      loadOrders();
    } else {
      alert(res.error || "Cập nhật hàng loạt thất bại");
    }
  };

  return (
    <>
      <form
        onSubmit={handleSearchSubmit}
        className="mb-4 space-y-3 rounded-xl border border-gray-100 bg-white p-3 sm:p-4"
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="w-full lg:max-w-sm">
            <Input
              placeholder="Tìm đơn hàng (mã, tên, SĐT)..."
              icon={<Search className="h-4 w-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "" | OrderStatus)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">Tất cả trạng thái</option>
            {(Object.keys(statusConfig) as OrderStatus[]).map((k) => (
              <option key={k} value={k}>
                {statusConfig[k].label}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" className="shrink-0">
            Tìm đơn
          </Button>
          <Button
            type="button"
            variant="outline"
            className="shrink-0"
            onClick={handleBulkConfirm}
          >
            Xác nhận hàng loạt
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="shrink-0"
            onClick={handleExport}
          >
            Xuất CSV
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="text-sm text-gray-600">
            Từ ngày
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:w-40"
            />
          </label>
          <label className="text-sm text-gray-600">
            Đến ngày
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 sm:w-40"
            />
          </label>
          <div className="flex flex-wrap gap-1.5 pb-0.5">
            <button
              type="button"
              onClick={() => setPreset("today")}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setPreset(7)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700"
            >
              7 ngày
            </button>
            <button
              type="button"
              onClick={() => setPreset(30)}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700"
            >
              30 ngày
            </button>
            <button
              type="button"
              onClick={() => setPreset("month")}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-700"
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => setPreset("clear")}
              className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50"
            >
              Xóa lọc ngày
            </button>
          </div>
          <p className="ml-auto text-sm text-gray-500">
            {filtered.length} đơn
          </p>
        </div>
      </form>

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500">Không tìm thấy đơn hàng phù hợp.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Mã đơn
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Khách hàng
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden sm:table-cell">
                  Tổng tiền
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600 hidden md:table-cell">
                  Thanh toán
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">
                  Trạng thái
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-primary-600">
                      {order.orderCode}
                    </span>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDate(order.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {order.customerPhone}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium hidden sm:table-cell">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {paymentLabels[order.paymentMethod]}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusConfig[order.status].variant}>
                      {statusConfig[order.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdate={handleStatusUpdate}
          onMarkPaid={handleMarkPaid}
        />
      )}
    </>
  );
}
