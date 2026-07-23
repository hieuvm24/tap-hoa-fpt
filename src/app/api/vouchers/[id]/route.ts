import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return apiError("Forbidden", 403);

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.code !== undefined)
    data.code = String(body.code).trim().toUpperCase();
  if (body.discount !== undefined) data.discount = Number(body.discount);
  if (body.minOrder !== undefined) data.minOrder = Number(body.minOrder);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  try {
    const voucher = await prisma.voucher.update({ where: { id }, data });
    return apiSuccess(voucher);
  } catch {
    return apiError("Không cập nhật được voucher", 404);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return apiError("Forbidden", 403);

  const { id } = await params;
  try {
    await prisma.voucher.delete({ where: { id } });
    return apiSuccess({ id });
  } catch {
    return apiError("Không xóa được voucher", 404);
  }
}
