import crypto from "crypto";
import { prisma } from "@/lib/db";
import {
  createToken,
  hashPassword,
  setAuthCookie,
} from "@/lib/auth-server";
import type { OAuthProfile } from "@/lib/oauth";
import type { UserRole } from "@/types/auth";

function redirectForRole(role: UserRole) {
  if (role === "OWNER" || role === "STAFF") return "/admin";
  return "/";
}

/** Tạo / liên kết user OAuth rồi set cookie đăng nhập */
export async function loginWithOAuthProfile(profile: OAuthProfile) {
  const byProvider = await prisma.user.findFirst({
    where: {
      authProvider: profile.provider,
      providerId: profile.providerId,
    },
  });

  let user = byProvider;

  if (!user) {
    const byEmail = await prisma.user.findUnique({
      where: { email: profile.email },
    });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          authProvider: profile.provider,
          providerId: profile.providerId,
          emailVerified: true,
          avatar: byEmail.avatar || profile.avatar || undefined,
          name: byEmail.name || profile.name,
        },
      });
    } else {
      const randomPass = await hashPassword(
        crypto.randomBytes(32).toString("hex")
      );
      user = await prisma.user.create({
        data: {
          email: profile.email,
          password: randomPass,
          name: profile.name,
          avatar: profile.avatar,
          role: "CUSTOMER",
          authProvider: profile.provider,
          providerId: profile.providerId,
          emailVerified: true,
        },
      });
    }
  } else if (!user.emailVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });
  }

  const role = user.role as UserRole;
  const token = await createToken({
    userId: user.id,
    email: user.email,
    role,
  });
  await setAuthCookie(token);

  return { user, redirect: redirectForRole(role) };
}
