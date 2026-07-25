import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";
import { rateLimit } from "@/lib/rate-limit";

const GENERIC_MSG =
  "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được xử lý.";

function allowResetUrlInResponse(): boolean {
  // Chi demo local / khi bat DEMO_AUTH — khong bao gio lo token tren production
  if (process.env.DEMO_AUTH === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return apiError("Quá nhiều yêu cầu. Thử lại sau ít phút.", 429);
  }

  const body = await req.json();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  if (!email) return apiError("Vui lòng nhập email");

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return apiSuccess({ sent: true, message: GENERIC_MSG });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/dat-lai-mat-khau?token=${token}`;

  // TODO: gui email SMTP that trong moi truong production
  if (allowResetUrlInResponse()) {
    return apiSuccess({
      sent: true,
      message: "Đã tạo link đặt lại mật khẩu (chế độ demo local).",
      resetUrl,
      demo: true,
    });
  }

  // Khong log token / URL — tranh lo qua he thong log
  console.info("[forgot-password] reset requested for user", user.id);
  return apiSuccess({ sent: true, message: GENERIC_MSG });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const token = String(body.token || "").trim();
  const newPassword = String(body.newPassword || "");

  if (!token) return apiError("Thiếu token");
  if (newPassword.length < 6) return apiError("Mật khẩu mới phải từ 6 ký tự");

  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });
  if (!record || record.used || record.expiresAt < new Date()) {
    return apiError("Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
  }

  const hashed = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { password: hashed },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { used: true },
    }),
  ]);

  return apiSuccess({ reset: true });
}
