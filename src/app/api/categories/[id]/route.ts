import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isOwnerRole } from "@/lib/auth-server";
import { mapCategory, apiSuccess, apiError } from "@/lib/mappers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) return apiError("Chỉ chủ cửa hàng", 403);

  const { id } = await params;
  const body = await req.json();
  const data: { name?: string; slug?: string; icon?: string } = {};
  if (body.name) data.name = String(body.name).trim();
  if (body.slug)
    data.slug = String(body.slug).trim().toLowerCase().replace(/\s+/g, "-");
  if (body.icon) data.icon = String(body.icon).trim();

  try {
    const category = await prisma.category.update({ where: { id }, data });
    const count = await prisma.product.count({
      where: { categoryId: id, status: "ACTIVE" },
    });
    return apiSuccess(mapCategory(category, count));
  } catch {
    return apiError("Không cập nhật được danh mục", 404);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) return apiError("Chỉ chủ cửa hàng", 403);

  const { id } = await params;
  const productCount = await prisma.product.count({ where: { categoryId: id } });
  if (productCount > 0) {
    return apiError("Không thể xóa danh mục còn sản phẩm");
  }

  try {
    await prisma.category.delete({ where: { id } });
    return apiSuccess({ id });
  } catch {
    return apiError("Không xóa được danh mục", 404);
  }
}
