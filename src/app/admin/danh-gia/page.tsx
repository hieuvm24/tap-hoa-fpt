"use client";

import { useEffect, useState } from "react";
import { Card, Button, StarRating } from "@/components/ui";
import { api } from "@/lib/api";
import { Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

type AdminReview = {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  productName?: string;
  productSlug?: string;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.reviews.listAdmin({ limit: "50" }).then((res) => {
      if (res.success && res.data) {
        setReviews(res.data.reviews);
        setTotal(res.data.total);
      }
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa đánh giá này?")) return;
    const res = await api.reviews.delete(id);
    if (res.success) load();
    else alert(res.error || "Không xóa được");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Đánh giá sản phẩm</h1>
        <p className="mt-1 text-sm text-gray-500">
          Kiểm duyệt / xóa đánh giá không phù hợp ({total})
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500">Chưa có đánh giá.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <Card key={r.id} className="flex justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-gray-900">{r.customerName}</p>
                  <StarRating rating={r.rating} />
                  <span className="text-xs text-gray-400">
                    {formatDate(r.date)}
                  </span>
                </div>
                <p className="text-sm text-primary-600">
                  {r.productName || "Sản phẩm"}
                </p>
                <p className="mt-1 text-sm text-gray-700">{r.comment}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(r.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
