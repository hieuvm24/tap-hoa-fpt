import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { apiSuccess, apiError } from "@/lib/mappers";

function mapMessage(m: {
  id: string;
  senderRole: string;
  senderId: string | null;
  senderName: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
}) {
  return {
    id: m.id,
    senderRole: m.senderRole as "customer" | "staff",
    senderId: m.senderId || undefined,
    senderName: m.senderName,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt?.toISOString(),
  };
}

/** Lay chi tiet thread + danh dau da doc */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  const { id } = await params;

  const thread = await prisma.supportThread.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
      messages: { orderBy: { createdAt: "asc" }, take: 300 },
    },
  });
  if (!thread) return apiError("Không tìm thấy hội thoại", 404);

  const admin = isAdminRole(session.role);
  if (!admin && thread.userId !== session.userId) {
    return apiError("Forbidden", 403);
  }

  const peerRole = admin ? "customer" : "staff";
  await prisma.supportMessage.updateMany({
    where: {
      threadId: id,
      senderRole: peerRole,
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return apiSuccess({
    id: thread.id,
    userId: thread.userId,
    status: thread.status,
    lastMessageAt: thread.lastMessageAt.toISOString(),
    createdAt: thread.createdAt.toISOString(),
    customer: {
      id: thread.user.id,
      name: thread.user.name,
      email: thread.user.email,
      phone: thread.user.phone || undefined,
    },
    messages: thread.messages.map(mapMessage),
  });
}

/** Nhan vien / chu tra loi; khach cung co the gui qua day */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return apiError("Unauthorized", 401);
  const { id } = await params;
  const body = await req.json();
  const content = String(body.content || "").trim();
  if (!content || content.length > 2000) {
    return apiError("Nội dung tin nhắn không hợp lệ");
  }

  const thread = await prisma.supportThread.findUnique({ where: { id } });
  if (!thread) return apiError("Không tìm thấy hội thoại", 404);

  const admin = isAdminRole(session.role);
  if (!admin && thread.userId !== session.userId) {
    return apiError("Forbidden", 403);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user) return apiError("Không tìm thấy tài khoản", 404);

  const senderRole = admin ? "staff" : "customer";
  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.supportMessage.create({
      data: {
        threadId: id,
        senderRole,
        senderId: user.id,
        senderName: admin ? `${user.name} (NV)` : user.name,
        content,
      },
    });
    await tx.supportThread.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        status: body.close ? "closed" : "open",
      },
    });
    return msg;
  });

  return apiSuccess(mapMessage(message), 201);
}

/** Đóng / mở lại hội thoại hỗ trợ */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const { id } = await params;
  const body = await req.json();
  const status = String(body.status || "");
  if (status !== "open" && status !== "closed") {
    return apiError("status phải là open hoặc closed");
  }

  const thread = await prisma.supportThread.findUnique({ where: { id } });
  if (!thread) return apiError("Không tìm thấy hội thoại", 404);

  const updated = await prisma.supportThread.update({
    where: { id },
    data: { status },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  });

  return apiSuccess({
    id: updated.id,
    status: updated.status,
    lastMessageAt: updated.lastMessageAt.toISOString(),
    customer: {
      id: updated.user.id,
      name: updated.user.name,
      email: updated.user.email,
      phone: updated.user.phone || undefined,
    },
  });
}
