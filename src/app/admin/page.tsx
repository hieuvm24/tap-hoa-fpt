"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Package, Users } from "lucide-react";
import { StatCard } from "@/components/admin";
import { Card, CardTitle, BarChart, Badge } from "@/components/ui";
import { formatPrice, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";
import { DashboardStats, ChartData, Order } from "@/types";

const statusLabels: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info" }> = {
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
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.dashboard.stats().then((res) => {
      if (res.success && res.data) {
        setStats(res.data.stats);
        setRevenueChart(res.data.revenueChart);
        setOrdersChart(res.data.ordersChart);
      }
    });
    api.orders.list().then((res) => {
      if (res.success && res.data) setRecentOrders(res.data.slice(0, 5));
    });
  }, []);

  if (!stats) return <div className="p-8">Đang tải dashboard...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Doanh thu hôm nay" value={formatPrice(stats.todayRevenue)} change={stats.revenueChange} icon={DollarSign} />
        <StatCard title="Tổng đơn hàng" value={stats.totalOrders.toString()} change={stats.ordersChange} icon={ShoppingBag} color="bg-blue-50 text-blue-600" />
        <StatCard title="Sản phẩm" value={stats.totalProducts.toString()} icon={Package} color="bg-purple-50 text-purple-600" />
        <StatCard title="Khách hàng" value={stats.totalCustomers.toString()} icon={Users} color="bg-orange-50 text-orange-600" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card><CardTitle className="mb-4">Doanh thu tuần này</CardTitle><BarChart data={revenueChart} valueFormat="millions" /></Card>
        <Card><CardTitle className="mb-4">Đơn hàng tuần này</CardTitle><BarChart data={ordersChart} color="bg-emerald-500" /></Card>
      </div>
      <Card>
        <CardTitle className="mb-4">Đơn hàng mới nhất</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-left font-medium text-gray-500">Mã đơn</th>
                <th className="pb-3 text-left font-medium text-gray-500">Khách hàng</th>
                <th className="pb-3 text-left font-medium text-gray-500 hidden sm:table-cell">Tổng tiền</th>
                <th className="pb-3 text-left font-medium text-gray-500">Trạng thái</th>
                <th className="pb-3 text-left font-medium text-gray-500 hidden md:table-cell">Ngày đặt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-3 font-medium text-primary-600">{order.orderCode}</td>
                  <td className="py-3">{order.customerName}</td>
                  <td className="py-3 hidden sm:table-cell font-medium">{formatPrice(order.total)}</td>
                  <td className="py-3">
                    <Badge variant={statusLabels[order.status].variant}>{statusLabels[order.status].label}</Badge>
                  </td>
                  <td className="py-3 text-gray-500 hidden md:table-cell">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
