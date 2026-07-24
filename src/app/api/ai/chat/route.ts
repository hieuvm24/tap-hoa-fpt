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

  const [store, products, promotions] = await Promise.all([
    prisma.storeSetting.findUnique({ where: { id: "default" } }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { category: true },
      take: 120,
      orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
    }),
    prisma.promotion.findMany({
      where: { endDate: { gte: new Date() } },
      take: 5,
    }),
  ]);

  if (!store) return apiError("Chưa cấu hình cửa hàng", 404);

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
      },
      products: products.map(mapProduct),
      promotions: promotions.map(mapPromotion),
    },
  });

  return apiSuccess(result);
}
