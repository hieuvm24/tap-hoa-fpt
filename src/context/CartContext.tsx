"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Product } from "@/types";
import { useAuth } from "@/context/AuthContext";

const LEGACY_CART_KEY = "taphoa_cart";
const GUEST_CART_KEY = "taphoa_cart_guest";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  quantity: number;
  categorySlug?: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function cartStorageKey(userId: string | null | undefined) {
  return userId ? `taphoa_cart_u_${userId}` : GUEST_CART_KEY;
}

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as CartItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function loadCart(key: string): CartItem[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(key);
  if (stored) return parseCart(stored);

  // Giỏ cũ dùng chung → chỉ chuyển sang giỏ khách 1 lần, không gắn vào mọi tài khoản
  if (key === GUEST_CART_KEY) {
    const legacy = localStorage.getItem(LEGACY_CART_KEY);
    if (legacy) {
      localStorage.setItem(GUEST_CART_KEY, legacy);
      localStorage.removeItem(LEGACY_CART_KEY);
      return parseCart(legacy);
    }
  }
  return [];
}

function saveCart(key: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(items));
}

export function productToCartItem(product: Product, quantity = 1): CartItem {
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: product.image,
    stock: product.stock,
    quantity,
    categorySlug: product.categorySlug,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const storageKey = useMemo(
    () => cartStorageKey(user?.id ?? null),
    [user?.id]
  );

  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const skipNextSave = useRef(false);

  // Đổi tài khoản / hết loading → nạp đúng giỏ của user đó
  useEffect(() => {
    if (isLoading) return;
    skipNextSave.current = true;

    let next = loadCart(storageKey);

    // Dang nhap: gop gio khach (neu co) vao gio user 1 lan
    if (user?.id) {
      const guestItems = loadCart(GUEST_CART_KEY);
      if (guestItems.length) {
        const map = new Map(next.map((i) => [i.productId, { ...i }]));
        for (const g of guestItems) {
          const cur = map.get(g.productId);
          if (cur) {
            cur.quantity = Math.min(cur.stock, cur.quantity + g.quantity);
          } else {
            map.set(g.productId, { ...g });
          }
        }
        next = [...map.values()];
        localStorage.removeItem(GUEST_CART_KEY);
        saveCart(storageKey, next);
      }
    }

    setItems(next);
    setHydrated(true);
  }, [storageKey, isLoading, user?.id]);

  useEffect(() => {
    if (!hydrated || isLoading) return;
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    saveCart(storageKey, items);
  }, [items, hydrated, storageKey, isLoading]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: Math.min(i.stock, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, productToCartItem(product, quantity)];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.min(i.stock, quantity) }
              : i
          )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
