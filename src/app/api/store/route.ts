import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

const STORE_FIELDS = [
  "name",
  "slogan",
  "address",
  "phone",
  "email",
  "facebook",
  "zalo",
  "openHours",
  "description",
  "latitude",
  "longitude",
  "mapEmbedUrl",
  "bankName",
  "bankAccount",
  "bankOwner",
] as const;

export async function GET() {
  const store = await prisma.storeSetting.findUnique({ where: { id: "default" } });
  if (!store) return apiError("Chưa cấu hình cửa hàng", 404);
  return apiSuccess(store);
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of STORE_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  if (data.latitude !== undefined && data.latitude !== null) {
    data.latitude = Number(data.latitude);
  }
  if (data.longitude !== undefined && data.longitude !== null) {
    data.longitude = Number(data.longitude);
  }

  const store = await prisma.storeSetting.upsert({
    where: { id: "default" },
    update: data,
    create: {
      id: "default",
      name: String(data.name || "Tạp Hóa FPT"),
      slogan: String(data.slogan || ""),
      address: String(data.address || ""),
      phone: String(data.phone || ""),
      email: String(data.email || ""),
      facebook: String(data.facebook || ""),
      zalo: String(data.zalo || ""),
      openHours: String(data.openHours || ""),
      description: String(data.description || ""),
      latitude: (data.latitude as number) ?? null,
      longitude: (data.longitude as number) ?? null,
      mapEmbedUrl: (data.mapEmbedUrl as string) || null,
      bankName: String(data.bankName || "Vietcombank"),
      bankAccount: String(data.bankAccount || "0123456789"),
      bankOwner: String(data.bankOwner || "TAP HOA FPT"),
    },
  });

  return apiSuccess(store);
}
