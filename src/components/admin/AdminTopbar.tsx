"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Menu,
  User,
  LogOut,
  Settings,
  Package,
  Home,
  ChevronDown,
  Search,
  AlertTriangle,
  Wallet,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import { isOwner } from "@/lib/permissions";

interface AdminTopbarProps {
  onMenuClick: () => void;
  title?: string;
}

type NotifItem = {
  id: string;
  type: "order_pending" | "unpaid" | "low_stock" | "support";
  title: string;
  subtitle: string;
  href: string;
  createdAt: string;
};

const roleLabels: Record<string, string> = {
  OWNER: "Chủ cửa hàng",
  STAFF: "Nhân viên",
};

const notifIcon = {
  order_pending: Package,
  unpaid: Wallet,
  low_stock: AlertTriangle,
  support: MessageSquare,
};

export function AdminTopbar({ onMenuClick, title }: AdminTopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<{
    products: { id: string; name: string; slug: string; price: number }[];
    customers: { id: string; name: string; email: string; phone: string | null }[];
    orders: { id: string; orderCode: string; customerName: string; total: number }[];
  } | null>(null);
  const [items, setItems] = useState<NotifItem[]>([]);
  const [notifTotal, setNotifTotal] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  const loadNotifications = async (showLoading = true) => {
    if (showLoading) setLoadingNotif(true);
    const res = await api.adminNotifications.list();
    if (res.success && res.data) {
      setItems(res.data.items);
      setNotifTotal(res.data.total);
    } else {
      setItems([]);
      setNotifTotal(0);
    }
    if (showLoading) setLoadingNotif(false);
  };

  useEffect(() => {
    void loadNotifications(false);
    const t = setInterval(() => void loadNotifications(false), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (searchQ.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      const res = await api.adminSearch.query(searchQ.trim());
      if (res.success && res.data) setSearchResults(res.data);
    }, 250);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQ]);

  const toggleNotif = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    setUserOpen(false);
    setSearchOpen(false);
    if (next) void loadNotifications();
  };

  const toggleUser = () => {
    setUserOpen((v) => !v);
    setNotifOpen(false);
    setSearchOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    router.push("/dang-nhap");
  };

  const displayName = user?.name || "Admin";
  const shortName = displayName.split(" ").slice(-2).join(" ");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && (
          <h1 className="hidden truncate text-lg font-semibold text-gray-900 sm:block">
            {title}
          </h1>
        )}

        <div ref={searchRef} className="relative ml-auto hidden w-full max-w-md md:block lg:ml-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Tìm SP, khách, đơn..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          {searchOpen && searchResults && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-96 overflow-y-auto rounded-xl border border-gray-100 bg-white py-2 shadow-lg">
              {searchResults.orders.length === 0 &&
              searchResults.products.length === 0 &&
              searchResults.customers.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-gray-400">
                  Không có kết quả
                </p>
              ) : (
                <>
                  {searchResults.orders.length > 0 && (
                    <div className="px-2 pb-2">
                      <p className="px-2 py-1 text-[11px] font-semibold uppercase text-gray-400">
                        Đơn hàng
                      </p>
                      {searchResults.orders.map((o) => (
                        <Link
                          key={o.id}
                          href="/admin/don-hang"
                          onClick={() => setSearchOpen(false)}
                          className="block rounded-lg px-2 py-2 text-sm hover:bg-primary-50"
                        >
                          <span className="font-medium text-primary-600">
                            {o.orderCode}
                          </span>
                          <span className="text-gray-500">
                            {" "}
                            · {o.customerName} · {formatPrice(o.total)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.products.length > 0 && (
                    <div className="px-2 pb-2">
                      <p className="px-2 py-1 text-[11px] font-semibold uppercase text-gray-400">
                        Sản phẩm
                      </p>
                      {searchResults.products.map((p) => (
                        <Link
                          key={p.id}
                          href="/admin/san-pham"
                          onClick={() => setSearchOpen(false)}
                          className="block rounded-lg px-2 py-2 text-sm hover:bg-primary-50"
                        >
                          <span className="font-medium text-gray-900">{p.name}</span>
                          <span className="text-gray-500">
                            {" "}
                            · {formatPrice(p.price)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults.customers.length > 0 && (
                    <div className="px-2 pb-2">
                      <p className="px-2 py-1 text-[11px] font-semibold uppercase text-gray-400">
                        Khách hàng
                      </p>
                      {searchResults.customers.map((c) => (
                        <Link
                          key={c.id}
                          href="/admin/khach-hang"
                          onClick={() => setSearchOpen(false)}
                          className="block rounded-lg px-2 py-2 text-sm hover:bg-primary-50"
                        >
                          <span className="font-medium text-gray-900">{c.name}</span>
                          <span className="text-gray-500">
                            {" "}
                            · {c.phone || c.email}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
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
            {notifTotal > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {notifTotal > 9 ? "9+" : notifTotal}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg sm:w-96">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">Thông báo</p>
                <span className="text-xs text-gray-500">
                  {loadingNotif ? "Đang tải..." : `${notifTotal} mục`}
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {loadingNotif ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-400">
                    Đang tải...
                  </p>
                ) : items.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-gray-400">
                    Không có cảnh báo vận hành
                  </p>
                ) : (
                  items.map((item) => {
                    const Icon = notifIcon[item.type];
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setNotifOpen(false)}
                        className="flex items-start gap-3 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-primary-50"
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                            item.type === "low_stock" &&
                              "bg-red-50 text-red-600",
                            item.type === "unpaid" &&
                              "bg-amber-50 text-amber-600",
                            item.type === "order_pending" &&
                              "bg-blue-50 text-blue-600",
                            item.type === "support" &&
                              "bg-violet-50 text-violet-600"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {item.title}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {item.subtitle}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              <Link
                href="/admin"
                onClick={() => setNotifOpen(false)}
                className="block border-t border-gray-100 px-4 py-2.5 text-center text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                Về tổng quan cửa hàng
              </Link>
            </div>
          )}
        </div>

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
