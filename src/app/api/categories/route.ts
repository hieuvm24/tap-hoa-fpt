import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapCategory, apiSuccess, apiError } from "@/lib/mappers";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  const counts = await prisma.product.groupBy({
    by: ["categoryId"],
    _count: { id: true },
    where: { status: "ACTIVE" },
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.categoryId, c._count.id]));

  return apiSuccess(
    categories.map((c) => mapCategory(c, countMap[c.id] || 0))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  const name = String(body.name || "").trim();
  const slug = String(body.slug || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  const icon = String(body.icon || "Package").trim();

  if (!name || !slug) return apiError("Thiếu tên hoặc slug");

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return apiError("Slug đã tồn tại");

  const category = await prisma.category.create({
    data: { name, slug, icon },
  });
  return apiSuccess(mapCategory(category, 0), 201);
}
