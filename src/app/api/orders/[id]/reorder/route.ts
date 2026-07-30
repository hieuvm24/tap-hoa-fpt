import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapOrder, apiSuccess, apiError } from "@/lib/mappers";

const orderInclude = {
  items: { include: { product: true } },
  timeline: { orderBy: { createdAt: "asc" as const } },
};

/**
 * Đặt lại đơn từ đơn cũ (mua lại nhanh).
 * Chỉ tạo payload gợi ý — client đẩy vào giỏ; hoặc ?create=true để tạo đơn mới (không dùng ở đây).
 * Trả về danh sách item còn hàng để khách thêm vào giỏ.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return apiError("Không tìm thấy đơn hàng", 404);

  const isOwner = order.userId === session.userId;
  const isAdmin = isAdminRole(session.role);
  if (!isOwner && !isAdmin) return apiError("Forbidden", 403);

  const productIds = order.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      image: true,
      stock: true,
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const items = [];
  const unavailable = [];
  for (const it of order.items) {
    const p = byId.get(it.productId);
    if (!p || p.stock <= 0) {
      unavailable.push({
        productId: it.productId,
        name: it.productName,
        reason: !p ? "Ngừng bán" : "Hết hàng",
      });
      continue;
    }
    items.push({
      productId: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: p.image,
      quantity: Math.min(it.quantity, p.stock),
      maxStock: p.stock,
    });
  }

  return apiSuccess({
    orderCode: order.orderCode,
    items,
    unavailable,
  });
}
