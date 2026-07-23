"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AuthLayout } from "@/components/auth";
import { api } from "@/lib/api";

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!token) {
      setError("Link không hợp lệ");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải từ 6 ký tự");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    const res = await api.authForgot.reset(token, password);
    setLoading(false);
    if (res.success) {
      setDone(true);
      setTimeout(() => router.push("/dang-nhap"), 2000);
    } else {
      setError(res.error || "Không đặt lại được mật khẩu");
    }
  };

  if (done) {
    return (
      <div className="rounded-xl bg-white p-8 shadow-card border text-center">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold mb-2">Đặt lại mật khẩu thành công</h2>
        <p className="text-sm text-gray-500">Đang chuyển tới trang đăng nhập...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-white p-6 shadow-card border space-y-4">
        {!token && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4" />
            Thiếu token. Vui lòng dùng link từ email / quên mật khẩu.
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        <PasswordInput
          label="Mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordInput
          label="Xác nhận mật khẩu"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={loading}>
          Đặt lại mật khẩu
        </Button>
      </div>
      <p className="text-center text-sm">
        <Link href="/dang-nhap" className="text-primary-600 font-medium">
          Quay lại đăng nhập
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Nhập mật khẩu mới cho tài khoản của bạn"
    >
      <Suspense fallback={<div className="p-8 text-center">Đang tải...</div>}>
        <ResetForm />
      </Suspense>
    </AuthLayout>
  );
}
