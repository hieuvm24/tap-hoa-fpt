import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isOwnerRole } from "@/lib/auth-server";
import { mapPromotion, apiSuccess, apiError } from "@/lib/mappers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) return apiError("Chỉ chủ cửa hàng", 403);

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.description !== undefined)
    data.description = String(body.description).trim();
  if (body.image !== undefined) data.image = String(body.image).trim();
  if (body.discount !== undefined) data.discount = Number(body.discount);
  if (body.endDate !== undefined) data.endDate = new Date(body.endDate);

  try {
    const promotion = await prisma.promotion.update({ where: { id }, data });
    return apiSuccess(mapPromotion(promotion));
  } catch {
    return apiError("Không cập nhật được khuyến mãi", 404);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) return apiError("Chỉ chủ cửa hàng", 403);

  const { id } = await params;
  try {
    await prisma.promotion.delete({ where: { id } });
    return apiSuccess({ id });
  } catch {
    return apiError("Không xóa được khuyến mãi", 404);
  }
}
