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
import { cn } from "@/lib/utils";

type ReportData = {
  range: {
    from: string;
    to: string;
    preset: string;
    prevFrom?: string;
    prevTo?: string;
  };
  summary: {
    revenue: number;
    orderCount: number;
    avgOrder: number;
    itemsSold: number;
    cancelledCount: number;
    cancelRate: number;
    paidCount: number;
    unpaidCount: number;
    unpaidAmount: number;
    pickupCount: number;
    deliveryCount: number;
    pickupRevenue: number;
    deliveryRevenue: number;
    discountTotal: number;
    shippingTotal: number;
    subtotalTotal: number;
    prevRevenue: number;
    prevOrderCount: number;
    revenueChangePct: number;
    ordersChangePct: number;
  };
  monthlyRevenue: ChartData[];
  dailyRevenue: ChartData[];
  peakHours: ChartData[];
  hourlyOrders: ChartData[];
  topProducts: (ChartData & { revenue?: number })[];
  topCustomers: (ChartData & { orders?: number })[];
  ordersByStatus: ChartData[];
  revenueByPayment: ChartData[];
  revenueByCategory: ChartData[];
  channelMix: ChartData[];
  lowStockItems: (ChartData & { sku?: string })[];
};

const PRESETS = [
  { id: "7d", label: "7 ngày" },
  { id: "30d", label: "30 ngày" },
  { id: "month", label: "Tháng này" },
  { id: "year", label: "Năm nay" },
] as const;

/** Gộp doanh thu theo tuần — dùng khi kỳ dài (năm / > 45 ngày) */
function aggregateByWeek(daily: ChartData[]): ChartData[] {
  const weeks: ChartData[] = [];
  for (let i = 0; i < daily.length; i += 7) {
    const chunk = daily.slice(i, i + 7);
    const value = chunk.reduce((s, d) => s + d.value, 0);
    const start = chunk[0]?.label || `T${weeks.length + 1}`;
    weeks.push({ label: start, value });
  }
  return weeks;
}

function prepareTrendChart(
  daily: ChartData[],
  preset: string
): {
  title: string;
  note?: string;
  data: ChartData[];
  showMonthly: boolean;
} {
  if (preset === "year") {
    return {
      title: "Doanh thu theo tuần",
      note: "Kỳ năm — gộp theo tuần để dễ đọc. Chi tiết tháng ở biểu đồ bên dưới.",
      data: aggregateByWeek(daily),
      showMonthly: true,
    };
  }
  if (daily.length > 45) {
    return {
      title: "Doanh thu theo tuần",
      note: "Kỳ dài — đã gộp theo tuần.",
      data: aggregateByWeek(daily),
      showMonthly: true,
    };
  }
  if (daily.length > 31) {
    return {
      title: "Doanh thu theo ngày",
      note: "Vuốt ngang biểu đồ nếu không thấy hết ngày.",
      data: daily.map((d) => ({
        ...d,
        label: d.label.includes("-") ? d.label.split("-")[1] : d.label,
      })),
      showMonthly: true,
    };
  }
  return {
    title: "Doanh thu theo ngày",
    data: daily.map((d) => ({
      ...d,
      label:
        daily.length > 14 && d.label.includes("-")
          ? d.label.split("-")[1]
          : d.label,
    })),
    showMonthly: preset !== "7d",
  };
}

function ChangePill({ value }: { value: number }) {
  return (
    <span
      className={cn(
        "ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
        value >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      )}
    >
      {value >= 0 ? "↑" : "↓"} {Math.abs(value)}% so với kỳ trước
    </span>
  );
}

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
  const trend = prepareTrendChart(
    data.dailyRevenue,
    data.range.preset || preset
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Báo cáo kinh doanh</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kỳ: {new Date(data.range.from).toLocaleDateString("vi-VN")} →{" "}
            {new Date(data.range.to).toLocaleDateString("vi-VN")}
            {data.range.prevFrom && (
              <span className="text-gray-400">
                {" "}
                · so với{" "}
                {new Date(data.range.prevFrom).toLocaleDateString("vi-VN")} →{" "}
                {new Date(data.range.prevTo!).toLocaleDateString("vi-VN")}
              </span>
            )}
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

      {/* KPI chính */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Hiệu quả bán hàng
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Doanh thu</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatPrice(s.revenue)}
            </p>
            <ChangePill value={s.revenueChangePct} />
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Số đơn</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{s.orderCount}</p>
            <ChangePill value={s.ordersChangePct} />
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Giá trị TB / đơn</p>
            <p className="mt-1 text-xl font-bold text-gray-900">
              {formatPrice(s.avgOrder)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {s.itemsSold} sản phẩm đã bán
            </p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Tỷ lệ hủy</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{s.cancelRate}%</p>
            <p className="mt-1 text-xs text-gray-400">
              {s.cancelledCount} đơn hủy trong kỳ
            </p>
          </Card>
        </div>
      </section>

      {/* Tiền & kênh */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Thu tiền & kênh bán
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Đã thu / đã thanh toán</p>
            <p className="mt-1 text-lg font-bold text-emerald-700">
              {s.paidCount} đơn
            </p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Chưa thu (COD…)</p>
            <p className="mt-1 text-lg font-bold text-amber-700">
              {formatPrice(s.unpaidAmount)}
            </p>
            <p className="mt-1 text-xs text-gray-400">{s.unpaidCount} đơn</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Giao tận nơi</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {formatPrice(s.deliveryRevenue)}
            </p>
            <p className="mt-1 text-xs text-gray-400">{s.deliveryCount} đơn</p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Nhận tại quầy</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {formatPrice(s.pickupRevenue)}
            </p>
            <p className="mt-1 text-xs text-gray-400">{s.pickupCount} đơn</p>
          </Card>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Doanh thu hàng (trước ship)</p>
            <p className="mt-1 font-bold text-gray-900">
              {formatPrice(s.subtotalTotal)}
            </p>
          </Card>
          <Card className="!p-4">
            <p className="text-xs text-gray-500">Giảm giá đã áp</p>
            <p className="mt-1 font-bold text-gray-900">
              {formatPrice(s.discountTotal)}
            </p>
          </Card>
          <Card className="!p-4 col-span-2 md:col-span-1">
            <p className="text-xs text-gray-500">Phí ship thu được</p>
            <p className="mt-1 font-bold text-gray-900">
              {formatPrice(s.shippingTotal)}
            </p>
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardTitle className="mb-1">{trend.title}</CardTitle>
          {trend.note && (
            <p className="mb-3 text-xs text-gray-400">{trend.note}</p>
          )}
          <BarChart data={trend.data} valueFormat="millions" />
        </Card>

        {trend.showMonthly && (
          <Card className="lg:col-span-2">
            <CardTitle className="mb-4">
              Doanh thu theo tháng ({new Date().getFullYear()})
            </CardTitle>
            <BarChart data={data.monthlyRevenue} valueFormat="millions" />
          </Card>
        )}

        <Card>
          <CardTitle className="mb-4">Online vs tại quầy</CardTitle>
          {data.channelMix.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có doanh thu kỳ này.</p>
          ) : (
            <HorizontalBarChart
              data={data.channelMix}
              valueFormat="millions"
              color="bg-teal-500"
            />
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">Giờ cao điểm (số đơn)</CardTitle>
          {data.peakHours.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa đủ dữ liệu.</p>
          ) : (
            <>
              <HorizontalBarChart data={data.peakHours} color="bg-violet-500" />
              <p className="mt-3 text-xs text-gray-400">
                Gợi ý: sắp xếp nhân sự / ship quanh các khung giờ đông khách.
              </p>
            </>
          )}
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
          <CardTitle className="mb-4">Đơn theo trạng thái</CardTitle>
          <HorizontalBarChart data={data.ordersByStatus} color="bg-amber-500" />
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
          <CardTitle className="mb-4">Top sản phẩm (theo doanh thu)</CardTitle>
          <HorizontalBarChart
            data={data.topProducts.map((p) => ({
              label: p.label,
              value: p.revenue || 0,
            }))}
            valueFormat="millions"
            color="bg-indigo-500"
          />
          {data.topProducts.length > 0 && (
            <ul className="mt-4 max-h-40 space-y-1 overflow-y-auto text-xs text-gray-500">
              {data.topProducts.slice(0, 8).map((p) => (
                <li key={p.label} className="flex justify-between gap-2">
                  <span className="truncate">{p.label}</span>
                  <span className="shrink-0">
                    {p.value} sp · {formatPrice(p.revenue || 0)}
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
          {data.topCustomers.length > 0 && (
            <ul className="mt-4 max-h-36 space-y-1 overflow-y-auto text-xs text-gray-500">
              {data.topCustomers.slice(0, 5).map((c) => (
                <li key={c.label} className="flex justify-between gap-2">
                  <span className="truncate">{c.label}</span>
                  <span className="shrink-0">{c.orders || 0} đơn</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle className="mb-4">Cần nhập hàng (tồn ≤ 10)</CardTitle>
          {data.lowStockItems.length === 0 ? (
            <p className="text-sm text-gray-500">Không có sản phẩm sắp hết.</p>
          ) : (
            <ul className="space-y-2">
              {data.lowStockItems.map((p) => (
                <li
                  key={p.label + p.sku}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
                    p.value <= 0 ? "bg-red-100" : "bg-red-50"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{p.label}</p>
                    <p className="text-xs text-gray-500">{p.sku}</p>
                  </div>
                  <span className="font-bold text-red-600">
                    {p.value <= 0 ? "Hết hàng" : `còn ${p.value}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
