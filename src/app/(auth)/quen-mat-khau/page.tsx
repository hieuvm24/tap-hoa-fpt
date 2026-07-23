import { AuthLayout, ForgotPasswordForm } from "@/components/auth";

export const metadata = {
  title: "Quên mật khẩu | Tạp Hóa FPT",
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Quên mật khẩu?"
      subtitle="Đừng lo, chúng tôi sẽ giúp bạn lấy lại tài khoản"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
