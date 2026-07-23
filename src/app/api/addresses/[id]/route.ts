import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;
  const existing = await prisma.address.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) return apiError("Không tìm thấy địa chỉ", 404);

  const body = await req.json();
  const updated = await prisma.$transaction(async (tx) => {
    if (body.isDefault) {
      await tx.address.updateMany({
        where: { userId: session.userId },
        data: { isDefault: false },
      });
    }
    return tx.address.update({
      where: { id },
      data: {
        label: body.label !== undefined ? String(body.label).trim() : undefined,
        fullName:
          body.fullName !== undefined ? String(body.fullName).trim() : undefined,
        phone: body.phone !== undefined ? String(body.phone).trim() : undefined,
        address:
          body.address !== undefined ? String(body.address).trim() : undefined,
        isDefault:
          body.isDefault !== undefined ? Boolean(body.isDefault) : undefined,
      },
    });
  });

  return apiSuccess(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;
  const existing = await prisma.address.findFirst({
    where: { id, userId: session.userId },
  });
  if (!existing) return apiError("Không tìm thấy địa chỉ", 404);

  await prisma.address.delete({ where: { id } });
  return apiSuccess({ id });
}
