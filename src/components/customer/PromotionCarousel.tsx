"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import { api } from "@/lib/api";
import { Promotion } from "@/types";

export function PromotionCarousel() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    api.promotions.list().then((res) => {
      if (res.success && res.data) setPromotions(res.data);
    });
  }, []);

  if (!promotions.length) return null;

  const promo = promotions[current];

  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Khuyến mãi hot</h2>
          <Link href="/khuyen-mai" className="text-sm text-primary-600 hover:underline">
            Xem tất cả
          </Link>
        </div>

        <Card padding="none" className="overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative aspect-[16/9] md:aspect-auto md:min-h-[280px]">
              <Image src={promo.image} alt={promo.title} fill className="object-cover" />
              {promo.discount > 0 && (
                <Badge variant="danger" className="absolute top-4 left-4 text-sm">
                  -{promo.discount}%
                </Badge>
              )}
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{promo.title}</h3>
              <p className="text-gray-600 mb-4">{promo.description}</p>
              <p className="text-sm text-gray-400 mb-6">HSD: {promo.endDate}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrent((c) => (c - 1 + promotions.length) % promotions.length)}
                  className="rounded-lg border p-2 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setCurrent((c) => (c + 1) % promotions.length)}
                  className="rounded-lg border p-2 hover:bg-gray-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
