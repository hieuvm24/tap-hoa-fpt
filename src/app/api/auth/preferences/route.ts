import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

export type NotifyPrefs = {
  order: boolean;
  promo: boolean;
  news: boolean;
};

const DEFAULT_PREFS: NotifyPrefs = {
  order: true,
  promo: true,
  news: true,
};

function parsePrefs(raw: string | null | undefined): NotifyPrefs {
  try {
    const j = JSON.parse(raw || "{}") as Partial<NotifyPrefs>;
    return {
      order: j.order !== false,
      promo: j.promo !== false,
      news: j.news !== false,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

/** GET/PATCH tùy chọn thông báo khách hàng */
export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { notifyPrefs: true },
  });
  if (!user) return apiError("Không tìm thấy người dùng", 404);
  return apiSuccess({ prefs: parsePrefs(user.notifyPrefs) });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  const body = await req.json();
  const current = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { notifyPrefs: true },
  });
  if (!current) return apiError("Không tìm thấy người dùng", 404);

  const prev = parsePrefs(current.notifyPrefs);
  const next: NotifyPrefs = {
    order: typeof body.order === "boolean" ? body.order : prev.order,
    promo: typeof body.promo === "boolean" ? body.promo : prev.promo,
    news: typeof body.news === "boolean" ? body.news : prev.news,
  };

  await prisma.user.update({
    where: { id: session.userId },
    data: { notifyPrefs: JSON.stringify(next) },
  });

  return apiSuccess({ prefs: next });
}
