"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Salad,
  Apple,
  Coffee,
  Soup,
  Candy,
  Snowflake,
  UtensilsCrossed,
  Milk,
  Home,
  Sparkles,
  LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui";
import { api } from "@/lib/api";
import { Category } from "@/types";

const iconMap: Record<string, LucideIcon> = {
  Salad,
  Apple,
  Coffee,
  Soup,
  Candy,
  Snowflake,
  UtensilsCrossed,
  Milk,
  Home,
  Sparkles,
};

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.categories.list().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Danh mục nổi bật</h2>
          <p className="text-gray-500">Chọn danh mục bạn cần mua sắm</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-5">
          {categories.map((category) => {
            const Icon = iconMap[category.icon] || Salad;
            return (
              <Link key={category.id} href={`/danh-muc?category=${category.slug}`}>
                <Card
                  hover
                  padding="sm"
                  className="flex flex-col items-center text-center cursor-pointer group"
                >
                  <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600 mb-2 transition-all group-hover:bg-primary-500 group-hover:text-white">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-gray-800 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{category.productCount} sp</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
