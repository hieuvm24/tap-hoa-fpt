"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";

export default function AdminError({
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
    <div className="rounded-xl border bg-white p-8 text-center">
      <h2 className="text-xl font-bold mb-2">Lỗi trang quản trị</h2>
      <p className="text-gray-500 mb-4 text-sm">{error.message}</p>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
