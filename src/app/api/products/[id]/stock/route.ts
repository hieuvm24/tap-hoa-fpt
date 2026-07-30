import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapProduct, apiSuccess, apiError } from "@/lib/mappers";

/**
 * Điều chỉnh tồn kho nhanh (nhập hàng / kiểm kê).
 * Body: { quantity?: number, delta?: number, reason?: string }
 * - quantity: set tuyệt đối
 * - delta: cộng/trừ (vd +20 nhập hàng, -2 hao hụt)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) return apiError("Không tìm thấy sản phẩm", 404);

  let nextStock: number;
  if (typeof body.quantity === "number" && Number.isFinite(body.quantity)) {
    nextStock = Math.max(0, Math.floor(body.quantity));
  } else if (typeof body.delta === "number" && Number.isFinite(body.delta)) {
    nextStock = Math.max(0, existing.stock + Math.floor(body.delta));
  } else {
    return apiError("Cần truyền quantity hoặc delta (số nguyên)");
  }

  const product = await prisma.product.update({
    where: { id },
    data: { stock: nextStock },
    include: { category: true },
  });

  return apiSuccess({
    product: mapProduct(product),
    previousStock: existing.stock,
    stock: nextStock,
    delta: nextStock - existing.stock,
    reason: reason || undefined,
  });
}
