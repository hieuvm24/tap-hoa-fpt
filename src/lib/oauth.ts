import crypto from "crypto";
import { cookies } from "next/headers";

const STATE_COOKIE = "taphoa_oauth_state";

export function getAppBaseUrl() {
  const raw = (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

export function isGoogleOAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export function isFacebookOAuthConfigured() {
  return Boolean(
    process.env.FACEBOOK_APP_ID?.trim() &&
      process.env.FACEBOOK_APP_SECRET?.trim()
  );
}

export async function createOAuthState(provider: "google" | "facebook") {
  const state = `${provider}.${crypto.randomBytes(16).toString("hex")}`;
  const jar = await cookies();
  jar.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
  return state;
}

export async function consumeOAuthState(expectedProvider: "google" | "facebook") {
  const jar = await cookies();
  const state = jar.get(STATE_COOKIE)?.value || "";
  jar.delete(STATE_COOKIE);
  if (!state.startsWith(`${expectedProvider}.`)) return null;
  return state;
}

export function googleAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
    redirect_uri: `${getAppBaseUrl()}/api/auth/oauth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function facebookAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!.trim(),
    redirect_uri: `${getAppBaseUrl()}/api/auth/oauth/facebook/callback`,
    state,
    scope: "email,public_profile",
  });
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
}

export type OAuthProfile = {
  provider: "google" | "facebook";
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
};

export async function exchangeGoogleCode(code: string): Promise<OAuthProfile> {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
      redirect_uri: `${getAppBaseUrl()}/api/auth/oauth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) throw new Error("Google token exchange failed");
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) throw new Error("Missing Google access token");

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!profileRes.ok) throw new Error("Google profile fetch failed");
  const p = (await profileRes.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
    email_verified?: boolean;
  };
  if (!p.sub || !p.email) throw new Error("Google profile incomplete");
  return {
    provider: "google",
    providerId: p.sub,
    email: p.email.toLowerCase(),
    name: p.name || p.email.split("@")[0],
    avatar: p.picture,
  };
}

export async function exchangeFacebookCode(code: string): Promise<OAuthProfile> {
  const tokenParams = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!.trim(),
    client_secret: process.env.FACEBOOK_APP_SECRET!.trim(),
    redirect_uri: `${getAppBaseUrl()}/api/auth/oauth/facebook/callback`,
    code,
  });
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams}`
  );
  if (!tokenRes.ok) throw new Error("Facebook token exchange failed");
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) throw new Error("Missing Facebook access token");

  const profileParams = new URLSearchParams({
    fields: "id,name,email,picture.type(large)",
    access_token: tokenJson.access_token,
  });
  const profileRes = await fetch(
    `https://graph.facebook.com/me?${profileParams}`
  );
  if (!profileRes.ok) throw new Error("Facebook profile fetch failed");
  const p = (await profileRes.json()) as {
    id?: string;
    name?: string;
    email?: string;
    picture?: { data?: { url?: string } };
  };
  if (!p.id) throw new Error("Facebook profile incomplete");
  if (!p.email) {
    throw new Error("Facebook không trả email — hãy cấp quyền email khi đăng nhập");
  }
  return {
    provider: "facebook",
    providerId: p.id,
    email: p.email.toLowerCase(),
    name: p.name || p.email.split("@")[0],
    avatar: p.picture?.data?.url,
  };
}
