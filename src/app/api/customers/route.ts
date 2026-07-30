import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapCustomer, apiSuccess, apiError } from "@/lib/mappers";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 50), 1), 100);
  const paginate = searchParams.get("paginate") === "true" || !!searchParams.get("page");

  const isPostgres = (process.env.DATABASE_URL || "").startsWith("postgres");
  const mode = isPostgres ? ({ mode: "insensitive" as const }) : {};

  const where: Record<string, unknown> = { role: "CUSTOMER" };
  if (search) {
    where.OR = [
      { name: { contains: search, ...mode } },
      { email: { contains: search, ...mode } },
      { phone: { contains: search, ...mode } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      ...(paginate
        ? { skip: (page - 1) * limit, take: limit }
        : { take: 500 }),
    }),
    prisma.user.count({ where }),
  ]);

  const customers = await Promise.all(
    users.map(async (u) => {
      const orders = await prisma.order.findMany({
        where: { userId: u.id, status: { not: "cancelled" } },
        select: { total: true },
      });
      return mapCustomer(u, {
        orderCount: orders.length,
        totalSpent: orders.reduce((s, o) => s + o.total, 0),
      });
    })
  );

  if (paginate) {
    return apiSuccess({
      customers,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  }

  return apiSuccess(customers);
}
