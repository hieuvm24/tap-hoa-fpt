import { NextRequest, NextResponse } from "next/server";
import {
  consumeOAuthState,
  exchangeFacebookCode,
  getAppBaseUrl,
} from "@/lib/oauth";
import { loginWithOAuthProfile } from "@/lib/oauth-login";

export async function GET(req: NextRequest) {
  const base = getAppBaseUrl();
  const url = new URL(req.url);
  const err = url.searchParams.get("error");
  if (err) {
    return NextResponse.redirect(
      `${base}/dang-nhap?oauth_error=${encodeURIComponent("Đăng nhập Facebook bị hủy")}`
    );
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expected = await consumeOAuthState("facebook");
  if (!code || !state || !expected || state !== expected) {
    return NextResponse.redirect(
      `${base}/dang-nhap?oauth_error=${encodeURIComponent("Phiên Facebook không hợp lệ")}`
    );
  }

  try {
    const profile = await exchangeFacebookCode(code);
    const { redirect } = await loginWithOAuthProfile(profile);
    return NextResponse.redirect(`${base}${redirect}`);
  } catch (e) {
    console.error("[oauth/facebook]", e);
    return NextResponse.redirect(
      `${base}/dang-nhap?oauth_error=${encodeURIComponent(
        e instanceof Error ? e.message : "Đăng nhập Facebook thất bại"
      )}`
    );
  }
}
