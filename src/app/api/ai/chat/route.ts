import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { mapProduct, mapPromotion, apiSuccess, apiError } from "@/lib/mappers";
import { generateAiReply } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = String(body.message || "").trim();
  if (!message) return apiError("Thiếu nội dung tin nhắn");

  const history = Array.isArray(body.history)
    ? body.history
        .filter(
          (h: { role?: string; content?: string }) =>
            (h.role === "user" || h.role === "assistant") && h.content
        )
        .map((h: { role: "user" | "assistant"; content: string }) => ({
          role: h.role,
          content: String(h.content),
        }))
    : [];

  const [store, products, promotions, categories, counts] = await Promise.all([
    prisma.storeSetting.findUnique({ where: { id: "default" } }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      take: 150,
      orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
    }),
    prisma.promotion.findMany({
      where: { endDate: { gte: new Date() } },
      take: 5,
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.groupBy({
      by: ["categoryId"],
      _count: { id: true },
      where: { status: "ACTIVE" },
    }),
  ]);

  if (!store) return apiError("Chưa cấu hình cửa hàng", 404);

  const countMap = Object.fromEntries(
    counts.map((c) => [c.categoryId, c._count.id])
  );

  const result = await generateAiReply({
    message,
    history,
    context: {
      store: {
        name: store.name,
        phone: store.phone,
        zalo: store.zalo,
        facebook: store.facebook,
        email: store.email,
        address: store.address,
        openHours: store.openHours,
        description: store.description,
      },
      products: products.map(mapProduct),
      categories: categories.map((c) => ({
        name: c.name,
        slug: c.slug,
        count: countMap[c.id] || 0,
      })),
      promotions: promotions.map(mapPromotion),
    },
  });

  return apiSuccess(result);
}
