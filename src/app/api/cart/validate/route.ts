import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/mappers";

/**
 * Đồng bộ giỏ hàng với giá / tồn kho mới nhất trước thanh toán.
 * Body: { items: { productId: string, quantity: number }[] }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];
  if (items.length === 0) {
    return apiSuccess({ items: [], warnings: [], ok: true });
  }
  if (items.length > 50) return apiError("Giỏ hàng quá nhiều sản phẩm");

  const ids = items
    .map((i: { productId?: string }) => String(i.productId || ""))
    .filter(Boolean);

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      image: true,
      stock: true,
      status: true,
      category: { select: { slug: true } },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const result = [];
  const warnings: string[] = [];
  let ok = true;

  for (const raw of items as { productId: string; quantity: number }[]) {
    const qty = Math.max(0, Math.floor(Number(raw.quantity) || 0));
    const p = byId.get(raw.productId);
    if (!p || p.status !== "ACTIVE") {
      ok = false;
      warnings.push(
        `${p?.name || "Sản phẩm"} đã ngừng bán — vui lòng xóa khỏi giỏ`
      );
      result.push({
        productId: raw.productId,
        available: false,
        quantity: 0,
        stock: 0,
        price: 0,
        name: p?.name,
        slug: p?.slug,
        image: p?.image,
        categorySlug: p?.category.slug,
        removed: true,
      });
      continue;
    }

    let nextQty = qty;
    if (p.stock <= 0) {
      ok = false;
      warnings.push(`${p.name} đã hết hàng`);
      nextQty = 0;
    } else if (qty > p.stock) {
      ok = false;
      warnings.push(`${p.name} chỉ còn ${p.stock} — đã chỉnh số lượng`);
      nextQty = p.stock;
    }

    result.push({
      productId: p.id,
      available: p.stock > 0,
      quantity: nextQty,
      stock: p.stock,
      price: p.price,
      name: p.name,
      slug: p.slug,
      image: p.image,
      categorySlug: p.category.slug,
      removed: nextQty <= 0,
    });
  }

  return apiSuccess({ items: result, warnings, ok });
}
