"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export function RedirectIfAuthenticated({ to = "/" }: { to?: string }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (user.role === "OWNER" || user.role === "STAFF") {
      router.replace("/admin");
    } else {
      router.replace(to);
    }
  }, [isAuthenticated, isLoading, user, router, to]);

  return null;
}
