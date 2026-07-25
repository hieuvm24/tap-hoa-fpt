import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole, isOwnerRole } from "@/lib/auth-server";
import { mapPromotion, apiSuccess, apiError } from "@/lib/mappers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const session = await getSession();

  const where =
    all && session && isAdminRole(session.role)
      ? {}
      : { endDate: { gte: new Date() } };

  const promotions = await prisma.promotion.findMany({
    where,
    orderBy: { endDate: "asc" },
  });
  return apiSuccess(promotions.map(mapPromotion));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) return apiError("Chỉ chủ cửa hàng", 403);

  const body = await req.json();
  const title = String(body.title || "").trim();
  const description = String(body.description || "").trim();
  const image = String(body.image || "").trim();
  const discount = Number(body.discount || 0);
  const endDate = body.endDate ? new Date(body.endDate) : null;

  if (!title || !description || !image || !endDate || Number.isNaN(endDate.getTime())) {
    return apiError("Thiếu thông tin khuyến mãi");
  }

  const promotion = await prisma.promotion.create({
    data: { title, description, image, discount, endDate },
  });
  return apiSuccess(mapPromotion(promotion), 201);
}
