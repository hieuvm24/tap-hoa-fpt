import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/mappers";

export async function POST(req: NextRequest) {
  const { code, subtotal } = await req.json();

  if (!code) return apiError("Vui lòng nhập mã voucher");

  const voucher = await prisma.voucher.findFirst({
    where: { code: code.toUpperCase(), isActive: true },
  });

  if (!voucher) return apiError("Mã voucher không hợp lệ", 404);
  if (subtotal < voucher.minOrder) {
    return apiError(`Đơn hàng tối thiểu ${voucher.minOrder.toLocaleString("vi-VN")}đ`);
  }

  const discount = Math.round(subtotal * (voucher.discount / 100));
  return apiSuccess({ code: voucher.code, discount, percent: voucher.discount });
}
