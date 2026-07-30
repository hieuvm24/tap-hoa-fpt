import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";
import { rateLimit } from "@/lib/rate-limit";
import {
  buildPasswordResetEmail,
  isMailConfigured,
  sendMail,
} from "@/lib/mail";
import { DEFAULT_STORE } from "@/config/defaults";

const GENERIC_MSG =
  "Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi (hoặc xử lý).";

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
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return apiError("Email không hợp lệ");
  }

  const emailRl = rateLimit(`forgot:email:${email}`, 3, 15 * 60 * 1000);
  if (!emailRl.ok) {
    return apiError("Email này đã yêu cầu quá nhiều lần. Thử lại sau.", 429);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Luôn trả thông báo chung — tránh lộ email có/không tồn tại
  if (!user) {
    return apiSuccess({
      sent: true,
      emailed: false,
      message: GENERIC_MSG,
    });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Vô hiệu token cũ chưa dùng
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  const base =
    appUrl.startsWith("http") ? appUrl : `https://${appUrl}`;
  const resetUrl = `${base}/dat-lai-mat-khau?token=${token}`;

  const store = await prisma.storeSetting.findUnique({
    where: { id: "default" },
  });
  const storeName = store?.name || DEFAULT_STORE.name;

  const mailBody = buildPasswordResetEmail({
    storeName,
    userName: user.name,
    resetUrl,
  });

  let emailed = false;
  let mailError: string | undefined;

  if (isMailConfigured()) {
    const result = await sendMail({
      to: user.email,
      subject: mailBody.subject,
      html: mailBody.html,
      text: mailBody.text,
    });
    emailed = result.ok;
    if (!result.ok) {
      mailError = result.error;
      console.error("[forgot-password] mail failed:", result.error);
    } else {
      console.info(
        "[forgot-password] mail sent via",
        result.provider,
        "user",
        user.id
      );
    }
  }

  // Local / DEMO: trả link để test khi chưa cấu hình mail
  if (allowResetUrlInResponse() && (!emailed || process.env.DEMO_AUTH === "true")) {
    return apiSuccess({
      sent: true,
      emailed,
      demo: true,
      message: emailed
        ? "Đã gửi email đặt lại mật khẩu. (Demo vẫn hiện link bên dưới.)"
        : isMailConfigured()
          ? "Gửi email lỗi — dùng link demo bên dưới."
          : "Chưa cấu hình email — dùng link demo bên dưới.",
      resetUrl,
      mailError: mailError || undefined,
    });
  }

  if (!emailed && isMailConfigured()) {
    // Production có cấu hình mail nhưng gửi thất bại
    return apiError(
      "Không gửi được email lúc này. Thử lại sau hoặc liên hệ cửa hàng.",
      502
    );
  }

  if (!emailed && !isMailConfigured() && !allowResetUrlInResponse()) {
    // Production chưa cấu hình mail
    console.error(
      "[forgot-password] MAIL not configured (RESEND_API_KEY or SMTP_*)"
    );
    return apiError(
      "Hệ thống chưa cấu hình gửi email. Liên hệ cửa hàng để hỗ trợ.",
      503
    );
  }

  return apiSuccess({
    sent: true,
    emailed: true,
    message:
      "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu. Kiểm tra hộp thư (và Spam).",
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
    // Thu hồi mọi token reset còn lại của user
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, used: false },
      data: { used: true },
    }),
  ]);

  return apiSuccess({ reset: true });
}
