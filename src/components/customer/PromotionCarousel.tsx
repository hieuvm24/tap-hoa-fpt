"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Copy, Ticket } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Promotion } from "@/types";

type Voucher = {
  id: string;
  code: string;
  discount: number;
  minOrder: number;
  isActive: boolean;
};

function ruleHint(promo: Promotion): string {
  if (promo.ruleType === "percent" && promo.categorySlug) {
    return "Tự động giảm khi thanh toán — không cần nhập mã";
  }
  if (promo.ruleType === "bogo" && promo.categorySlug) {
    return "Tự động áp dụng (mua 2 tặng 1) khi đủ số lượng — không cần mã";
  }
  return "Chương trình trưng bày tại cửa hàng";
}

function shopHref(promo: Promotion): string {
  if (promo.categorySlug) return `/danh-muc?category=${promo.categorySlug}`;
  return "/danh-muc";
}

export function PromotionCarousel() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [current, setCurrent] = useState(0);
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
      alert(`Mã của bạn: ${code}`);
    }
  };

  if (!promotions.length && !vouchers.length) return null;

  const promo = promotions[current] || null;

  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Khuyến mãi hot</h2>
          <Link href="/khuyen-mai" className="text-sm text-primary-600 hover:underline">
            Xem tất cả
          </Link>
        </div>

        {vouchers.length > 0 && (
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vouchers.map((v) => (
              <Card
                key={v.id}
                className="flex items-center gap-3 border-dashed border-primary-300 bg-primary-50/60"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white">
                  <Ticket className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Mã giảm giá</p>
                  <p className="font-mono text-lg font-bold tracking-wide text-primary-700">
                    {v.code}
                  </p>
                  <p className="text-xs text-gray-500">
                    Giảm {v.discount}%
                    {v.minOrder > 0
                      ? ` · đơn từ ${formatPrice(v.minOrder)}`
                      : ""}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1"
                  onClick={() => copyCode(v.code)}
                >
                  {copied === v.code ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Đã chép
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Sao chép
                    </>
                  )}
                </Button>
              </Card>
            ))}
          </div>
        )}

        {promo && (
          <Card padding="none" className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[280px]">
                <Image src={promo.image} alt={promo.title} fill className="object-cover" />
                {promo.discount > 0 && promo.ruleType === "percent" && (
                  <Badge variant="danger" className="absolute top-4 left-4 text-sm">
                    -{promo.discount}%
                  </Badge>
                )}
                {promo.ruleType === "bogo" && (
                  <Badge variant="danger" className="absolute top-4 left-4 text-sm">
                    Mua 2 tặng 1
                  </Badge>
                )}
              </div>
              <div className="p-6 sm:p-8 flex flex-col justify-center">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {promo.title}
                </h3>
                <p className="text-gray-600 mb-3">{promo.description}</p>
                <p className="text-sm text-primary-700 bg-primary-50 rounded-lg px-3 py-2 mb-3">
                  {ruleHint(promo)}
                </p>
                <p className="text-sm text-gray-400 mb-6">HSD: {promo.endDate}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={shopHref(promo)}>
                    <Button size="sm">Mua ngay</Button>
                  </Link>
                  {promotions.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrent(
                            (c) => (c - 1 + promotions.length) % promotions.length
                          )
                        }
                        className="rounded-lg border p-2 hover:bg-gray-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrent((c) => (c + 1) % promotions.length)}
                        className="rounded-lg border p-2 hover:bg-gray-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}
