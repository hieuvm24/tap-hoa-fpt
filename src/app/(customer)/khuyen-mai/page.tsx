"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy, Ticket } from "lucide-react";
import { PromotionCarousel } from "@/components/customer";
import { Badge, Button, Card } from "@/components/ui";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Promotion } from "@/types";
import { toast } from "@/lib/feedback";

type Voucher = {
  id: string;
  code: string;
  discount: number;
  minOrder: number;
  isActive: boolean;
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    api.promotions.list().then((res) => {
      if (res.success && res.data) setPromotions(res.data);
    });
    api.vouchers.list(true).then((res) => {
      if (res.success && res.data) setVouchers(res.data);
    });
  }, []);

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.info(`Mã voucher: ${code}`, "Sao chép thủ công");
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-500 to-emerald-500 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Khuyến mãi</h1>
          <p className="text-primary-100">
            Mã voucher sao chép dùng ở giỏ hàng · Chương trình danh mục tự trừ khi thanh toán
          </p>
        </div>
      </div>

      <PromotionCarousel />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        {vouchers.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Mã giảm giá</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vouchers.map((v) => (
                <Card
                  key={v.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 border-2 border-dashed border-primary-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white shrink-0">
                    <Ticket className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">Nhập mã tại giỏ hàng / thanh toán</p>
                    <p className="font-mono text-2xl font-bold text-primary-700 tracking-wider">
                      {v.code}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Giảm {v.discount}%
                      {v.minOrder > 0
                        ? ` cho đơn từ ${formatPrice(v.minOrder)}`
                        : " — không giới hạn đơn tối thiểu"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="gap-1"
                      onClick={() => copyCode(v.code)}
                    >
                      {copied === v.code ? (
                        <>
                          <Check className="h-4 w-4" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" /> Sao chép
                        </>
                      )}
                    </Button>
                    <Link href={`/gio-hang?voucher=${v.code}`}>
                      <Button>Dùng ngay</Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Chương trình đang chạy</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promotions.map((promo) => (
              <Card key={promo.id} hover className="overflow-hidden" padding="none">
                <div className="relative h-48">
                  <Image src={promo.image} alt={promo.title} fill className="object-cover" />
                  {promo.ruleType === "percent" && promo.discount > 0 && (
                    <Badge variant="danger" className="absolute top-3 left-3">
                      -{promo.discount}%
                    </Badge>
                  )}
                  {promo.ruleType === "bogo" && (
                    <Badge variant="danger" className="absolute top-3 left-3">
                      Mua 2 tặng 1
                    </Badge>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-lg text-gray-900">{promo.title}</h3>
                  <p className="text-gray-500">{promo.description}</p>
                  <p className="text-sm text-primary-700">
                    {promo.ruleType === "banner"
                      ? "Chương trình trưng bày"
                      : "Tự động áp dụng khi thanh toán — không cần mã"}
                  </p>
                  <p className="text-xs text-gray-400">HSD: {promo.endDate}</p>
                  {promo.categorySlug && (
                    <Link
                      href={`/danh-muc?category=${promo.categorySlug}`}
                      className="inline-block text-sm text-primary-600 hover:underline"
                    >
                      Xem sản phẩm áp dụng →
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
