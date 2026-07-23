"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PromotionCarousel } from "@/components/customer";
import { Card } from "@/components/ui";
import { api } from "@/lib/api";
import { Promotion } from "@/types";

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    api.promotions.list().then((res) => {
      if (res.success && res.data) setPromotions(res.data);
    });
  }, []);

  return (
    <div>
      <div className="bg-gradient-to-r from-primary-500 to-emerald-500 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Khuyến mãi</h1>
          <p className="text-primary-100">Ưu đãi hấp dẫn mỗi ngày tại Tạp Hóa FPT</p>
        </div>
      </div>
      <PromotionCarousel />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions.map((promo) => (
            <Card key={promo.id} hover className="overflow-hidden" padding="none">
              <div className="relative h-48">
                <Image src={promo.image} alt={promo.title} fill className="object-cover" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900">{promo.title}</h3>
                <p className="text-gray-500 mt-1">{promo.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
