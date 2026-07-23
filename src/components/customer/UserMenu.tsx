"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  User,
  Package,
  LogOut,
  ChevronDown,
  Settings,
  LayoutDashboard,
  Heart,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const roleLabels = {
  CUSTOMER: "Khách hàng",
  STAFF: "Nhân viên",
  OWNER: "Chủ cửa hàng",
};

export function UserMenu() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-100 hidden sm:block" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="hidden sm:flex items-center gap-1">
        <Link
          href="/dang-nhap"
          className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
        >
          Đăng nhập
        </Link>
        <Link
          href="/dang-ky"
          className="rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors shadow-sm"
        >
          Đăng ký
        </Link>
      </div>
    );
  }

  const isAdmin = user?.role === "OWNER" || user?.role === "STAFF";

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    router.push("/");
  };

  return (
    <div ref={menuRef} className="relative hidden sm:block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors",
          isOpen ? "bg-primary-50" : "hover:bg-gray-50"
        )}
      >
        {user?.avatar ? (
          <Image
            src={user.avatar}
            alt={user.name}
            width={32}
            height={32}
            className="rounded-full object-cover ring-2 ring-primary-100"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <User className="h-4 w-4" />
          </div>
        )}
        <div className="hidden xl:block text-left">
          <p className="text-sm font-medium text-gray-900 leading-none truncate max-w-[100px]">
            {user?.name.split(" ").slice(-2).join(" ")}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">{roleLabels[user!.role]}</p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-gray-400 transition-transform hidden xl:block", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-100 bg-white py-2 shadow-lg animate-slide-up z-50">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>

          <div className="py-1">
            {user?.role === "CUSTOMER" && (
              <>
                <Link
                  href="/tai-khoan"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                >
                  <User className="h-4 w-4" />
                  Tài khoản của tôi
                </Link>
                <Link
                  href="/don-hang"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                >
                  <Package className="h-4 w-4" />
                  Đơn hàng của tôi
                </Link>
                <Link
                  href="/yeu-thich"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                >
                  <Heart className="h-4 w-4" />
                  Yêu thích
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600"
              >
                <LayoutDashboard className="h-4 w-4" />
                Trang quản trị
              </Link>
            )}

            {user?.role === "CUSTOMER" && (
              <Link
                href="/tai-khoan?tab=settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600"
              >
                <Settings className="h-4 w-4" />
                Cài đặt
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
