"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  AlertTriangle,
  Truck,
  Package,
  Store,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/admin";
import {
  Card,
  CardTitle,
  BarChart,
  Badge,
  HorizontalBarChart,
  Button,
} from "@/components/ui";
import { formatPrice, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { DashboardStats, ChartData } from "@/types";

type ActionOrder = {
  id: string;
  orderCode: string;
  customerName: string;
  total: number;
  status: string;
  fulfillmentType: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
};

const statusLabels: Record<
  string,
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueChart, setRevenueChart] = useState<ChartData[]>([]);
  const [ordersChart, setOrdersChart] = useState<ChartData[]>([]);
  const [actionOrders, setActionOrders] = useState<ActionOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<
    (ChartData & { sku?: string })[]
  >([]);
  const [topWeekProducts, setTopWeekProducts] = useState<ChartData[]>([]);

  useEffect(() => {
    api.dashboard.stats().then((res) => {
      if (res.success && res.data) {
        setStats(res.data.stats);
        setRevenueChart(res.data.revenueChart);
        setOrdersChart(res.data.ordersChart);
        setActionOrders(res.data.actionOrders || []);
        setLowStockItems(res.data.lowStockItems || []);
        setTopWeekProducts(res.data.topWeekProducts || []);
      }
    });
  }, []);

  if (!stats) {
    return <div className="p-8 text-gray-500">Đang tải tổng quan cửa hàng...</div>;
  }

  const alertCount = stats.lowStockCount + stats.outOfStockCount;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan cửa hàng</h1>
          <p className="mt-1 text-sm text-gray-500">
            Theo dõi doanh thu, đơn cần xử lý và tồn kho trong ngày
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/don-hang">
            <Button variant="outline" size="sm">
              Đơn hàng
            </Button>
          </Link>
          <Link href="/admin/ban-tai-quay">
            <Button size="sm">Bán tại quầy</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Doanh thu hôm nay"
          value={formatPrice(stats.todayRevenue)}
          change={stats.revenueChange}
          icon={DollarSign}
        />
        <StatCard
          title="Đơn hôm nay"
          value={String(stats.todayOrders)}
          change={stats.ordersChange}
          hint={`Giao ${stats.todayDelivery} · Quầy ${stats.todayPickup}`}
          icon={ShoppingBag}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Cần xử lý"
          value={String(stats.toConfirmCount + stats.shippingCount)}
          hint={`Chờ xác nhận ${stats.pendingCount} · Đang giao ${stats.shippingCount}`}
          icon={Truck}
          color="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Cảnh báo tồn"
          value={String(alertCount)}
          hint={`Sắp hết ${stats.lowStockCount} · Hết hàng ${stats.outOfStockCount}`}
          icon={AlertTriangle}
          color="bg-red-50 text-red-600"
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Doanh thu tháng này</p>
              <p className="text-lg font-bold text-gray-900">
                {formatPrice(stats.monthRevenue)}
              </p>
              <p className="text-xs text-gray-400">{stats.monthOrders} đơn</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Kênh bán hôm nay</p>
              <p className="text-lg font-bold text-gray-900">
                {stats.todayDelivery + stats.todayPickup} đơn
              </p>
              <p className="text-xs text-gray-400">
                Online {stats.todayDelivery} · Quầy {stats.todayPickup}
              </p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">COD chưa thu</p>
              <p className="text-lg font-bold text-gray-900">
                {formatPrice(stats.unpaidCodTotal)}
              </p>
              <p className="text-xs text-gray-400">{stats.unpaidCodCount} đơn</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Tồn kho cần chú ý</p>
              <p className="text-lg font-bold text-gray-900">{alertCount} SP</p>
              <Link
                href="/admin/san-pham"
                className="text-xs font-medium text-primary-600 hover:underline"
              >
                Xem sản phẩm →
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle className="mb-4">Doanh thu 7 ngày gần nhất</CardTitle>
          <BarChart data={revenueChart} valueFormat="millions" />
        </Card>
        <Card>
          <CardTitle className="mb-4">Số đơn 7 ngày gần nhất</CardTitle>
          <BarChart data={ordersChart} color="bg-emerald-500" />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2">
            <CardTitle className="!mb-0">Đơn cần xử lý</CardTitle>
            <Link
              href="/admin/don-hang"
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              Xem tất cả
            </Link>
          </div>
          {actionOrders.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              Không có đơn đang chờ — cửa hàng đang ổn.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-left font-medium text-gray-500">
                      Mã đơn
                    </th>
                    <th className="pb-3 text-left font-medium text-gray-500">
                      Khách
                    </th>
                    <th className="hidden pb-3 text-left font-medium text-gray-500 sm:table-cell">
                      Kênh
                    </th>
                    <th className="pb-3 text-left font-medium text-gray-500">
                      TT
                    </th>
                    <th className="hidden pb-3 text-left font-medium text-gray-500 md:table-cell">
                      Tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {actionOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-3 font-medium text-primary-600">
                        {order.orderCode}
                      </td>
                      <td className="py-3">
                        <div>{order.customerName}</div>
                        <div className="text-xs text-gray-400">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="hidden py-3 sm:table-cell">
                        {order.fulfillmentType === "pickup"
                          ? "Tại quầy"
                          : "Giao hàng"}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant={
                            statusLabels[order.status]?.variant || "default"
                          }
                        >
                          {statusLabels[order.status]?.label || order.status}
                        </Badge>
                      </td>
                      <td className="hidden py-3 font-medium md:table-cell">
                        {formatPrice(order.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardTitle className="mb-4">Sắp hết hàng</CardTitle>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-400">Tồn kho ổn định.</p>
            ) : (
              <ul className="space-y-2">
                {lowStockItems.map((p) => (
                  <li
                    key={p.label + p.sku}
                    className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900">
                        {p.label}
                      </p>
                      <p className="text-xs text-gray-500">{p.sku}</p>
                    </div>
                    <span className="shrink-0 font-bold text-red-600">
                      còn {p.value}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardTitle className="mb-4">Bán chạy tuần này</CardTitle>
            {topWeekProducts.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có dữ liệu bán.</p>
            ) : (
              <HorizontalBarChart data={topWeekProducts} color="bg-indigo-500" />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
