import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-server";
import { mapProduct, apiSuccess, apiError } from "@/lib/mappers";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.userId },
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess(
    items.map((i) => ({
      id: i.id,
      productId: i.productId,
      createdAt: i.createdAt.toISOString(),
      product: mapProduct(i.product),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { productId } = await req.json();
  if (!productId) return apiError("Thiếu productId");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return apiError("Sản phẩm không tồn tại", 404);

  const item = await prisma.wishlistItem.upsert({
    where: {
      userId_productId: { userId: session.userId, productId },
    },
    update: {},
    create: { userId: session.userId, productId },
    include: { product: { include: { category: true } } },
  });

  return apiSuccess(
    {
      id: item.id,
      productId: item.productId,
      product: mapProduct(item.product),
    },
    201
  );
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  if (!productId) return apiError("Thiếu productId");

  await prisma.wishlistItem.deleteMany({
    where: { userId: session.userId, productId },
  });

  return apiSuccess({ removed: true });
}
