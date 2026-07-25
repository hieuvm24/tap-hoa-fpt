import type { UserRole } from "@/types/auth";

/** Menu / trang admin — phân quyền thực tế tiệm tạp hóa */
export type AdminPermission =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "promotions"
  | "vouchers"
  | "news"
  | "reports"
  | "settings";

const STAFF_PERMISSIONS: AdminPermission[] = [
  "dashboard",
  "products",
  "orders",
  "customers",
];

const OWNER_PERMISSIONS: AdminPermission[] = [
  ...STAFF_PERMISSIONS,
  "categories",
  "promotions",
  "vouchers",
  "news",
  "reports",
  "settings",
];

export function isOwner(role?: UserRole | string | null): boolean {
  return role === "OWNER";
}

export function isStaff(role?: UserRole | string | null): boolean {
  return role === "STAFF";
}

export function isAdminRole(role?: UserRole | string | null): boolean {
  return role === "OWNER" || role === "STAFF";
}

export function hasPermission(
  role: UserRole | string | null | undefined,
  permission: AdminPermission
): boolean {
  if (role === "OWNER") return OWNER_PERMISSIONS.includes(permission);
  if (role === "STAFF") return STAFF_PERMISSIONS.includes(permission);
  return false;
}

export function canAccessAdminPath(
  role: UserRole | string | null | undefined,
  pathname: string
): boolean {
  if (!isAdminRole(role)) return false;
  if (role === "OWNER") return true;

  // Nhân viên: chỉ thao tác vận hành hàng ngày
  const staffPaths = [
    "/admin",
    "/admin/san-pham",
    "/admin/don-hang",
    "/admin/khach-hang",
  ];
  if (pathname === "/admin") return true;
  return staffPaths.some(
    (p) => p !== "/admin" && (pathname === p || pathname.startsWith(p + "/"))
  );
}

/** Map href sidebar → permission */
export const ADMIN_MENU: {
  href: string;
  label: string;
  permission: AdminPermission;
}[] = [
  { href: "/admin", label: "Tổng quan", permission: "dashboard" },
  { href: "/admin/san-pham", label: "Sản phẩm", permission: "products" },
  { href: "/admin/danh-muc", label: "Danh mục", permission: "categories" },
  { href: "/admin/don-hang", label: "Đơn hàng", permission: "orders" },
  { href: "/admin/khach-hang", label: "Khách hàng", permission: "customers" },
  { href: "/admin/khuyen-mai", label: "Khuyến mãi", permission: "promotions" },
  { href: "/admin/voucher", label: "Voucher", permission: "vouchers" },
  { href: "/admin/tin-tuc", label: "Tin tức", permission: "news" },
  { href: "/admin/bao-cao", label: "Báo cáo", permission: "reports" },
  { href: "/admin/cai-dat", label: "Cài đặt", permission: "settings" },
];
