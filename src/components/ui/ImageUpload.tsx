"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type UploadFolder = "products" | "avatars" | "news" | "promotions";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  folder?: UploadFolder;
  label?: string;
  className?: string;
  round?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  folder = "products",
  label = "Ảnh",
  className,
  round = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setUploading(true);
    const res = await api.upload(file, folder);
    setUploading(false);
    if (res.success && res.data?.url) {
      onChange(res.data.url);
    } else {
      setError(res.error || "Upload thất bại");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden border border-dashed border-gray-300 bg-gray-50",
            round ? "rounded-full" : "rounded-xl"
          )}
        >
          {value ? (
            <Image src={value} alt="Preview" fill className="object-cover" unoptimized={value.startsWith("/uploads/")} />
          ) : (
            <ImagePlus className="h-8 w-8 text-gray-300" />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {value ? "Đổi ảnh" : "Chọn ảnh từ máy"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
            >
              <X className="h-3.5 w-3.5" />
              Xóa ảnh
            </button>
          )}
          <p className="text-xs text-gray-400">JPG, PNG, WEBP · tối đa 5MB</p>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
