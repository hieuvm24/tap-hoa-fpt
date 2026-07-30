import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  getSession,
  isOwnerRole,
  hashPassword,
} from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

function mapStaff(u: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  avatar: string | null;
  createdAt: Date;
}) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    phone: u.phone || undefined,
    role: u.role as "STAFF" | "OWNER",
    avatar: u.avatar || undefined,
    createdAt: u.createdAt.toISOString(),
  };
}

/** Danh sách nhân viên / chủ (OWNER) */
export async function GET() {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) {
    return apiError("Chỉ chủ cửa hàng quản lý nhân viên", 403);
  }

  const users = await prisma.user.findMany({
    where: { role: { in: ["STAFF", "OWNER"] } },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return apiSuccess(users.map(mapStaff));
}

/** Thêm nhân viên mới */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) {
    return apiError("Chỉ chủ cửa hàng quản lý nhân viên", 403);
  }

  const body = await req.json();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").trim() || null;
  const password = String(body.password || "");
  const role = body.role === "OWNER" ? "OWNER" : "STAFF";

  if (!name || !email) return apiError("Thiếu tên hoặc email");
  if (password.length < 6) return apiError("Mật khẩu tối thiểu 6 ký tự");

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return apiError("Email đã được sử dụng");

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      role,
      password: await hashPassword(password),
    },
  });

  return apiSuccess(mapStaff(user), 201);
}
