import { NextRequest, NextResponse } from "next/server";
import { settleVnpayFromQuery } from "@/lib/vnpay-settle";

/**
 * VNPay IPN (server-to-server). Cau hinh URL nay tren merchant portal:
 * {APP_URL}/api/payments/vnpay/ipn
 * Tra ve RspCode theo tai lieu VNPay.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });

  try {
    const result = await settleVnpayFromQuery(query);

    if (!result.valid) {
      return NextResponse.json({ RspCode: "97", Message: "Invalid signature" });
    }
    if (!result.orderCode) {
      return NextResponse.json({ RspCode: "01", Message: "Order not found" });
    }
    if (!result.success) {
      return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
    }
    // Da paid / vua settle: bao VNPay thanh cong de khong retry vo han
    return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
  } catch {
    return NextResponse.json({ RspCode: "99", Message: "Unknown error" });
  }
}
