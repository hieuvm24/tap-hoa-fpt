import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole, isOwnerRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";
  const session = await getSession();
  const where =
    all && session && isAdminRole(session.role) ? {} : { isPublished: true };

  const news = await prisma.news.findMany({
    where,
    orderBy: { publishedAt: "desc" },
  });
  return apiSuccess(news);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) return apiError("Chi chu cua hang", 403);

  const body = await req.json();
  const title = String(body.title || "").trim();
  const excerpt = String(body.excerpt || "").trim();
  const content = String(body.content || "").trim();
  const image = String(body.image || "").trim();
  const slug = String(body.slug || slugify(title)).trim();

  if (!title || !excerpt || !content || !image || !slug) {
    return apiError("Thiếu thông tin bài viết");
  }

  const news = await prisma.news.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      image,
      isPublished: body.isPublished !== false,
    },
  });
  return apiSuccess(news, 201);
}
