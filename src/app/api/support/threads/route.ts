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

function mapThread(
  t: {
    id: string;
    userId: string;
    status: string;
    lastMessageAt: Date;
    createdAt: Date;
    user?: { id: string; name: string; email: string; phone: string | null };
    messages?: {
      id: string;
      senderRole: string;
      senderId: string | null;
      senderName: string;
      content: string;
      createdAt: Date;
      readAt: Date | null;
    }[];
  },
  unreadFor?: "staff" | "customer"
) {
  const messages = (t.messages || []).map(mapMessage);
  let unread = 0;
  if (unreadFor && t.messages) {
    unread = t.messages.filter(
      (m) =>
        !m.readAt &&
        m.senderRole === (unreadFor === "staff" ? "customer" : "staff")
    ).length;
  }
  return {
    id: t.id,
    userId: t.userId,
    status: t.status,
    lastMessageAt: t.lastMessageAt.toISOString(),
    createdAt: t.createdAt.toISOString(),
    customer: t.user
      ? {
          id: t.user.id,
          name: t.user.name,
          email: t.user.email,
          phone: t.user.phone || undefined,
        }
      : undefined,
    messages,
    unread,
    preview: messages.length
      ? messages[messages.length - 1].content
      : undefined,
  };
}

/** Khach: thread cua minh. Admin: tat ca thread. */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Vui lòng đăng nhập", 401);

  const admin = isAdminRole(session.role);
  const { searchParams } = new URL(req.url);
  const withMessages = searchParams.get("messages") === "1";

  if (admin) {
    const threads = await prisma.supportThread.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        messages: withMessages
          ? { orderBy: { createdAt: "asc" }, take: 100 }
          : { orderBy: { createdAt: "desc" }, take: 1 },
        _count: {
          select: {
            messages: {
              where: { senderRole: "customer", readAt: null },
            },
          },
        },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 100,
    });
    return apiSuccess(
      threads.map((t) => ({
        ...mapThread(t, "staff"),
        unread: t._count.messages,
      }))
    );
  }

  let thread = await prisma.supportThread.findFirst({
    where: { userId: session.userId, status: "open" },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  if (!thread) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user) return apiError("Không tìm thấy tài khoản", 404);
    thread = await prisma.supportThread.create({
      data: {
        userId: user.id,
        messages: {
          create: {
            senderRole: "staff",
            senderName: "Cửa hàng",
            content:
              "Xin chào! Nhân viên sẽ trả lời sớm. Anh/chị cứ nhắn nhu cầu hoặc thắc mắc đơn hàng nhé.",
          },
        },
      },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });
  }

  return apiSuccess(mapThread(thread, "customer"));
}

/** Khach gui tin (tao thread neu chua co). Admin khong dung endpoint nay. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return apiError("Vui lòng đăng nhập để nhắn nhân viên", 401);
  if (isAdminRole(session.role)) {
    return apiError("Nhân viên trả lời ở mục Tin nhắn Admin", 403);
  }

  const body = await req.json();
  const content = String(body.content || "").trim();
  if (!content || content.length > 2000) {
    return apiError("Nội dung tin nhắn không hợp lệ");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user) return apiError("Không tìm thấy tài khoản", 404);

  let thread = await prisma.supportThread.findFirst({
    where: { userId: user.id, status: "open" },
    orderBy: { lastMessageAt: "desc" },
  });

  if (!thread) {
    thread = await prisma.supportThread.create({
      data: { userId: user.id },
    });
  }

  const message = await prisma.$transaction(async (tx) => {
    const msg = await tx.supportMessage.create({
      data: {
        threadId: thread!.id,
        senderRole: "customer",
        senderId: user.id,
        senderName: user.name,
        content,
      },
    });
    await tx.supportThread.update({
      where: { id: thread!.id },
      data: { lastMessageAt: new Date(), status: "open" },
    });
    return msg;
  });

  return apiSuccess(mapMessage(message), 201);
}
