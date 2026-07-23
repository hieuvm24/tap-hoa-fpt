import type { MetadataRoute } from "next";

const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/danh-muc",
    "/khuyen-mai",
    "/tin-tuc",
    "/lien-he",
    "/chinh-sach/doi-tra",
    "/chinh-sach/giao-hang",
    "/chinh-sach/bao-mat",
    "/chinh-sach/dieu-khoan",
  ];

  return staticRoutes.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
