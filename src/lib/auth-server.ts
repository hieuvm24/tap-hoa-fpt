import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/types/auth";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "taphoa_token";
const TOKEN_EXPIRY = "7d";
const DEV_FALLBACK = "taphoa-fpt-dev-secret";

/**
 * Lazy secret — khong throw luc import (Next collect page data se crash build).
 * Production thieu JWT_SECRET: createToken loi ro; verifyToken fail-closed.
 */
function getJwtSecret(): Uint8Array | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return new TextEncoder().encode(secret);
  if (process.env.NODE_ENV === "production") return null;
  return new TextEncoder().encode(DEV_FALLBACK);
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error(
      "JWT_SECRET is required in production. Set it in Vercel → Settings → Environment Variables."
    );
  }
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  const secret = getJwtSecret();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  // Doc role tu DB — JWT cu khong con quyen sau khi doi vai tro / xoa tai khoan
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true },
  });
  if (!user) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
  };
}

export function isAdminRole(role: UserRole): boolean {
  return role === "OWNER" || role === "STAFF";
}

export function isOwnerRole(role: UserRole): boolean {
  return role === "OWNER";
}

export { COOKIE_NAME };
