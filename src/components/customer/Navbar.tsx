"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Store,
  LogOut,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { UserMenu } from "./UserMenu";
import { SearchBox } from "./SearchBox";
import { api } from "@/lib/api";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/danh-muc", label: "Danh mục" },
  { href: "/khuyen-mai", label: "Khuyến mãi" },
  { href: "/tin-tuc", label: "Tin tức" },
  { href: "/yeu-thich", label: "Yêu thích" },
  { href: "/lien-he", label: "Liên hệ" },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [storeName, setStoreName] = useState("Tạp Hóa FPT");
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const { itemCount } = useCart();

  useEffect(() => {
    api.store.get().then((res) => {
      if (res.success && res.data) setStoreName(res.data.name);
    });
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500 text-white">
              <Store className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold text-gray-900">{storeName}</span>
              <p className="text-xs text-primary-600 leading-none">Online & tại quầy</p>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 rounded-lg transition-colors hover:text-primary-600 hover:bg-primary-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block flex-1 max-w-md">
            <SearchBox />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href={isAuthenticated ? "/gio-hang" : "/dang-nhap?redirect=/gio-hang"}
              className="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-primary-50 hover:text-primary-600"
              title={isAuthenticated ? "Giỏ hàng" : "Đăng nhập để xem giỏ hàng"}
            >
              <ShoppingCart className="h-5 w-5" />
              {isAuthenticated && itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </Link>

            <UserMenu />

            {/* Mobile user icon */}
            {!isLoading && !isAuthenticated && (
              <Link
                href="/dang-nhap"
                className="sm:hidden rounded-lg p-2 text-gray-600 hover:bg-primary-50 hover:text-primary-600"
              >
                <User className="h-5 w-5" />
              </Link>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="md:hidden pb-3">
          <SearchBox onSearched={() => setIsMenuOpen(false)} />
        </div>
      </div>

      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 border-t border-gray-100",
          isMenuOpen ? "max-h-[480px]" : "max-h-0"
        )}
      >
        <nav className="px-4 py-3 space-y-1 bg-white">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-600"
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-gray-100 pt-2 mt-2">
            {isAuthenticated ? (
              <>
                <p className="px-3 py-1 text-xs text-gray-400">Xin chào, {user?.name}</p>
                {user?.role === "CUSTOMER" && (
                  <>
                    <Link
                      href="/tai-khoan"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-primary-50"
                    >
                      <User className="h-4 w-4" />
                      Tài khoản
                    </Link>
                    <Link
                      href="/don-hang"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-primary-50"
                    >
                      <Package className="h-4 w-4" />
                      Đơn hàng
                    </Link>
                  </>
                )}
                {(user?.role === "OWNER" || user?.role === "STAFF") && (
                  <Link
                    href="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-primary-50"
                  >
                    <Store className="h-4 w-4" />
                    Quản trị
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setIsMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 px-1">
                <Link
                  href="/dang-nhap"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg border border-gray-200 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dang-ky"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg bg-primary-500 py-2.5 text-center text-sm font-medium text-white hover:bg-primary-600"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
