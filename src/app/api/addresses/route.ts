import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

export async function GET() {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const addresses = await prisma.address.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { label: "asc" }],
  });
  return apiSuccess(addresses);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const body = await req.json();
  const label = String(body.label || "Nhà").trim();
  const fullName = String(body.fullName || "").trim();
  const phone = String(body.phone || "").trim();
  const address = String(body.address || "").trim();
  const isDefault = Boolean(body.isDefault);

  if (!fullName || !phone || !address) return apiError("Thiếu thông tin địa chỉ");

  const created = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({
        where: { userId: session.userId },
        data: { isDefault: false },
      });
    }
    const count = await tx.address.count({ where: { userId: session.userId } });
    return tx.address.create({
      data: {
        userId: session.userId,
        label,
        fullName,
        phone,
        address,
        isDefault: isDefault || count === 0,
      },
    });
  });

  return apiSuccess(created, 201);
}
