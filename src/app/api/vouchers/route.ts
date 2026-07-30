import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isOwnerRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

export type VoucherDto = {
  id: string;
  code: string;
  discount: number;
  minOrder: number;
  isActive: boolean;
  usageCount?: number;
  revenueImpact?: number;
};

function mapVoucher(
  v: {
    id: string;
    code: string;
    discount: number;
    minOrder: number;
    isActive: boolean;
  },
  extra?: { usageCount?: number; revenueImpact?: number }
): VoucherDto {
  return {
    id: v.id,
    code: v.code,
    discount: v.discount,
    minOrder: v.minOrder,
    isActive: v.isActive,
    ...(extra?.usageCount !== undefined && { usageCount: extra.usageCount }),
    ...(extra?.revenueImpact !== undefined && {
      revenueImpact: extra.revenueImpact,
    }),
  };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const publicActive = searchParams.get("active") === "true";

  // Public: active vouchers only. Admin: full list.
  if (publicActive) {
    const vouchers = await prisma.voucher.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });
    return apiSuccess(vouchers.map((v) => mapVoucher(v)));
  }

  if (!session || !isOwnerRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const vouchers = await prisma.voucher.findMany({ orderBy: { code: "asc" } });
  const codes = vouchers.map((v) => v.code);
  const usedOrders =
    codes.length === 0
      ? []
      : await prisma.order.findMany({
          where: {
            voucherCode: { in: codes },
            status: { not: "cancelled" },
          },
          select: { voucherCode: true, discount: true, total: true },
        });

  const usage = new Map<string, { count: number; impact: number }>();
  for (const o of usedOrders) {
    const code = (o.voucherCode || "").toUpperCase();
    if (!code) continue;
    const prev = usage.get(code) || { count: 0, impact: 0 };
    prev.count += 1;
    prev.impact += o.discount;
    usage.set(code, prev);
  }

  return apiSuccess(
    vouchers.map((v) => {
      const u = usage.get(v.code.toUpperCase());
      return mapVoucher(v, {
        usageCount: u?.count || 0,
        revenueImpact: u?.impact || 0,
      });
    })
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isOwnerRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const body = await req.json();
  const code = String(body.code || "")
    .trim()
    .toUpperCase();
  const discount = Number(body.discount);
  const minOrder = Number(body.minOrder || 0);
  const isActive = body.isActive !== false;

  if (!code || !discount || discount < 1 || discount > 100) {
    return apiError("Ma voucher hoac % giam khong hop le");
  }

  const existing = await prisma.voucher.findUnique({ where: { code } });
  if (existing) return apiError("Ma voucher da ton tai");

  const voucher = await prisma.voucher.create({
    data: { code, discount, minOrder, isActive },
  });
  return apiSuccess(mapVoucher(voucher), 201);
}
