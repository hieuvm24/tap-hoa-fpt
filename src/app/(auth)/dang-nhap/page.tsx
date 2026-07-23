import { Suspense } from "react";
import { AuthLayout, LoginForm, RedirectIfAuthenticated } from "@/components/auth";

export const metadata = {
  title: "Đăng nhập | Tạp Hóa FPT",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Chào mừng trở lại!"
      subtitle="Đăng nhập để mua sắm và theo dõi đơn hàng"
    >
      <RedirectIfAuthenticated />
      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-200 rounded-xl" />}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
