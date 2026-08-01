"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, User, Phone, AlertCircle, CheckCircle2, KeyRound } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/feedback";

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: "Yếu", color: "bg-red-500" };
  if (score <= 2) return { score: 2, label: "Trung bình", color: "bg-yellow-500" };
  if (score <= 3) return { score: 3, label: "Khá", color: "bg-primary-400" };
  return { score: 4, label: "Mạnh", color: "bg-primary-500" };
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, verifyEmail, resendVerification } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [step, setStep] = useState<"form" | "verify">("form");
  const [verifyEmailAddr, setVerifyEmailAddr] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [emailed, setEmailed] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const redirectTo = searchParams.get("redirect") || "/";
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Vui lòng nhập họ tên");
    if (!email.trim()) return setError("Vui lòng nhập email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setError("Email không hợp lệ");
    if (!phone.trim()) return setError("Vui lòng nhập số điện thoại");
    if (password.length < 6) return setError("Mật khẩu tối thiểu 6 ký tự");
    if (password !== confirmPassword) return setError("Mật khẩu xác nhận không khớp");
    if (!agreeTerms) return setError("Vui lòng đồng ý điều khoản sử dụng");

    setIsLoading(true);
    const result = await register({ name, email, phone, password });
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || "Đăng ký thất bại");
      return;
    }

    if (result.needsVerification) {
      setVerifyEmailAddr(result.email);
      setDemoCode(result.demoCode || "");
      setEmailed(Boolean(result.emailed));
      setInfoMsg(result.message || "");
      setStep("verify");
      toast.info(
        result.emailed
          ? "Kiểm tra hộp thư để lấy mã xác nhận"
          : "Dùng mã demo hiển thị trên màn hình"
      );
      return;
    }

    router.push(redirectTo);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) return setError("Vui lòng nhập mã xác nhận");
    setIsLoading(true);
    const result = await verifyEmail(verifyEmailAddr, code.trim());
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || "Mã không đúng");
      return;
    }
    toast.success("Email đã được xác nhận");
    router.push(redirectTo);
  };

  const handleResend = async () => {
    setError("");
    setIsLoading(true);
    const result = await resendVerification(verifyEmailAddr);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error || "Không gửi lại được");
      return;
    }
    if (result.demoCode) setDemoCode(result.demoCode);
    setEmailed(Boolean(result.emailed));
    setInfoMsg(result.message || "");
    toast.success(result.emailed ? "Đã gửi lại mã" : "Đã tạo mã mới (demo)");
  };

  if (step === "verify") {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <div className="rounded-xl bg-white p-6 shadow-card border border-gray-100 space-y-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Xác nhận email</h2>
            <p className="mt-1 text-sm text-gray-500">
              Nhập mã 6 số đã gửi tới{" "}
              <strong className="text-gray-800">{verifyEmailAddr}</strong>
            </p>
          </div>

          {infoMsg && (
            <p className="rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-800">
              {infoMsg}
            </p>
          )}

          {demoCode && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Mã demo (đồ án / chưa cấu hình mail):{" "}
              <strong className="tracking-widest">{demoCode}</strong>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <Input
            label="Mã xác nhận"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            icon={<Mail className="h-4 w-4" />}
            inputMode="numeric"
            autoComplete="one-time-code"
          />

          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
            Xác nhận & đăng nhập
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={isLoading}
            className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50"
          >
            Gửi lại mã {emailed ? "qua email" : ""}
          </button>
        </div>

        <p className="text-center text-sm text-gray-600">
          <button
            type="button"
            className="font-semibold text-primary-600"
            onClick={() => {
              setStep("form");
              setCode("");
              setError("");
            }}
          >
            ← Quay lại đăng ký
          </button>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-white p-6 shadow-card border border-gray-100 space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <Input
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<User className="h-4 w-4" />}
          autoComplete="name"
        />

        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="h-4 w-4" />}
          autoComplete="email"
        />

        <Input
          label="Số điện thoại"
          type="tel"
          placeholder="0901234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          icon={<Phone className="h-4 w-4" />}
          autoComplete="tel"
        />

        <div>
          <PasswordInput
            label="Mật khẩu"
            placeholder="Tối thiểu 6 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          {password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i <= strength.score ? strength.color : "bg-gray-200"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500">Độ mạnh: {strength.label}</p>
            </div>
          )}
        </div>

        <PasswordInput
          label="Xác nhận mật khẩu"
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          error={
            confirmPassword && password !== confirmPassword
              ? "Mật khẩu không khớp"
              : undefined
          }
        />

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-600">
            Tôi đồng ý với{" "}
            <Link href="/chinh-sach/dieu-khoan" className="text-primary-600 hover:underline">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link href="/chinh-sach/bao-mat" className="text-primary-600 hover:underline">
              Chính sách bảo mật
            </Link>
          </span>
        </label>

        <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
          Tạo tài khoản
        </Button>
      </div>

      <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-emerald-700">
            Sau khi đăng ký, bạn sẽ nhận <strong>mã xác nhận qua email</strong>. Dùng
            mã <strong>TAPHOA10</strong> giảm 10% cho đơn từ 100.000đ!
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-gray-50 px-3 text-gray-400">hoặc đăng ký nhanh</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href="/api/auth/oauth/google"
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </a>
        <a
          href="/api/auth/oauth/facebook"
          className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg className="h-4 w-4 fill-[#1877F2]" viewBox="0 0 24 24" aria-hidden>
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </a>
      </div>

      <p className="text-center text-sm text-gray-600">
        Đã có tài khoản?{" "}
        <Link
          href={redirectTo !== "/" ? `/dang-nhap?redirect=${redirectTo}` : "/dang-nhap"}
          className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
