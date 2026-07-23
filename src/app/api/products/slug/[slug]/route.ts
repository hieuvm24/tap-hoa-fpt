import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { mapProduct, mapReview, apiSuccess, apiError } from "@/lib/mappers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product) return apiError("Không tìm thấy sản phẩm", 404);

  const reviews = await prisma.review.findMany({
    where: { productId: product.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return apiSuccess({
    product: mapProduct(product),
    reviews: reviews.map(mapReview),
  });
}
