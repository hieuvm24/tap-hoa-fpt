"use client";

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { FeedbackHost } from "@/components/ui";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          {children}
          <FeedbackHost />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
