"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, AlertCircle, Info } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const DEMO_ACCOUNTS = [
  { label: "Khách hàng", email: "khach@demo.com", password: "123456" },
  { label: "Chủ cửa hàng", email: "chu@demo.com", password: "123456" },
  { label: "Nhân viên", email: "nhanvien@demo.com", password: "123456" },
];

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const redirectTo = searchParams.get("redirect") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return;
    }
    if (!password) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    setIsLoading(true);
    const result = await login({ email, password, remember });
    setIsLoading(false);

    if (result.success) {
      router.push(redirectTo || result.redirect || "/");
    } else {
      setError(result.error || "Đăng nhập thất bại");
    }
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-white p-6 shadow-card border border-gray-100 space-y-4">
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

          <PasswordInput
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-600">Ghi nhớ đăng nhập</span>
            </label>
            <Link
              href="/quen-mat-khau"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            Đăng nhập
          </Button>
        </div>
      </form>

      {/* Social login placeholder */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-gray-50 px-3 text-gray-400">hoặc</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          onClick={() => alert("Tích hợp Google sẽ có ở phiên bản sau")}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          onClick={() => alert("Tích hợp Facebook sẽ có ở phiên bản sau")}
        >
          <svg className="h-4 w-4 fill-[#1877F2]" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </button>
      </div>

      {/* Demo accounts */}
      <div className="rounded-xl border border-primary-100 bg-primary-50/50 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDemo(!showDemo)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Tài khoản demo (đồ án)
          </span>
          <span className={cn("transition-transform", showDemo && "rotate-180")}>▼</span>
        </button>
        {showDemo && (
          <div className="border-t border-primary-100 px-4 py-3 space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillDemo(acc.email, acc.password)}
                className="flex w-full items-center justify-between rounded-lg bg-white px-3 py-2 text-left text-sm hover:shadow-sm transition-shadow"
              >
                <span className="font-medium text-gray-700">{acc.label}</span>
                <span className="text-xs text-gray-400">{acc.email}</span>
              </button>
            ))}
            <p className="text-xs text-primary-600 pt-1">Mật khẩu: 123456</p>
          </div>
        )}
      </div>

      <p className="text-center text-sm text-gray-600">
        Chưa có tài khoản?{" "}
        <Link
          href={redirectTo ? `/dang-ky?redirect=${redirectTo}` : "/dang-ky"}
          className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
