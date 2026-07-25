import { prisma } from "@/lib/db";
import {
  extractOrderCodeFromTxnRef,
  verifyVnpayReturn,
} from "@/lib/vnpay";

export type VnpaySettleResult = {
  valid: boolean;
  success: boolean;
  orderCode: string;
  responseCode: string;
  settled: boolean;
};

function txnRefKnown(stored: string | null | undefined, txnRef: string): boolean {
  if (!txnRef) return false;
  if (!stored) return true; // don cu chua gan ref
  return stored.split(",").map((s) => s.trim()).includes(txnRef);
}

/** Xac nhan thanh toan VNPay (dung chung return URL + IPN). */
export async function settleVnpayFromQuery(
  query: Record<string, string>
): Promise<VnpaySettleResult> {
  const result = verifyVnpayReturn(query);
  const orderCode =
    query.orderCode || extractOrderCodeFromTxnRef(result.txnRef);

  const base = {
    valid: result.valid,
    success: result.success,
    orderCode: orderCode || "",
    responseCode: result.responseCode || "",
    settled: false,
  };

  if (!orderCode) return base;

  if (result.valid && result.success) {
    const order = await prisma.order.findUnique({ where: { orderCode } });
    if (!order || order.paymentStatus === "paid") {
      return { ...base, settled: order?.paymentStatus === "paid" };
    }
    if (order.status === "cancelled") return base;

    // Chap nhan moi txnRef thuoc don (tranh mat tien khi tao nhieu link)
    const txnOk = txnRefKnown(order.paymentTxnRef, result.txnRef);
    const amountRaw = query.vnp_Amount;
    const amountOk =
      !amountRaw || Number(amountRaw) === order.total * 100;

    if (!txnOk || !amountOk) return base;

    const locked = await prisma.order.updateMany({
      where: {
        id: order.id,
        paymentStatus: { not: "paid" },
        status: { not: "cancelled" },
      },
      data: {
        paymentStatus: "paid",
        paymentMethod: "vnpay",
        status: order.status === "pending" ? "confirmed" : order.status,
      },
    });

    if (locked.count > 0) {
      await prisma.orderTimeline.create({
        data: {
          orderId: order.id,
          status: order.status === "pending" ? "confirmed" : order.status,
          note: "Thanh toan VNPay thanh cong",
        },
      });
      return { ...base, settled: true };
    }
    return { ...base, settled: true };
  }

  if (result.valid && !result.success) {
    await prisma.order.updateMany({
      where: { orderCode, paymentStatus: "pending" },
      data: { paymentStatus: "failed" },
    });
  }

  return base;
}
