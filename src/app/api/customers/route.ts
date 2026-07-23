import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapCustomer, apiSuccess, apiError } from "@/lib/mappers";

export async function GET() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    orderBy: { createdAt: "desc" },
  });

  const customers = await Promise.all(
    users.map(async (u) => {
      const orders = await prisma.order.findMany({
        where: { userId: u.id, status: { not: "cancelled" } },
      });
      return mapCustomer(u, {
        orderCount: orders.length,
        totalSpent: orders.reduce((s, o) => s + o.total, 0),
      });
    })
  );

  return apiSuccess(customers);
}
