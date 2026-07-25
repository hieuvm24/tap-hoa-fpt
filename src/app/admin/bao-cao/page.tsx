"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardTitle,
  BarChart,
  HorizontalBarChart,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { ChartData } from "@/types";

type ReportData = {
  range: { from: string; to: string; preset: string };
  summary: {
    revenue: number;
    orderCount: number;
    avgOrder: number;
    cancelledCount: number;
    cancelRate: number;
    paidCount: number;
    pickupCount: number;
    deliveryCount: number;
    discountTotal: number;
    shippingTotal: number;
  };
  monthlyRevenue: ChartData[];
  dailyRevenue: ChartData[];
  topProducts: (ChartData & { revenue?: number })[];
  topCustomers: ChartData[];
  ordersByStatus: ChartData[];
  revenueByPayment: ChartData[];
  revenueByCategory: ChartData[];
  lowStockItems: (ChartData & { sku?: string })[];
};

const PRESETS = [
  { id: "7d", label: "7 ngày" },
  { id: "30d", label: "30 ngày" },
  { id: "month", label: "Tháng này" },
  { id: "year", label: "Năm nay" },
] as const;

export default function AdminReportsPage() {
  const [preset, setPreset] = useState<string>("month");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.dashboard.reports({ preset }).then((res) => {
      if (res.success && res.data) setData(res.data as ReportData);
      setLoading(false);
    });
  }, [preset]);

  if (loading && !data) {
    return <div className="p-8 text-gray-500">Đang tải báo cáo...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-gray-500">
        Không tải được báo cáo. Chỉ chủ cửa hàng xem được mục này.
      </div>
    );
  }

  const s = data.summary;
  const kpi = [
    { label: "Doanh thu", value: formatPrice(s.revenue) },
    { label: "Số đơn", value: String(s.orderCount) },
    { label: "Giá trị TB/đơn", value: formatPrice(s.avgOrder) },
    { label: "Tỷ lệ hủy", value: `${s.cancelRate}% (${s.cancelledCount})` },
    { label: "Giao tận nơi", value: String(s.deliveryCount) },
    { label: "Nhận tại quầy", value: String(s.pickupCount) },
    { label: "Đã thanh toán", value: String(s.paidCount) },
    { label: "Giảm giá đã áp", value: formatPrice(s.discountTotal) },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo chi tiết</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kỳ: {new Date(data.range.from).toLocaleDateString("vi-VN")} →{" "}
            {new Date(data.range.to).toLocaleDateString("vi-VN")}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={
                preset === p.id
                  ? "rounded-full bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-primary-50"
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpi.map((item) => (
          <Card key={item.label} className="!p-4">
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="mt-1 text-lg font-bold text-gray-900">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardTitle className="mb-4">
            Doanh thu theo ngày (kỳ đã chọn)
          </CardTitle>
          {data.dailyRevenue.length > 45 ? (
            <p className="mb-2 text-xs text-gray-400">
              Biểu đồ rút gọn — xem thêm doanh thu theo tháng bên dưới.
            </p>
          ) : null}
          <BarChart
            data={
              data.dailyRevenue.length > 45
                ? data.dailyRevenue.filter((_, i) => i % 2 === 0)
                : data.dailyRevenue
            }
            valueFormat="millions"
          />
        </Card>

        <Card className="lg:col-span-2">
          <CardTitle className="mb-4">
            Doanh thu theo tháng ({new Date().getFullYear()})
          </CardTitle>
          <BarChart data={data.monthlyRevenue} valueFormat="millions" />
        </Card>

        <Card>
          <CardTitle className="mb-4">Đơn theo trạng thái</CardTitle>
          <HorizontalBarChart data={data.ordersByStatus} color="bg-amber-500" />
        </Card>

        <Card>
          <CardTitle className="mb-4">Doanh thu theo thanh toán</CardTitle>
          <HorizontalBarChart
            data={data.revenueByPayment}
            valueFormat="millions"
            color="bg-emerald-500"
          />
        </Card>

        <Card>
          <CardTitle className="mb-4">Doanh thu theo danh mục</CardTitle>
          <HorizontalBarChart
            data={data.revenueByCategory}
            valueFormat="millions"
            color="bg-blue-500"
          />
        </Card>

        <Card>
          <CardTitle className="mb-4">Top sản phẩm (số lượng bán)</CardTitle>
          <HorizontalBarChart data={data.topProducts} color="bg-indigo-500" />
          {data.topProducts.length > 0 && (
            <ul className="mt-4 max-h-40 space-y-1 overflow-y-auto text-xs text-gray-500">
              {data.topProducts.slice(0, 5).map((p) => (
                <li key={p.label} className="flex justify-between gap-2">
                  <span className="truncate">{p.label}</span>
                  <span className="shrink-0 font-medium text-primary-600">
                    {formatPrice(p.revenue || 0)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">Top khách hàng (doanh số)</CardTitle>
          <HorizontalBarChart
            data={data.topCustomers}
            valueFormat="millions"
            color="bg-orange-500"
          />
        </Card>

        <Card>
          <CardTitle className="mb-4">Sắp hết hàng (≤ 10)</CardTitle>
          {data.lowStockItems.length === 0 ? (
            <p className="text-sm text-gray-500">Không có sản phẩm sắp hết.</p>
          ) : (
            <ul className="space-y-2">
              {data.lowStockItems.map((p) => (
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
                  <span className="font-bold text-red-600">còn {p.value}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
