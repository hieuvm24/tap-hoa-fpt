"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle, BarChart, HorizontalBarChart } from "@/components/ui";
import { api } from "@/lib/api";
import { ChartData } from "@/types";

export default function AdminReportsPage() {
  const [monthlyRevenue, setMonthlyRevenue] = useState<ChartData[]>([]);
  const [topProducts, setTopProducts] = useState<ChartData[]>([]);
  const [topCustomers, setTopCustomers] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.reports().then((res) => {
      if (res.success && res.data) {
        setMonthlyRevenue(res.data.monthlyRevenue);
        setTopProducts(res.data.topProducts);
        setTopCustomers(res.data.topCustomers);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-gray-500">Đang tải báo cáo...</div>;
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Báo cáo</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardTitle className="mb-4">Doanh thu theo tháng ({new Date().getFullYear()})</CardTitle>
          <BarChart data={monthlyRevenue} valueFormat="millions" />
        </Card>
        <Card>
          <CardTitle className="mb-4">Top sản phẩm bán chạy</CardTitle>
          <HorizontalBarChart data={topProducts} color="bg-blue-500" />
        </Card>
        <Card>
          <CardTitle className="mb-4">Top khách hàng (theo doanh số)</CardTitle>
          <HorizontalBarChart
            data={topCustomers}
            valueFormat="millions"
            color="bg-orange-500"
          />
        </Card>
      </div>
    </div>
  );
}
