import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  verifyVnpayReturn,
  extractOrderCodeFromTxnRef,
} from "@/lib/vnpay";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const result = verifyVnpayReturn(query);
  const orderCode =
    query.orderCode || extractOrderCodeFromTxnRef(result.txnRef);

  if (result.valid && result.success && orderCode) {
    const order = await prisma.order.findUnique({ where: { orderCode } });
    if (order && order.paymentStatus !== "paid") {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "paid",
          paymentMethod: "vnpay",
          status: order.status === "pending" ? "confirmed" : order.status,
          timeline: {
            create: [
              {
                status: order.status === "pending" ? "confirmed" : order.status,
                note: "Thanh toán VNPay thành công",
              },
            ],
          },
        },
      });
    }
  } else if (orderCode && result.valid && !result.success) {
    await prisma.order.updateMany({
      where: { orderCode, paymentStatus: "pending" },
      data: { paymentStatus: "failed" },
    });
  }

  const redirect = new URL("/thanh-toan/ket-qua", APP_URL);
  redirect.searchParams.set("orderCode", orderCode || "");
  redirect.searchParams.set("success", result.success && result.valid ? "1" : "0");
  redirect.searchParams.set("code", result.responseCode || "");
  return NextResponse.redirect(redirect);
}
