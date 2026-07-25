"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Users,
  Tag,
  Ticket,
  Newspaper,
  BarChart3,
  Settings,
  Store,
  X,
  HandCoins,
  MessagesSquare,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { ADMIN_MENU, hasPermission } from "@/lib/permissions";

const iconByHref: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/san-pham": Package,
  "/admin/danh-muc": FolderTree,
  "/admin/don-hang": ShoppingBag,
  "/admin/ban-tai-quay": HandCoins,
  "/admin/khach-hang": Users,
  "/admin/tin-nhan": MessagesSquare,
  "/admin/khuyen-mai": Tag,
  "/admin/voucher": Ticket,
  "/admin/tin-tuc": Newspaper,
  "/admin/bao-cao": BarChart3,
  "/admin/cai-dat": Settings,
};

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.role;

  const visibleItems = ADMIN_MENU.filter((item) =>
    hasPermission(role, item.permission)
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-64 bg-gray-900 text-white transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-800 px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <span className="block text-sm font-bold leading-tight">
                Admin Panel
              </span>
              <span className="text-[10px] text-gray-400">
                {role === "OWNER" ? "Chủ cửa hàng" : "Nhân viên"}
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 hover:bg-gray-800 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1 p-3">
          {visibleItems.map((item) => {
            const Icon = iconByHref[item.href] || Package;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-500 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {role === "STAFF" && (
          <p className="px-4 text-[11px] leading-relaxed text-gray-500">
            Nhân viên xử lý đơn, kho hàng và khách. Báo cáo / khuyến mãi / cài
            đặt do chủ cửa hàng quản lý.
          </p>
        )}

        <div className="absolute bottom-4 left-0 right-0 px-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            ← Về trang chủ
          </Link>
        </div>
      </aside>
    </>
  );
}
