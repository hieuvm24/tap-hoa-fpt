import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

export type UploadFolder = "products" | "avatars" | "news" | "promotions";

function hasCloudinary() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

async function uploadToCloudinary(
  buffer: Buffer,
  folder: UploadFolder,
  filename: string
): Promise<string> {
  configureCloudinary();
  const publicId = filename.replace(/\.[^.]+$/, "");

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: `taphoa-fpt/${folder}`,
          public_id: publicId,
          resource_type: "image",
          overwrite: true,
        },
        (err, res) => {
          if (err || !res?.secure_url) reject(err || new Error("Upload Cloudinary thất bại"));
          else resolve(res as { secure_url: string });
        }
      )
      .end(buffer);
  });

  return result.secure_url;
}

async function uploadToLocal(
  buffer: Buffer,
  folder: UploadFolder,
  filename: string
): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${folder}/${filename}`;
}

/** Production (Vercel): Cloudinary. Local không có Cloudinary: lưu public/uploads */
export async function saveUploadedImage(
  buffer: Buffer,
  folder: UploadFolder,
  filename: string
): Promise<{ url: string; storage: "cloudinary" | "local" }> {
  if (hasCloudinary()) {
    const url = await uploadToCloudinary(buffer, folder, filename);
    return { url, storage: "cloudinary" };
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Thiếu CLOUDINARY_* trên Vercel. Thêm Cloud Name / API Key / API Secret trong Environment Variables."
    );
  }

  const url = await uploadToLocal(buffer, folder, filename);
  return { url, storage: "local" };
}
