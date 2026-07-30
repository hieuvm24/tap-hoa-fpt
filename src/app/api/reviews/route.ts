import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapReview, apiSuccess, apiError } from "@/lib/mappers";
import { syncProductRating } from "@/lib/product-rating";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const all = searchParams.get("all") === "true";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);

  if (all) {
    if (!session || !isAdminRole(session.role)) {
      return apiError("Forbidden", 403);
    }
    const where = productId ? { productId } : {};
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: { select: { id: true, name: true, slug: true } },
        },
      }),
      prisma.review.count({ where }),
    ]);
    return apiSuccess({
      reviews: reviews.map((r) => ({
        ...mapReview(r),
        productName: r.product?.name,
        productSlug: r.product?.slug,
      })),
      total,
      page,
      limit,
    });
  }

  const reviews = await prisma.review.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return apiSuccess(reviews.map(mapReview));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Vui lòng đăng nhập để đánh giá", 401);

  const body = await req.json();
  const productId = body.productId as string;
  const rating = Number(body.rating);
  const comment = String(body.comment || "").trim();

  if (!productId || !rating || rating < 1 || rating > 5) {
    return apiError("Thiếu thông tin đánh giá hợp lệ");
  }
  if (comment.length < 5) return apiError("Nội dung đánh giá quá ngắn");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return apiError("Sản phẩm không tồn tại", 404);

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return apiError("Người dùng không tồn tại", 404);

  // Chỉ đánh giá khi đã mua và đơn đã hoàn thành
  const purchased = await prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId: session.userId,
        status: "delivered",
      },
    },
  });
  if (!purchased) {
    return apiError(
      "Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng thành công"
    );
  }

  const existing = await prisma.review.findFirst({
    where: { productId, userId: user.id },
  });
  if (existing) {
    return apiError("Bạn đã đánh giá sản phẩm này rồi");
  }

  try {
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          productId,
          userId: user.id,
          customerName: user.name,
          avatar: user.avatar,
          rating,
          comment,
        },
      });

      await syncProductRating(tx, productId);
      return created;
    });

    return apiSuccess(mapReview(review), 201);
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code: string }).code)
        : "";
    if (code === "P2002") {
      return apiError("Bạn đã đánh giá sản phẩm này rồi");
    }
    throw e;
  }
}
