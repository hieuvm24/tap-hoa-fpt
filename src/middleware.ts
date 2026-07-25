import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { resolveJwtSecretString } from "@/lib/jwt-secret";

const COOKIE_NAME = "taphoa_token";
const JWT_SECRET = new TextEncoder().encode(resolveJwtSecretString());

/** Chỉ chủ cửa hàng */
const OWNER_ONLY_PREFIXES = [
  "/admin/bao-cao",
  "/admin/cai-dat",
  "/admin/voucher",
  "/admin/khuyen-mai",
  "/admin/tin-tuc",
  "/admin/danh-muc",
];

/** Khách phải đăng nhập mới dùng được */
const AUTH_REQUIRED_PREFIXES = [
  "/tai-khoan",
  "/yeu-thich",
  "/gio-hang",
  "/thanh-toan",
  "/don-hang",
];

async function getPayload(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId?: string; role?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await getPayload(req);

  if (pathname.startsWith("/admin")) {
    if (!session || (session.role !== "OWNER" && session.role !== "STAFF")) {
      const url = req.nextUrl.clone();
      url.pathname = "/dang-nhap";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    const needsOwner = OWNER_ONLY_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (needsOwner && session.role !== "OWNER") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // Tra cứu đơn bằng mã + SĐT không cần đăng nhập
  const guestOrderLookup =
    (pathname === "/don-hang" || pathname.startsWith("/don-hang/")) &&
    req.nextUrl.searchParams.get("code") &&
    req.nextUrl.searchParams.get("phone");

  const needsAuth =
    !guestOrderLookup &&
    AUTH_REQUIRED_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
  if (needsAuth && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/dang-nhap";
    url.searchParams.set("redirect", pathname + (req.nextUrl.search || ""));
    return NextResponse.redirect(url);
  }

  // Nhan vien / chu: mua hang khach dung Ban tai quay, khong dung gio hang storefront
  const customerShopPaths = ["/gio-hang", "/thanh-toan", "/yeu-thich"];
  const isCustomerShop = customerShopPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (
    isCustomerShop &&
    session &&
    (session.role === "STAFF" || session.role === "OWNER")
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/ban-tai-quay";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/tai-khoan/:path*",
    "/yeu-thich/:path*",
    "/gio-hang",
    "/gio-hang/:path*",
    "/thanh-toan",
    "/thanh-toan/:path*",
    "/don-hang",
    "/don-hang/:path*",
  ],
};
