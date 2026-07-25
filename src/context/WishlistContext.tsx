"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface WishlistContextValue {
  likedIds: Set<string>;
  isLiked: (productId: string) => boolean;
  toggle: (productId: string) => Promise<{ ok: boolean; error?: string }>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setLikedIds(new Set());
      return;
    }
    const res = await api.wishlist.list();
    if (res.success && res.data) {
      setLikedIds(new Set(res.data.map((i) => i.productId)));
    } else {
      setLikedIds(new Set());
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading) return;
    void refresh();
  }, [user?.id, isLoading, refresh]);

  const isLiked = useCallback(
    (productId: string) => likedIds.has(productId),
    [likedIds]
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) {
        return { ok: false, error: "LOGIN_REQUIRED" };
      }
      const currently = likedIds.has(productId);
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (currently) next.delete(productId);
        else next.add(productId);
        return next;
      });
      const res = currently
        ? await api.wishlist.remove(productId)
        : await api.wishlist.add(productId);
      if (!res.success) {
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (currently) next.add(productId);
          else next.delete(productId);
          return next;
        });
        return { ok: false, error: res.error };
      }
      return { ok: true };
    },
    [isAuthenticated, likedIds]
  );

  const value = useMemo(
    () => ({ likedIds, isLiked, toggle, refresh }),
    [likedIds, isLiked, toggle, refresh]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
