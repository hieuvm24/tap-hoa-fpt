import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "taphoa_token";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "taphoa-anphu-dev-secret"
);

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
  }

  if (pathname.startsWith("/tai-khoan") || pathname.startsWith("/yeu-thich")) {
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/dang-nhap";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/tai-khoan/:path*", "/yeu-thich/:path*"],
};
