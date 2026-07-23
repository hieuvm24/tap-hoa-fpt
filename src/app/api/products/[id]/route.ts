import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapProduct, apiSuccess, apiError } from "@/lib/mappers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!product) return apiError("Không tìm thấy sản phẩm", 404);
  return apiSuccess(mapProduct(product));
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json();

  let categoryId: string | undefined;
  if (body.categorySlug) {
    const cat = await prisma.category.findUnique({ where: { slug: body.categorySlug } });
    if (cat) categoryId = cat.id;
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.slug && { slug: body.slug }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.price !== undefined && { price: body.price }),
      ...(body.originalPrice !== undefined && { originalPrice: body.originalPrice }),
      ...(body.image && { image: body.image }),
      ...(body.images && { images: JSON.stringify(body.images) }),
      ...(body.brand && { brand: body.brand }),
      ...(body.sku && { sku: body.sku }),
      ...(body.stock !== undefined && { stock: body.stock }),
      ...(body.status && {
        status: body.status === "inactive" ? "INACTIVE" : "ACTIVE",
      }),
      ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
      ...(body.isPromotion !== undefined && { isPromotion: body.isPromotion }),
      ...(body.specs && { specs: JSON.stringify(body.specs) }),
      ...(categoryId && { categoryId }),
    },
    include: { category: true },
  });

  return apiSuccess(mapProduct(product));
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return apiSuccess({ message: "Đã xóa sản phẩm" });
}
