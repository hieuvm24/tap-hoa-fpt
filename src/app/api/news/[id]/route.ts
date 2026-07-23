import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const news =
    (await prisma.news.findUnique({ where: { id } })) ||
    (await prisma.news.findUnique({ where: { slug: id } }));

  if (!news) return apiError("Không tìm thấy bài viết", 404);
  if (!news.isPublished) {
    const session = await getSession();
    if (!session || !isAdminRole(session.role)) {
      return apiError("Không tìm thấy bài viết", 404);
    }
  }
  return apiSuccess(news);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return apiError("Forbidden", 403);

  const { id } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of [
    "title",
    "slug",
    "excerpt",
    "content",
    "image",
    "isPublished",
  ] as const) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  try {
    const news = await prisma.news.update({ where: { id }, data });
    return apiSuccess(news);
  } catch {
    return apiError("Không cập nhật được bài viết", 404);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return apiError("Forbidden", 403);

  const { id } = await params;
  try {
    await prisma.news.delete({ where: { id } });
    return apiSuccess({ id });
  } catch {
    return apiError("Không xóa được bài viết", 404);
  }
}
