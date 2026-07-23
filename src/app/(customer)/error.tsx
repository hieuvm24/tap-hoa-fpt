"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
      <p className="text-gray-500 mb-6">
        Không tải được trang. Bạn có thể thử lại.
      </p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
