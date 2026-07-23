import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  createToken,
  setAuthCookie,
  hashPassword,
  verifyPassword,
} from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";
import type { UserRole } from "@/types/auth";

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || undefined,
    avatar: user.avatar || undefined,
    role: user.role as import("@/types/auth").UserRole,
    createdAt: user.createdAt.toISOString().split("T")[0],
  };
}

function getRedirectForRole(role: UserRole): string {
  if (role === "OWNER" || role === "STAFF") return "/admin";
  return "/";
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return apiError("Email và mật khẩu là bắt buộc");
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      return apiError("Email hoặc mật khẩu không đúng", 401);
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });
    await setAuthCookie(token);

    return apiSuccess({
      user: toAuthUser(user),
      redirect: getRedirectForRole(user.role as UserRole),
    });
  } catch {
    return apiError("Đăng nhập thất bại", 500);
  }
}
