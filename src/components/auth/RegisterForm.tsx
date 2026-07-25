"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, User, Phone, AlertCircle, CheckCircle2 } from "lucide-react";
import { Input, Button } from "@/components/ui";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
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
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/";
  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Vui lòng nhập họ tên");
    if (!email.trim()) return setError("Vui lòng nhập email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Email không hợp lệ");
    if (!phone.trim()) return setError("Vui lòng nhập số điện thoại");
    if (password.length < 6) return setError("Mật khẩu tối thiểu 6 ký tự");
    if (password !== confirmPassword) return setError("Mật khẩu xác nhận không khớp");
    if (!agreeTerms) return setError("Vui lòng đồng ý điều khoản sử dụng");

    setIsLoading(true);
    const result = await register({ name, email, phone, password });
    setIsLoading(false);

    if (result.success) {
      router.push(redirectTo);
    } else {
      setError(result.error || "Đăng ký thất bại");
    }
  };

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
            <Link href="#" className="text-primary-600 hover:underline">
              Điều khoản sử dụng
            </Link>{" "}
            và{" "}
            <Link href="#" className="text-primary-600 hover:underline">
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
            Đăng ký miễn phí — Dùng mã <strong>TAPHOA10</strong> giảm 10% cho đơn từ 100.000đ!
          </p>
        </div>
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
