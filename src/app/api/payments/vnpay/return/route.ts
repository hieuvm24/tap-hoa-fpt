import { NextRequest, NextResponse } from "next/server";
import { settleVnpayFromQuery } from "@/lib/vnpay-settle";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    query[key] = value;
  });

  const result = await settleVnpayFromQuery(query);

  const redirect = new URL("/thanh-toan/ket-qua", APP_URL);
  redirect.searchParams.set("orderCode", result.orderCode || "");
  redirect.searchParams.set(
    "success",
    result.success && result.valid ? "1" : "0"
  );
  redirect.searchParams.set("code", result.responseCode || "");
  return NextResponse.redirect(redirect);
}
