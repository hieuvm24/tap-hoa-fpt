import { NextResponse } from "next/server";
import {
  createOAuthState,
  getAppBaseUrl,
  googleAuthorizeUrl,
  isGoogleOAuthConfigured,
} from "@/lib/oauth";

export async function GET() {
  if (!isGoogleOAuthConfigured()) {
    return NextResponse.redirect(
      `${getAppBaseUrl()}/dang-nhap?oauth_error=${encodeURIComponent(
        "Chưa cấu hình Google OAuth (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)"
      )}`
    );
  }
  const state = await createOAuthState("google");
  return NextResponse.redirect(googleAuthorizeUrl(state));
}
