import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";
import { normalizeVi } from "@/lib/normalize-vi";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return apiSuccess({ products: [], customers: [], orders: [] });
  }

  const isPostgres = (process.env.DATABASE_URL || "").startsWith("postgres");
  const mode = isPostgres ? ({ mode: "insensitive" as const }) : {};
  const nq = normalizeVi(q);

  const [products, customers, orders] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, ...mode } },
          { brand: { contains: q, ...mode } },
          { slug: { contains: q, ...mode } },
        ],
      },
      select: { id: true, name: true, slug: true, price: true, image: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        OR: [
          { name: { contains: q, ...mode } },
          { email: { contains: q, ...mode } },
          { phone: { contains: q, ...mode } },
        ],
      },
      select: { id: true, name: true, email: true, phone: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { orderCode: { contains: q, ...mode } },
          { customerName: { contains: q, ...mode } },
          { customerPhone: { contains: q, ...mode } },
        ],
      },
      select: {
        id: true,
        orderCode: true,
        customerName: true,
        total: true,
        status: true,
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Bo sung loc bo dau neu Postgres contains chua khop het
  const productsExtra =
    products.length >= 8
      ? []
      : (
          await prisma.product.findMany({
            where: { status: "ACTIVE" },
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              image: true,
            },
            take: 80,
          })
        ).filter(
          (p) =>
            normalizeVi(p.name).includes(nq) &&
            !products.some((x) => x.id === p.id)
        );

  return apiSuccess({
    products: [...products, ...productsExtra].slice(0, 8),
    customers,
    orders,
  });
}
