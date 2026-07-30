import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

/**
 * Tra cứu khách nhanh theo SĐT (POS bán tại quầy).
 * GET /api/customers/lookup?phone=09...
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const phone = (req.nextUrl.searchParams.get("phone") || "").replace(/\D/g, "");
  if (phone.length < 9) {
    return apiSuccess({ customer: null });
  }

  const tail = phone.slice(-9);
  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER", phone: { not: null } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
    },
    take: 400,
  });

  const customer = users.find((u) =>
    (u.phone || "").replace(/\D/g, "").endsWith(tail)
  );

  if (!customer) return apiSuccess({ customer: null });

  return apiSuccess({
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone || undefined,
      avatar: customer.avatar || undefined,
    },
  });
}
