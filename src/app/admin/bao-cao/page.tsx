"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle, BarChart } from "@/components/ui";
import { api } from "@/lib/api";
import { ChartData } from "@/types";

export default function AdminReportsPage() {
  const [monthlyRevenue, setMonthlyRevenue] = useState<ChartData[]>([]);
  const [topProducts, setTopProducts] = useState<ChartData[]>([]);
  const [topCustomers, setTopCustomers] = useState<ChartData[]>([]);

  useEffect(() => {
    api.dashboard.reports().then((res) => {
      if (res.success && res.data) {
        setMonthlyRevenue(res.data.monthlyRevenue);
        setTopProducts(res.data.topProducts);
        setTopCustomers(res.data.topCustomers);
      }
    });
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Báo cáo</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="mb-4">Doanh thu theo tháng</CardTitle>
          <BarChart data={monthlyRevenue} valueFormat="millions" />
        </Card>
        <Card>
          <CardTitle className="mb-4">Top sản phẩm bán chạy</CardTitle>
          <BarChart data={topProducts} color="bg-blue-500" />
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle className="mb-4">Top khách hàng</CardTitle>
          <BarChart data={topCustomers} valueFormat="millions" color="bg-orange-500" />
        </Card>
      </div>
    </div>
  );
}
