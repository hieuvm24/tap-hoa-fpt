import { Suspense } from "react";
import { AuthLayout, RegisterForm, RedirectIfAuthenticated } from "@/components/auth";

export const metadata = {
  title: "Đăng ký | Tạp Hóa FPT",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Tạo tài khoản mới"
      subtitle="Tham gia cùng Tạp Hóa FPT — Mua sắm tiện lợi hơn"
    >
      <RedirectIfAuthenticated />
      <Suspense fallback={<div className="h-[520px] animate-pulse bg-gray-200 rounded-xl" />}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
