"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, StarRating } from "@/components/ui";
import { api } from "@/lib/api";
import { Review } from "@/types";

export function ReviewSlider() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    api.reviews.list().then((res) => {
      if (res.success && res.data) setReviews(res.data);
    });
  }, []);

  if (!reviews.length) return null;

  const review = reviews[current];

  return (
    <section className="py-12 bg-primary-50">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">Khách hàng nói gì</h2>
        <Card className="relative">
          <div className="flex justify-center mb-4">
            <StarRating rating={review.rating} size="md" />
          </div>
          <p className="text-gray-600 text-lg italic mb-4">&ldquo;{review.comment}&rdquo;</p>
          <p className="font-semibold text-gray-900">{review.customerName}</p>

          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => setCurrent((c) => (c - 1 + reviews.length) % reviews.length)}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrent((c) => (c + 1) % reviews.length)}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </Card>
      </div>
    </section>
  );
}
