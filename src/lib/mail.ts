/**
 * Gửi email quên mật khẩu.
 * Ưu tiên: Resend API → SMTP (nodemailer) → demo (không gửi).
 */

export type SendMailResult =
  | { ok: true; provider: "resend" | "smtp" }
  | { ok: false; provider: "none"; error?: string };

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildPasswordResetEmail(opts: {
  storeName: string;
  userName: string;
  resetUrl: string;
}) {
  const { storeName, userName, resetUrl } = opts;
  const subject = `[${storeName}] Đặt lại mật khẩu`;
  const text = [
    `Xin chào ${userName},`,
    "",
    `Bạn (hoặc ai đó) đã yêu cầu đặt lại mật khẩu tại ${storeName}.`,
    `Mở liên kết sau trong vòng 1 giờ để đặt mật khẩu mới:`,
    resetUrl,
    "",
    "Nếu bạn không yêu cầu, hãy bỏ qua email này.",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;background:#f8fafc;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb">
    <h1 style="font-size:18px;margin:0 0 12px;color:#16a34a">${escapeHtml(storeName)}</h1>
    <p>Xin chào <strong>${escapeHtml(userName)}</strong>,</p>
    <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn nút bên dưới trong vòng <strong>1 giờ</strong>:</p>
    <p style="text-align:center;margin:28px 0">
      <a href="${escapeHtml(resetUrl)}"
         style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600">
        Đặt lại mật khẩu
      </a>
    </p>
    <p style="font-size:13px;color:#6b7280;word-break:break-all">
      Hoặc mở link:<br/>${escapeHtml(resetUrl)}
    </p>
    <p style="font-size:13px;color:#9ca3af;margin-top:24px">
      Nếu bạn không yêu cầu, hãy bỏ qua email này.
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

async function sendViaResend(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false, provider: "none" };

  const from =
    process.env.MAIL_FROM?.trim() ||
    process.env.RESEND_FROM?.trim() ||
    "Tạp Hóa FPT <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      ok: false,
      provider: "none",
      error: `Resend ${res.status}: ${body.slice(0, 200)}`,
    };
  }
  return { ok: true, provider: "resend" };
}

async function sendViaSmtp(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendMailResult> {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return { ok: false, provider: "none" };

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const from =
    process.env.MAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    `Tạp Hóa FPT <${user}>`;

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return { ok: true, provider: "smtp" };
  } catch (e) {
    return {
      ok: false,
      provider: "none",
      error: e instanceof Error ? e.message : "SMTP error",
    };
  }
}

export function isMailConfigured(): boolean {
  if (process.env.RESEND_API_KEY?.trim()) return true;
  if (
    process.env.SMTP_HOST?.trim() &&
    process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASS?.trim()
  ) {
    return true;
  }
  return false;
}

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendMailResult> {
  if (process.env.RESEND_API_KEY?.trim()) {
    const r = await sendViaResend(opts);
    if (r.ok) return r;
    // fallback SMTP nếu Resend lỗi nhưng SMTP có cấu hình
    const smtp = await sendViaSmtp(opts);
    if (smtp.ok) return smtp;
    return r.error ? r : smtp;
  }
  return sendViaSmtp(opts);
}
