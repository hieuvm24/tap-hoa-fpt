import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createToken, setAuthCookie, hashPassword } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";
import { rateLimit } from "@/lib/rate-limit";

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

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name?.trim() || !email || !phone || !password) {
      return apiError("Vui lòng điền đầy đủ thông tin");
    }

    if (password.length < 6) {
      return apiError("Mật khẩu phải có ít nhất 6 ký tự");
    }

    if (!/^0\d{9}$/.test(phone.replace(/\s/g, ""))) {
      return apiError("Số điện thoại không hợp lệ (10 số, bắt đầu 0)");
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rl = rateLimit(`register:ip:${ip}`, 8, 60 * 60 * 1000);
    if (!rl.ok) {
      return apiError("Đăng ký quá nhiều lần. Thử lại sau.", 429);
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return apiError("Email đã được sử dụng");
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password: hashed,
        role: "CUSTOMER",
      },
    });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role as import("@/types/auth").UserRole,
    });
    await setAuthCookie(token);

    return apiSuccess({ user: toAuthUser(user) }, 201);
  } catch {
    return apiError("Đăng ký thất bại", 500);
  }
}
