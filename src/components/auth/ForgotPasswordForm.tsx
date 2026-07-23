"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft, Copy } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { api } from "@/lib/api";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email không hợp lệ");
      return;
    }

    setIsLoading(true);
    const res = await api.authForgot.request(email.trim());
    setIsLoading(false);
    if (!res.success) {
      setError(res.error || "Không gửi được yêu cầu");
      return;
    }
    setResetUrl(res.data?.resetUrl || "");
    setIsSent(true);
  };

  if (isSent) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-card border border-gray-100 text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Yêu cầu đã được tạo</h2>
        <p className="text-sm text-gray-500 mb-4">
          Nếu email <strong className="text-gray-700">{email}</strong> tồn tại trong hệ
          thống, bạn có thể đặt lại mật khẩu bằng link bên dưới (chế độ demo — chưa gửi
          SMTP).
        </p>
        {resetUrl && (
          <div className="mb-6 rounded-lg bg-gray-50 border p-3 text-left">
            <p className="text-xs text-gray-500 mb-1">Link đặt lại (demo):</p>
            <a
              href={resetUrl}
              className="text-sm text-primary-600 break-all hover:underline"
            >
              {resetUrl}
            </a>
            <button
              type="button"
              className="mt-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary-600"
              onClick={() => navigator.clipboard.writeText(resetUrl)}
            >
              <Copy className="h-3.5 w-3.5" /> Sao chép
            </button>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {resetUrl && (
            <Link href={resetUrl.replace(/^https?:\/\/[^/]+/, "") || "/dat-lai-mat-khau"}>
              <Button>Mở trang đặt lại</Button>
            </Link>
          )}
          <Link href="/dang-nhap">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-white p-6 shadow-card border border-gray-100 space-y-4">
        <p className="text-sm text-gray-500">
          Nhập email đã đăng ký. Hệ thống sẽ tạo link đặt lại mật khẩu (demo hiển thị
          trực tiếp trên màn hình).
        </p>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-4 w-4" />}
          autoComplete="email"
        />

        <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
          Gửi link đặt lại mật khẩu
        </Button>
      </div>

      <p className="text-center text-sm text-gray-600">
        Nhớ mật khẩu?{" "}
        <Link
          href="/dang-nhap"
          className="font-semibold text-primary-600 hover:text-primary-700"
        >
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
