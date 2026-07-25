import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapCustomer, mapOrder, apiSuccess, apiError } from "@/lib/mappers";

const orderInclude = {
  items: { include: { product: true } },
  timeline: { orderBy: { createdAt: "asc" as const } },
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;
  const user = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
    },
  });
  if (!user) return apiError("Không tìm thấy khách hàng", 404);

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const customer = mapCustomer(user, {
    orderCount: activeOrders.length,
    totalSpent: activeOrders.reduce((s, o) => s + o.total, 0),
  });

  return apiSuccess({
    ...customer,
    phone: user.phone || "",
    addresses: user.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      fullName: a.fullName,
      phone: a.phone,
      address: a.address,
      isDefault: a.isDefault,
    })),
    recentOrders: orders.map(mapOrder),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  if (!name || name.length < 2) return apiError("Tên khách hàng không hợp lệ");
  if (!email || !email.includes("@")) return apiError("Email không hợp lệ");

  const existing = await prisma.user.findFirst({
    where: { id, role: "CUSTOMER" },
  });
  if (!existing) return apiError("Không tìm thấy khách hàng", 404);

  if (email !== existing.email) {
    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) return apiError("Email đã được tài khoản khác sử dụng");
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      name,
      phone: phone || null,
      email,
    },
  });

  const orders = await prisma.order.findMany({
    where: { userId: user.id, status: { not: "cancelled" } },
  });

  return apiSuccess(
    mapCustomer(user, {
      orderCount: orders.length,
      totalSpent: orders.reduce((s, o) => s + o.total, 0),
    })
  );
}
