"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Search,
  Menu,
  User,
  LogOut,
  Settings,
  Package,
  Home,
  ChevronDown,
} from "lucide-react";
import { Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import { isOwner } from "@/lib/permissions";
import type { Order } from "@/types";

interface AdminTopbarProps {
  onMenuClick: () => void;
  title?: string;
}

const roleLabels: Record<string, string> = {
  OWNER: "Chủ cửa hàng",
  STAFF: "Nhân viên",
};

export function AdminTopbar({ onMenuClick, title }: AdminTopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const loadNotifications = async (showLoading = true) => {
    if (showLoading) setLoadingNotif(true);
    const res = await api.orders.list({ status: "pending", limit: "8" });
    if (res.success && res.data) {
      setPendingOrders(res.data.slice(0, 8));
    } else {
      setPendingOrders([]);
    }
    if (showLoading) setLoadingNotif(false);
  };

  // Chấm đỏ: tải số đơn chờ khi vào admin
  useEffect(() => {
    void loadNotifications(false);
  }, []);

  const toggleNotif = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    setUserOpen(false);
    if (next) void loadNotifications();
  };

  const toggleUser = () => {
    setUserOpen((v) => !v);
    setNotifOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    router.push("/dang-nhap");
  };

  const displayName = user?.name || "Admin";
  const shortName = displayName.split(" ").slice(-2).join(" ");
  const notifCount = pendingOrders.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="hidden text-lg font-semibold text-gray-900 sm:block">
            {title}
          </h1>
        )}
      </div>

      <div className="flex max-w-xl flex-1 items-center justify-end gap-2 sm:gap-3">
        <div className="hidden max-w-xs flex-1 md:block">
          <Input
            placeholder="Tìm kiếm..."
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Thông báo */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={toggleNotif}
            className={cn(
              "relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100",
              notifOpen && "bg-gray-100 text-primary-600"
            )}
            aria-label="Thông báo"
            aria-expanded={notifOpen}
          >
            <Bell className="h-5 w-5" />
            {notifCount > 0 && (
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg sm:w-96">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">Thông báo</p>
                <span className="text-xs text-gray-500">
                  {loadingNotif ? "Đang tải..." : `${notifCount} đơn chờ`}
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loadingNotif ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-400">
                    Đang tải...
                  </p>
                ) : pendingOrders.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-400">
                    Không có đơn hàng chờ xử lý
                  </p>
                ) : (
                  pendingOrders.map((order) => (
                    <Link
                      key={order.id}
                      href="/admin/don-hang"
                      onClick={() => setNotifOpen(false)}
                      className="flex items-start gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-primary-50"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          Đơn {order.orderCode}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {order.customerName} · {formatPrice(order.total)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <Link
                href="/admin/don-hang"
                onClick={() => setNotifOpen(false)}
                className="block border-t border-gray-100 px-4 py-2.5 text-center text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                Xem tất cả đơn hàng
              </Link>
            </div>
          )}
        </div>

        {/* Tài khoản */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={toggleUser}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2 py-1 transition-colors",
              userOpen ? "bg-gray-100" : "hover:bg-gray-100"
            )}
            aria-label="Menu tài khoản"
            aria-expanded={userOpen}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <User className="h-4 w-4" />
            </div>
            <span className="hidden text-sm font-medium text-gray-700 sm:block">
              {shortName}
            </span>
            <ChevronDown
              className={cn(
                "hidden h-4 w-4 text-gray-400 transition-transform sm:block",
                userOpen && "rotate-180"
              )}
            />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="truncate font-medium text-gray-900">{displayName}</p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
                {user?.role && (
                  <p className="mt-0.5 text-[11px] text-primary-600">
                    {roleLabels[user.role] || user.role}
                  </p>
                )}
              </div>

              <div className="py-1">
                {isOwner(user?.role) && (
                  <Link
                    href="/admin/cai-dat"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                  >
                    <Settings className="h-4 w-4" />
                    Cài đặt cửa hàng
                  </Link>
                )}
                <Link
                  href="/"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600"
                >
                  <Home className="h-4 w-4" />
                  Về trang chủ
                </Link>
              </div>

              <div className="border-t border-gray-100 pt-1">
                <button
                  type="button"
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
      </div>
    </header>
  );
}
