import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";
import {
  createVnpayPaymentUrl,
  extractOrderCodeFromTxnRef,
} from "@/lib/vnpay";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const orderId = body.orderId as string | undefined;
  const orderCode = body.orderCode as string | undefined;

  if (!orderId && !orderCode) return apiError("Thiếu orderId hoặc orderCode");

  const order = await prisma.order.findFirst({
    where: orderId ? { id: orderId } : { orderCode },
  });
  if (!order) return apiError("Không tìm thấy đơn hàng", 404);

  if (order.paymentStatus === "paid") {
    return apiError("Đơn hàng đã thanh toán");
  }

  if (order.paymentMethod !== "vnpay" && order.paymentMethod !== "transfer") {
    // allow creating VNPay link even if originally COD when user switches
  }

  const session = await getSession();
  if (order.userId && session && order.userId !== session.userId) {
    const isAdmin = session.role === "OWNER" || session.role === "STAFF";
    if (!isAdmin) return apiError("Forbidden", 403);
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const { paymentUrl, txnRef, demo } = createVnpayPaymentUrl({
    orderCode: order.orderCode,
    amount: order.total,
    orderInfo: `Thanh toan don hang ${order.orderCode}`,
    ipAddr: ip,
  });

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentMethod: "vnpay",
      paymentTxnRef: txnRef,
      paymentStatus: "pending",
    },
  });

  return apiSuccess({
    paymentUrl,
    txnRef,
    demo,
    orderCode: order.orderCode,
    amount: order.total,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const txnRef = searchParams.get("txnRef") || "";
  if (!txnRef) return apiError("Thiếu txnRef");
  const orderCode = extractOrderCodeFromTxnRef(txnRef);
  const order = await prisma.order.findUnique({ where: { orderCode } });
  if (!order) return apiError("Không tìm thấy đơn", 404);
  return apiSuccess({
    orderCode: order.orderCode,
    paymentStatus: order.paymentStatus,
    status: order.status,
    total: order.total,
  });
}
