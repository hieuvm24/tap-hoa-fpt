import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole, isOwnerRole } from "@/lib/auth-server";
import { mapProduct, apiSuccess, apiError } from "@/lib/mappers";
import { slugifyVi } from "@/lib/normalize-vi";

/** Nhân bản sản phẩm — tạo SKU/slug mới để bán biến thể */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;
  const src = await prisma.product.findUnique({ where: { id } });
  if (!src) return apiError("Không tìm thấy sản phẩm", 404);

  const baseSlug = slugifyVi(src.name) || src.slug;
  const stamp = Date.now().toString(36).slice(-5);
  let slug = `${baseSlug}-copy-${stamp}`;
  let sku = `${src.sku}-C${stamp}`.slice(0, 40);

  // Đảm bảo unique
  for (let i = 0; i < 5; i++) {
    const clash = await prisma.product.findFirst({
      where: { OR: [{ slug }, { sku }] },
      select: { id: true },
    });
    if (!clash) break;
    const n = i + 2;
    slug = `${baseSlug}-copy-${stamp}${n}`;
    sku = `${src.sku}-C${stamp}${n}`.slice(0, 40);
  }

  const product = await prisma.product.create({
    data: {
      name: `${src.name} (bản sao)`,
      slug,
      description: src.description,
      price: src.price,
      originalPrice: src.originalPrice,
      image: src.image,
      images: src.images,
      brand: src.brand,
      sku,
      stock: 0,
      status: isOwnerRole(session.role) ? src.status : "INACTIVE",
      isFeatured: false,
      isPromotion: src.isPromotion,
      specs: src.specs,
      categoryId: src.categoryId,
    },
    include: { category: true },
  });

  return apiSuccess(mapProduct(product), 201);
}
