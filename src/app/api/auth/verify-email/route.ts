import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  createToken,
  setAuthCookie,
} from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";
import { rateLimit } from "@/lib/rate-limit";
import {
  allowAuthDemoSecrets,
  issueEmailVerificationCode,
  sendVerificationEmail,
} from "@/lib/email-verify";
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
    role: user.role as UserRole,
    createdAt: user.createdAt.toISOString().split("T")[0],
  };
}

/** Xác nhận mã email sau đăng ký */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const code = String(body.code || "")
    .trim()
    .replace(/\s/g, "");

  if (!email || !code) return apiError("Vui lòng nhập email và mã xác nhận");

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`verify:${ip}:${email}`, 12, 15 * 60 * 1000);
  if (!rl.ok) return apiError("Thử quá nhiều lần. Đợi vài phút.", 429);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return apiError("Không tìm thấy tài khoản", 404);
  if (user.emailVerified) {
    return apiError("Email đã được xác nhận. Hãy đăng nhập.");
  }

  const record = await prisma.emailVerificationToken.findFirst({
    where: {
      userId: user.id,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return apiError("Mã không đúng hoặc đã hết hạn");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    }),
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { used: true },
    }),
    prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    }),
  ]);

  const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  const token = await createToken({
    userId: fresh.id,
    email: fresh.email,
    role: fresh.role as UserRole,
  });
  await setAuthCookie(token);

  return apiSuccess({
    user: toAuthUser(fresh),
    verified: true,
  });
}

/** Gửi lại mã xác nhận */
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  if (!email) return apiError("Vui lòng nhập email");

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`resend-verify:${ip}:${email}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return apiError("Gửi lại quá nhiều lần. Thử lại sau.", 429);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return apiSuccess({
      sent: true,
      message: "Nếu email tồn tại và chưa xác nhận, mã mới đã được xử lý.",
    });
  }
  if (user.emailVerified) {
    return apiError("Email đã xác nhận. Hãy đăng nhập.");
  }

  const { code } = await issueEmailVerificationCode(user.id);
  const mail = await sendVerificationEmail({
    email: user.email,
    userName: user.name,
    code,
  });
  const demo = allowAuthDemoSecrets() || !mail.emailed;

  return apiSuccess({
    sent: true,
    emailed: mail.emailed,
    message: mail.emailed
      ? "Đã gửi lại mã xác nhận."
      : "Chưa gửi được email — dùng mã demo bên dưới.",
    ...(demo ? { demoCode: code } : {}),
  });
}
