import { clearAuthCookie } from "@/lib/auth-server";
import { apiSuccess } from "@/lib/mappers";

export async function POST() {
  await clearAuthCookie();
  return apiSuccess({ message: "Đã đăng xuất" });
}
