import crypto from "crypto";
import { prisma } from "@/lib/db";
import {
  buildEmailVerificationEmail,
  isMailConfigured,
  sendMail,
} from "@/lib/mail";
import { DEFAULT_STORE } from "@/config/defaults";

export function allowAuthDemoSecrets(): boolean {
  if (process.env.DEMO_AUTH === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function generateVerifyCode() {
  return String(crypto.randomInt(100000, 1000000));
}

export async function issueEmailVerificationCode(userId: string) {
  const code = generateVerifyCode();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.emailVerificationToken.updateMany({
    where: { userId, used: false },
    data: { used: true },
  });

  await prisma.emailVerificationToken.create({
    data: { userId, code, expiresAt },
  });

  return { code, expiresAt };
}

export async function sendVerificationEmail(opts: {
  email: string;
  userName: string;
  code: string;
}) {
  const store = await prisma.storeSetting.findUnique({
    where: { id: "default" },
  });
  const storeName = store?.name || DEFAULT_STORE.name;
  const mailBody = buildEmailVerificationEmail({
    storeName,
    userName: opts.userName,
    code: opts.code,
  });

  if (!isMailConfigured()) {
    return { emailed: false as const };
  }

  const result = await sendMail({
    to: opts.email,
    subject: mailBody.subject,
    html: mailBody.html,
    text: mailBody.text,
  });

  if (!result.ok) {
    console.error("[verify-email] mail failed:", result.error);
    return { emailed: false as const, error: result.error };
  }
  return { emailed: true as const, provider: result.provider };
}
