import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

export type VoucherDto = {
  id: string;
  code: string;
  discount: number;
  minOrder: number;
  isActive: boolean;
};

function mapVoucher(v: {
  id: string;
  code: string;
  discount: number;
  minOrder: number;
  isActive: boolean;
}): VoucherDto {
  return {
    id: v.id,
    code: v.code,
    discount: v.discount,
    minOrder: v.minOrder,
    isActive: v.isActive,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return apiError("Forbidden", 403);

  const vouchers = await prisma.voucher.findMany({ orderBy: { code: "asc" } });
  return apiSuccess(vouchers.map(mapVoucher));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) return apiError("Forbidden", 403);

  const body = await req.json();
  const code = String(body.code || "")
    .trim()
    .toUpperCase();
  const discount = Number(body.discount);
  const minOrder = Number(body.minOrder || 0);
  const isActive = body.isActive !== false;

  if (!code || !discount || discount < 1 || discount > 100) {
    return apiError("Mã voucher hoặc % giảm không hợp lệ");
  }

  const existing = await prisma.voucher.findUnique({ where: { code } });
  if (existing) return apiError("Mã voucher đã tồn tại");

  const voucher = await prisma.voucher.create({
    data: { code, discount, minOrder, isActive },
  });
  return apiSuccess(mapVoucher(voucher), 201);
}
