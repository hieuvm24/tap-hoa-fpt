"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui";
import { api } from "@/lib/api";
import type { NewsArticle } from "@/types";

function normalize(article: NewsArticle): NewsArticle {
  return {
    ...article,
    publishedAt:
      typeof article.publishedAt === "string"
        ? article.publishedAt
        : new Date(article.publishedAt).toISOString(),
  };
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.news.list().then((res) => {
      if (res.success && res.data) setNews(res.data.map(normalize));
      setLoading(false);
    });
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Tin tức</h1>
      <p className="text-gray-500 mb-8">Cập nhật mới nhất từ Tạp Hóa FPT</p>

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item) => (
            <Link key={item.id} href={`/tin-tuc/${item.slug}`}>
              <Card hover>
                <div className="relative h-40 rounded-lg mb-4 overflow-hidden bg-gray-100">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {new Date(item.publishedAt).toLocaleDateString("vi-VN")}
                </p>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3">{item.excerpt}</p>
              </Card>
            </Link>
          ))}
          {news.length === 0 && (
            <p className="text-gray-500 col-span-full">Chưa có tin tức.</p>
          )}
        </div>
      )}
    </div>
  );
}
