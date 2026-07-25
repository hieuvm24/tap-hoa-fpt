"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/** Trả về true nếu đã đăng nhập; nếu chưa thì chuyển tới trang đăng nhập */
export function useRequireLogin() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (redirectTo?: string) => {
      if (isLoading) return false;
      if (isAuthenticated) return true;
      const target = redirectTo || pathname || "/";
      router.push(`/dang-nhap?redirect=${encodeURIComponent(target)}`);
      return false;
    },
    [isAuthenticated, isLoading, pathname, router]
  );
}
