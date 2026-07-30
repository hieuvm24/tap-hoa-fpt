import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiError } from "@/lib/mappers";

function csvEscape(v: string | number | null | undefined) {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Xuất CSV đơn hàng — chủ/NV tải về để đối soát */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (fromParam || toParam) {
    where.createdAt = {
      ...(fromParam && { gte: startOfDay(new Date(fromParam)) }),
      ...(toParam && { lte: endOfDay(new Date(toParam)) }),
    };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 2000,
    include: {
      items: { select: { quantity: true } },
    },
  });

  const header = [
    "MaDon",
    "NgayDat",
    "KhachHang",
    "SDT",
    "Email",
    "TrangThai",
    "ThanhToan",
    "TrangThaiTT",
    "Kenh",
    "SoSP",
    "TamTinh",
    "Ship",
    "GiamGia",
    "Tong",
    "DiaChi",
  ].join(",");

  const rows = orders.map((o) =>
    [
      o.orderCode,
      o.createdAt.toISOString(),
      o.customerName,
      o.customerPhone,
      o.customerEmail || "",
      o.status,
      o.paymentMethod,
      o.paymentStatus,
      o.fulfillmentType,
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.subtotal,
      o.shippingFee,
      o.discount,
      o.total,
      o.address,
    ]
      .map(csvEscape)
      .join(",")
  );

  const bom = "\uFEFF";
  const csv = bom + [header, ...rows].join("\n");
  const filename = `don-hang-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
