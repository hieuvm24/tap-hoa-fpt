import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import {
  getSession,
  isOwnerRole,
  hashPassword,
} from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

/** Cập nhật / reset mật khẩu / đổi role nhân viên */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) {
    return apiError("Chỉ chủ cửa hàng quản lý nhân viên", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return apiError("Không tìm thấy tài khoản", 404);
  if (user.role !== "STAFF" && user.role !== "OWNER") {
    return apiError("Không phải tài khoản nhân sự");
  }

  // Không cho tự hạ quyền / xóa chính mình qua PATCH này
  if (id === session.userId && body.role && body.role !== "OWNER") {
    return apiError("Không thể tự đổi vai trò của chính bạn");
  }

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    data.name = body.name.trim();
  }
  if (typeof body.phone === "string") {
    data.phone = body.phone.trim() || null;
  }
  if (body.role === "STAFF" || body.role === "OWNER") {
    data.role = body.role;
  }
  if (typeof body.password === "string" && body.password.length >= 6) {
    data.password = await hashPassword(body.password);
  }

  if (Object.keys(data).length === 0) {
    return apiError("Không có dữ liệu cập nhật");
  }

  const updated = await prisma.user.update({ where: { id }, data });
  return apiSuccess({
    id: updated.id,
    email: updated.email,
    name: updated.name,
    phone: updated.phone || undefined,
    role: updated.role,
    avatar: updated.avatar || undefined,
    createdAt: updated.createdAt.toISOString(),
  });
}

/** Xóa nhân viên (không xóa OWNER cuối cùng) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) {
    return apiError("Chỉ chủ cửa hàng quản lý nhân viên", 403);
  }

  const { id } = await params;
  if (id === session.userId) {
    return apiError("Không thể xóa chính tài khoản đang đăng nhập");
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return apiError("Không tìm thấy tài khoản", 404);
  if (user.role === "OWNER") {
    const ownerCount = await prisma.user.count({ where: { role: "OWNER" } });
    if (ownerCount <= 1) {
      return apiError("Không thể xóa chủ cửa hàng cuối cùng");
    }
  }
  if (user.role !== "STAFF" && user.role !== "OWNER") {
    return apiError("Chỉ xóa được tài khoản nhân sự");
  }

  await prisma.user.delete({ where: { id } });
  return apiSuccess({ message: "Đã xóa nhân viên" });
}
