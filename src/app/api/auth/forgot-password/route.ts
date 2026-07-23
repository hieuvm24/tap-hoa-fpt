import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  if (!email) return apiError("Vui lòng nhập email");

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to avoid email enumeration
  if (!user) {
    return apiSuccess({
      sent: true,
      message: "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được tạo.",
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/dat-lai-mat-khau?token=${token}`;

  // Dev/demo: return resetUrl so UI can show it (no SMTP configured)
  return apiSuccess({
    sent: true,
    message: "Đã tạo link đặt lại mật khẩu (demo — không gửi email thật).",
    resetUrl,
    demo: true,
  });
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
