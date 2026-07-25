/**
 * Secret dung chung API (Node) + middleware (Edge) — phai giong nhau.
 * Co JWT_SECRET thi dung; khong co van ky/verify duoc de web chay (demo/ĐATN).
 */
const STABLE_FALLBACK = "taphoa-fpt-jwt-stable-v1-hieuvm24";

export function resolveJwtSecretString(): string {
  return process.env.JWT_SECRET?.trim() || STABLE_FALLBACK;
}
