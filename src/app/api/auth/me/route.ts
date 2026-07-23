import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  getSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

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

export async function GET() {
  const session = await getSession();
  if (!session) {
    return apiSuccess({ user: null });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return apiSuccess({ user: null });
  }

  return apiSuccess({ user: toAuthUser(user) });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();

  if (body.currentPassword && body.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return apiError("Người dùng không tồn tại", 404);
    const ok = await verifyPassword(body.currentPassword, user.password);
    if (!ok) return apiError("Mật khẩu hiện tại không đúng");
    if (String(body.newPassword).length < 6) {
      return apiError("Mật khẩu mới phải từ 6 ký tự");
    }
    const hashed = await hashPassword(String(body.newPassword));
    const updated = await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashed },
    });
    return apiSuccess({ user: toAuthUser(updated), passwordChanged: true });
  }

  const { name, phone, avatar } = body;
  const user = await prisma.user.update({
    where: { id: session.userId },
    data: {
      ...(name && { name: String(name).trim() }),
      ...(phone !== undefined && { phone: String(phone).trim() }),
      ...(avatar !== undefined && {
        avatar: avatar ? String(avatar).trim() : null,
      }),
    },
  });

  return apiSuccess({ user: toAuthUser(user) });
}
