import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";
import { rateLimit } from "@/lib/rate-limit";
import {
  allowAuthDemoSecrets,
  issueEmailVerificationCode,
  sendVerificationEmail,
} from "@/lib/email-verify";

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

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
      return apiError("Email không hợp lệ");
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const rl = rateLimit(`register:ip:${ip}`, 8, 60 * 60 * 1000);
    if (!rl.ok) {
      return apiError("Đăng ký quá nhiều lần. Thử lại sau.", 429);
    }

    const emailKey = String(email).toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: emailKey },
    });

    if (existing?.emailVerified) {
      return apiError("Email đã được sử dụng");
    }

    const hashed = await hashPassword(password);
    let user;
    if (existing && !existing.emailVerified) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          phone: phone.trim(),
          password: hashed,
          authProvider: "credentials",
          providerId: null,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          name: name.trim(),
          email: emailKey,
          phone: phone.trim(),
          password: hashed,
          role: "CUSTOMER",
          authProvider: "credentials",
          emailVerified: false,
        },
      });
    }

    const { code } = await issueEmailVerificationCode(user.id);
    const mail = await sendVerificationEmail({
      email: user.email,
      userName: user.name,
      code,
    });

    const demo = allowAuthDemoSecrets() || !mail.emailed;

    return apiSuccess(
      {
        needsVerification: true,
        email: user.email,
        emailed: mail.emailed,
        message: mail.emailed
          ? "Đã gửi mã xác nhận tới email. Nhập mã để hoàn tất đăng ký."
          : "Chưa gửi được email — dùng mã demo bên dưới (đồ án / chưa cấu hình mail).",
        ...(demo ? { demoCode: code } : {}),
      },
      201
    );
  } catch (e) {
    console.error("[register]", e);
    return apiError("Đăng ký thất bại", 500);
  }
}
