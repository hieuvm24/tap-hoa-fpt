import crypto from "crypto";

const VNP_TMN_CODE = process.env.VNPAY_TMN_CODE || "";
const VNP_HASH_SECRET = process.env.VNPAY_HASH_SECRET || "";
const VNP_URL =
  process.env.VNPAY_URL ||
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export function isVnpayConfigured(): boolean {
  return Boolean(VNP_TMN_CODE && VNP_HASH_SECRET);
}

/** Demo unsigned payment only when explicitly enabled AND not production */
export function isVnpayDemoAllowed(): boolean {
  if (process.env.NODE_ENV === "production" && process.env.VNPAY_DEMO !== "true") {
    return false;
  }
  return process.env.VNPAY_DEMO === "true" || process.env.NODE_ENV !== "production";
}

function sortObject(obj: Record<string, string>): Record<string, string> {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, string>>((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

function buildSignData(params: Record<string, string>): string {
  return Object.entries(sortObject(params))
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
    .join("&");
}

export function createVnpayPaymentUrl(input: {
  orderCode: string;
  amount: number;
  orderInfo: string;
  ipAddr?: string;
}): { paymentUrl: string; txnRef: string; demo: boolean } {
  const txnRef = `${input.orderCode}_${Date.now()}`;
  const createDate = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);

  if (!isVnpayConfigured()) {
    if (!isVnpayDemoAllowed()) {
      throw new Error(
        "VNPay chua cau hinh. Dat VNPAY_TMN_CODE + VNPAY_HASH_SECRET, hoac VNPAY_DEMO=true cho moi truong test."
      );
    }
    const demoUrl =
      `${APP_URL}/api/payments/vnpay/return?demo=1` +
      `&vnp_TxnRef=${encodeURIComponent(txnRef)}` +
      `&vnp_Amount=${input.amount * 100}` +
      `&vnp_ResponseCode=00` +
      `&vnp_OrderInfo=${encodeURIComponent(input.orderInfo)}` +
      `&orderCode=${encodeURIComponent(input.orderCode)}`;
    return { paymentUrl: demoUrl, txnRef, demo: true };
  }

  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNP_TMN_CODE,
    vnp_Amount: String(input.amount * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: input.orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: `${APP_URL}/api/payments/vnpay/return`,
    vnp_IpAddr: input.ipAddr || "127.0.0.1",
    vnp_CreateDate: createDate,
  };

  const signData = buildSignData(params);
  const secureHash = crypto
    .createHmac("sha512", VNP_HASH_SECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  const query = Object.entries(sortObject(params))
    .map(([k, v]) => `${k}=${encodeURIComponent(v).replace(/%20/g, "+")}`)
    .join("&");

  return {
    paymentUrl: `${VNP_URL}?${query}&vnp_SecureHash=${secureHash}`,
    txnRef,
    demo: false,
  };
}

export function verifyVnpayReturn(
  query: Record<string, string>
): { valid: boolean; success: boolean; txnRef: string; responseCode: string } {
  const secureHash = query.vnp_SecureHash || "";
  const params = { ...query };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  if (!isVnpayConfigured()) {
    if (!isVnpayDemoAllowed()) {
      return {
        valid: false,
        success: false,
        txnRef: query.vnp_TxnRef || "",
        responseCode: "99",
      };
    }
    return {
      valid: true,
      success: query.vnp_ResponseCode === "00" || query.demo === "1",
      txnRef: query.vnp_TxnRef || "",
      responseCode: query.vnp_ResponseCode || "00",
    };
  }

  const signData = buildSignData(params);
  const checkHash = crypto
    .createHmac("sha512", VNP_HASH_SECRET)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");

  return {
    valid: checkHash === secureHash,
    success: query.vnp_ResponseCode === "00",
    txnRef: query.vnp_TxnRef || "",
    responseCode: query.vnp_ResponseCode || "",
  };
}

export function extractOrderCodeFromTxnRef(txnRef: string): string {
  return txnRef.split("_")[0] || txnRef;
}
