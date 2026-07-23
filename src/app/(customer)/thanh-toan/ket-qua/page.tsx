"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

function PaymentResultContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";
  const orderCode = searchParams.get("orderCode") || "";
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderCode) {
      setLoading(false);
      return;
    }

    api.orders.list({ mine: "true" }).then((res) => {
      if (res.success && res.data) {
        const order = res.data.find((o) => o.orderCode === orderCode);
        if (order) setTotal(order.total);
      }
      setLoading(false);
    });
  }, [orderCode]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500 mx-auto" />
        <p className="mt-4 text-gray-500">Đang xác nhận thanh toán...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Card className="text-center">
        {success ? (
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        ) : (
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {success ? "Thanh toán thành công" : "Thanh toán thất bại / hủy"}
        </h1>
        <p className="text-gray-500 mb-4">
          {orderCode
            ? `Mã đơn: ${orderCode}`
            : "Không xác định được mã đơn hàng"}
          {total != null ? ` • ${formatPrice(total)}` : ""}
        </p>
        <p className="text-sm text-gray-400 mb-6">
          {success
            ? "Cảm ơn bạn đã thanh toán qua VNPay. Shop sẽ xử lý đơn sớm nhất."
            : "Bạn có thể thử lại hoặc chọn COD / chuyển khoản trong đơn hàng."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href={orderCode ? `/don-hang?code=${orderCode}` : "/don-hang"}>
            <Button>Xem đơn hàng</Button>
          </Link>
          <Link href="/danh-muc">
            <Button variant="outline">Tiếp tục mua sắm</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
      <PaymentResultContent />
    </Suspense>
  );
}
