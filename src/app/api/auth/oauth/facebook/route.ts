import { NextResponse } from "next/server";
import {
  createOAuthState,
  facebookAuthorizeUrl,
  getAppBaseUrl,
  isFacebookOAuthConfigured,
} from "@/lib/oauth";

export async function GET() {
  if (!isFacebookOAuthConfigured()) {
    return NextResponse.redirect(
      `${getAppBaseUrl()}/dang-nhap?oauth_error=${encodeURIComponent(
        "Chưa cấu hình Facebook OAuth (FACEBOOK_APP_ID / FACEBOOK_APP_SECRET)"
      )}`
    );
  }
  const state = await createOAuthState("facebook");
  return NextResponse.redirect(facebookAuthorizeUrl(state));
}
