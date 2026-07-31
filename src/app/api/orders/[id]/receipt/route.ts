import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { DEFAULT_STORE } from "@/config/defaults";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatVnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function digits(phone: string) {
  return phone.replace(/\D/g, "");
}

/**
 * Hóa đơn HTML in được (POS / khách / admin).
 * Auth: chủ đơn | admin | mã đơn + SĐT khớp.
 * Query: ?print=1 tự mở hộp thoại in.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const autoPrint = searchParams.get("print") === "1";
  const phoneQ = digits(searchParams.get("phone") || "");
  const codeQ = (searchParams.get("code") || "").trim().toUpperCase();

  const session = await getSession();
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      timeline: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) {
    return new Response("Không tìm thấy đơn hàng", { status: 404 });
  }

  const isAdmin = session && isAdminRole(session.role);
  const isOwner = session?.userId && session.userId === order.userId;
  const phoneOk =
    phoneQ.length >= 9 && digits(order.customerPhone) === phoneQ;
  const codeOk = !codeQ || codeQ === order.orderCode.toUpperCase();

  if (!isAdmin && !isOwner && !(phoneOk && codeOk)) {
    return new Response("Không có quyền xem hóa đơn", { status: 403 });
  }

  const store =
    (await prisma.storeSetting.findUnique({ where: { id: "default" } })) ||
    DEFAULT_STORE;

  const payMethod =
    order.paymentMethod === "vnpay"
      ? "VNPay"
      : order.paymentMethod === "transfer"
        ? "Chuyển khoản"
        : "Tiền mặt / COD";
  const payStatus =
    order.paymentStatus === "paid"
      ? "Đã thanh toán"
      : order.paymentStatus === "refunded"
        ? "Đã hoàn tiền"
        : order.paymentStatus === "failed"
          ? "Thất bại"
          : "Chưa thanh toán";
  const fulfill =
    order.fulfillmentType === "pickup" ? "Nhận tại quầy" : "Giao tận nơi";

  const rows = order.items
    .map(
      (it, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${esc(it.productName)}</td>
      <td class="num">${it.quantity}</td>
      <td class="num">${formatVnd(it.price)}</td>
      <td class="num">${formatVnd(it.price * it.quantity)}</td>
    </tr>`
    )
    .join("");

  const created = new Date(order.createdAt).toLocaleString("vi-VN");

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8"/>
  <title>Hóa đơn ${esc(order.orderCode)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, Segoe UI, sans-serif; color: #111; margin: 0; padding: 24px; background: #f3f4f6; }
    .sheet { max-width: 720px; margin: 0 auto; background: #fff; padding: 28px 32px; border-radius: 12px; border: 1px solid #e5e7eb; }
    h1 { font-size: 20px; margin: 0 0 4px; color: #16a34a; }
    .muted { color: #6b7280; font-size: 13px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin: 20px 0; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 6px; text-align: left; }
    th { background: #f9fafb; font-weight: 600; }
    .num { text-align: right; white-space: nowrap; }
    .totals { margin-top: 16px; font-size: 14px; }
    .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
    .totals .grand { font-size: 18px; font-weight: 700; color: #16a34a; border-top: 2px solid #111; margin-top: 8px; padding-top: 10px; }
    .actions { margin: 16px auto; max-width: 720px; display: flex; gap: 8px; justify-content: center; }
    button { background: #16a34a; color: #fff; border: 0; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
    button.secondary { background: #fff; color: #111; border: 1px solid #d1d5db; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { border: 0; border-radius: 0; max-width: none; }
      .actions { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button onclick="window.print()">In hóa đơn</button>
    <button class="secondary" onclick="window.close()">Đóng</button>
  </div>
  <div class="sheet">
    <h1>${esc(store.name || DEFAULT_STORE.name)}</h1>
    <p class="muted">${esc(store.address || "")}<br/>
      ĐT: ${esc(store.phone || "")} · ${esc(store.email || "")}</p>
    <h2 style="margin:18px 0 0;font-size:16px">HÓA ĐƠN BÁN HÀNG</h2>
    <p class="muted">Mã đơn: <strong>${esc(order.orderCode)}</strong> · ${esc(created)}</p>
    <div class="meta">
      <div><strong>Khách hàng</strong><br/>${esc(order.customerName)}<br/>${esc(order.customerPhone)}</div>
      <div><strong>Hình thức</strong><br/>${fulfill}<br/>${payMethod} — ${payStatus}</div>
      <div style="grid-column:1/-1"><strong>Địa chỉ / ghi chú</strong><br/>${esc(order.address)}${order.note ? `<br/>${esc(order.note)}` : ""}</div>
    </div>
    <table>
      <thead>
        <tr><th>#</th><th>Sản phẩm</th><th class="num">SL</th><th class="num">Đơn giá</th><th class="num">Thành tiền</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div><span>Tạm tính</span><span>${formatVnd(order.subtotal)}</span></div>
      <div><span>Phí ship</span><span>${formatVnd(order.shippingFee)}</span></div>
      <div><span>Giảm giá${order.voucherCode ? ` (${esc(order.voucherCode)})` : ""}</span><span>-${formatVnd(order.discount)}</span></div>
      <div class="grand"><span>Tổng cộng</span><span>${formatVnd(order.total)}</span></div>
    </div>
    <p class="muted" style="margin-top:28px;text-align:center">Cảm ơn quý khách! — ${esc(store.slogan || "")}</p>
  </div>
  ${autoPrint ? "<script>window.addEventListener('load',()=>setTimeout(()=>window.print(),300));</script>" : ""}
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
