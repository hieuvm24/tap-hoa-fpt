import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapReview, apiSuccess, apiError } from "@/lib/mappers";
import { syncProductRating } from "@/lib/product-rating";

/** Admin xóa đánh giá spam / không phù hợp */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return apiError("Không tìm thấy đánh giá", 404);

  const productId = review.productId;
  await prisma.review.delete({ where: { id } });
  if (productId) {
    await prisma.$transaction(async (tx) => {
      await syncProductRating(tx, productId);
    });
  }

  return apiSuccess({ message: "Đã xóa đánh giá", id });
}

/** Chi tiết 1 đánh giá */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return apiError("Không tìm thấy đánh giá", 404);
  return apiSuccess(mapReview(review));
}
