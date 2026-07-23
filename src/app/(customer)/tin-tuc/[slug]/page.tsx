"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { api } from "@/lib/api";
import type { NewsArticle } from "@/types";

export default function NewsDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api.news.get(slug).then((res) => {
      if (res.success && res.data) setArticle(res.data);
      else setMissing(true);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Đang tải...</div>;
  }
  if (missing || !article) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/tin-tuc"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6"
      >
        <ChevronLeft className="h-4 w-4" />
        Quay lại tin tức
      </Link>
      <p className="text-sm text-gray-400 mb-2">
        {new Date(article.publishedAt).toLocaleDateString("vi-VN")}
      </p>
      <h1 className="text-3xl font-bold text-gray-900 mb-4">{article.title}</h1>
      <p className="text-lg text-gray-500 mb-6">{article.excerpt}</p>
      <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 bg-gray-100">
        <Image src={article.image} alt={article.title} fill className="object-cover" />
      </div>
      <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed">
        {article.content}
      </div>
    </article>
  );
}
