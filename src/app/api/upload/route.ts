import { NextRequest } from "next/server";
import path from "path";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";
import { saveUploadedImage, type UploadFolder } from "@/lib/storage";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_FOLDERS = new Set<UploadFolder>([
  "products",
  "avatars",
  "news",
  "promotions",
]);

function safeExt(filename: string, mime: string): string {
  const fromName = path.extname(filename).toLowerCase().replace(".", "");
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Vui lòng đăng nhập", 401);

  const formData = await req.formData();
  const file = formData.get("file");
  const folderRaw = String(formData.get("folder") || "products") as UploadFolder;

  if (!ALLOWED_FOLDERS.has(folderRaw)) {
    return apiError("Thư mục không hợp lệ");
  }

  if (folderRaw !== "avatars" && !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  if (!(file instanceof File)) {
    return apiError("Thiếu file ảnh");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return apiError("Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF");
  }

  if (file.size > MAX_SIZE) {
    return apiError("Ảnh tối đa 5MB");
  }

  const ext = safeExt(file.name, file.type);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const filename = `${unique}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { url, storage } = await saveUploadedImage(buffer, folderRaw, filename);
    return apiSuccess({ url, filename, storage }, 201);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload thất bại";
    return apiError(message, 500);
  }
}
