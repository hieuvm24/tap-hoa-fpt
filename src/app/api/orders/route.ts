import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapOrder, apiSuccess, apiError } from "@/lib/mappers";
import { FREE_SHIP_THRESHOLD, SHIPPING_FEE, DEFAULT_STORE } from "@/config/defaults";
import { calcPromotionDiscount } from "@/lib/promotions";

const orderInclude = {
  items: { include: { product: true } },
  timeline: { orderBy: { createdAt: "asc" as const } },
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine");
  const status = searchParams.get("status");
  const limitRaw = Number(searchParams.get("limit") || 0);
  const code = searchParams.get("code")?.trim().toUpperCase();
  const phone = searchParams.get("phone")?.replace(/\D/g, "");

  // Tra cứu đơn khách: mã đơn + SĐT khớp chính xác (sau khi bỏ ký tự)
  if (code && phone && phone.length >= 9) {
    const candidates = await prisma.order.findMany({
      where: { orderCode: code },
      include: orderInclude,
      take: 5,
    });
    const order = candidates.find(
      (o) => o.customerPhone.replace(/\D/g, "").endsWith(phone.slice(-9))
    );
    if (!order) return apiError("Không tìm thấy đơn hàng với mã và SĐT này", 404);
    return apiSuccess([mapOrder(order)]);
  }

  const where: Record<string, unknown> = {};

  if (mine === "true") {
    if (!session) return apiError("Unauthorized", 401);
    where.userId = session.userId;
  } else if (!session || !isAdminRole(session.role)) {
    if (!session) return apiError("Unauthorized", 401);
    where.userId = session.userId;
  }

  if (status) where.status = status;

  const search = searchParams.get("search")?.trim();
  const from = searchParams.get("from")?.trim();
  const to = searchParams.get("to")?.trim();
  const isPostgres = (process.env.DATABASE_URL || "").startsWith("postgres");
  const mode = isPostgres ? ({ mode: "insensitive" as const }) : {};

  if (search) {
    where.OR = [
      { orderCode: { contains: search, ...mode } },
      { customerName: { contains: search, ...mode } },
      { customerPhone: { contains: search, ...mode } },
      { customerEmail: { contains: search, ...mode } },
    ];
  }

  if (from || to) {
    const createdAt: { gte?: Date; lte?: Date } = {};
    if (from) {
      const d = new Date(from);
      d.setHours(0, 0, 0, 0);
      createdAt.gte = d;
    }
    if (to) {
      const d = new Date(to);
      d.setHours(23, 59, 59, 999);
      createdAt.lte = d;
    }
    where.createdAt = createdAt;
  }

  const pageRaw = Number(searchParams.get("page") || 0);
  const paginate = pageRaw > 0 || searchParams.get("paginate") === "true";
  const page = Math.max(1, pageRaw || 1);
  const pageSize = Math.min(
    Math.max(limitRaw > 0 ? limitRaw : 20, 1),
    100
  );

  if (paginate) {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);
    return apiSuccess({
      orders: orders.map(mapOrder),
      total,
      page,
      limit: pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  }

  const orders = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    ...(limitRaw > 0 ? { take: Math.min(limitRaw, 50) } : {}),
  });

  return apiSuccess(orders.map(mapOrder));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  const body = await req.json();

  const {
    customerName,
    customerPhone,
    customerEmail,
    address,
    note,
    paymentMethod,
    items,
    voucherCode,
    fulfillmentType: rawFulfillment,
    walkIn,
  } = body;

  const isWalkIn = Boolean(walkIn);
  if (isWalkIn && (!session || !isAdminRole(session.role))) {
    return apiError("Chỉ nhân viên / chủ cửa hàng được bán tại quầy", 403);
  }
  if (!isWalkIn && !session) {
    return apiError("Vui lòng đăng nhập để đặt hàng", 401);
  }
  // Nhan vien / chu chi ban tai quay — khong dat don khach tren storefront
  if (
    !isWalkIn &&
    session &&
    (session.role === "STAFF" || session.role === "OWNER")
  ) {
    return apiError(
      "Tài khoản nhân viên/chủ cửa hàng dùng mục Bán tại quầy trong Admin",
      403
    );
  }

  const fulfillmentType =
    isWalkIn || rawFulfillment === "pickup" ? "pickup" : "delivery";

  if (!customerName || !customerPhone || !items?.length) {
    return apiError("Thiếu thông tin đơn hàng");
  }
  if (fulfillmentType === "delivery" && !address) {
    return apiError("Vui lòng nhập địa chỉ giao hàng");
  }

  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, status: "ACTIVE" },
    include: { category: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItems: {
    productId: string;
    quantity: number;
    price: number;
    productName: string;
    productImage: string;
  }[] = [];
  const promoLines: { categorySlug: string; price: number; quantity: number }[] =
    [];

  for (const item of items as { productId: string; quantity: number }[]) {
    const product = productMap[item.productId];
    if (!product) {
      return apiError("Sản phẩm không tồn tại hoặc đã ngừng bán");
    }
    if (item.quantity < 1) {
      return apiError("Số lượng không hợp lệ");
    }
    if (product.stock < item.quantity) {
      return apiError(`${product.name} không đủ hàng (còn ${product.stock})`);
    }
    subtotal += product.price * item.quantity;
    orderItems.push({
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
      productName: product.name,
      productImage: product.image,
    });
    promoLines.push({
      categorySlug: product.category.slug,
      price: product.price,
      quantity: item.quantity,
    });
  }

  const activePromos = await prisma.promotion.findMany({
    where: { endDate: { gte: new Date() } },
  });
  const { amount: promoDiscount, labels: promoLabels } = calcPromotionDiscount(
    activePromos,
    promoLines
  );

  let voucherDiscount = 0;
  let appliedVoucher: string | undefined;
  if (voucherCode) {
    const voucher = await prisma.voucher.findFirst({
      where: { code: voucherCode.toUpperCase(), isActive: true },
    });
    if (!voucher) {
      return apiError("Mã giảm giá không hợp lệ hoặc đã hết hạn");
    }
    if (subtotal < voucher.minOrder) {
      return apiError(
        `Đơn tối thiểu ${voucher.minOrder.toLocaleString("vi-VN")}đ để dùng mã này`
      );
    }
    voucherDiscount = Math.round(subtotal * (voucher.discount / 100));
    appliedVoucher = voucher.code;
  }

  const discount = Math.min(subtotal, promoDiscount + voucherDiscount);

  const shippingFee =
    fulfillmentType === "pickup"
      ? 0
      : subtotal >= FREE_SHIP_THRESHOLD
        ? 0
        : SHIPPING_FEE;
  const total = Math.max(0, subtotal + shippingFee - discount);

  const store = await prisma.storeSetting.findUnique({ where: { id: "default" } });
  const storeAddress = store?.address || DEFAULT_STORE.address;

  const shipAddress =
    fulfillmentType === "pickup"
      ? `Nhận tại quầy — ${storeAddress}`
      : String(address);

  const noteParts = [
    note,
    promoLabels.length ? `KM: ${promoLabels.join("; ")}` : null,
  ].filter(Boolean);

  // Chong dat trung khi doi mang / bam 2 lan: cung user, cung tong, trong 90s
  if (session?.userId && !isWalkIn) {
    const recent = await prisma.order.findFirst({
      where: {
        userId: session.userId,
        total,
        status: { not: "cancelled" },
        createdAt: { gte: new Date(Date.now() - 90_000) },
      },
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
    if (recent) {
      const sameItems =
        recent.items.length === orderItems.length &&
        orderItems.every((oi) =>
          recent.items.some(
            (ri) =>
              ri.productId === oi.productId && ri.quantity === oi.quantity
          )
        );
      if (sameItems) return apiSuccess(mapOrder(recent), 200);
    }
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      for (const item of orderItems) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
            soldCount: { increment: item.quantity },
          },
        });
        if (updated.count === 0) {
          throw new Error(
            `Hết hàng hoặc không đủ tồn: ${item.productName}`
          );
        }
      }

      const orderCode = `${isWalkIn ? "TQ" : "DH"}${Date.now()
        .toString(36)
        .toUpperCase()}${Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, "0")}`;

      const timelineCreates = isWalkIn
        ? [
            { status: "pending", note: "Bán tại quầy" },
            { status: "confirmed", note: "Thu ngân xác nhận" },
            { status: "delivered", note: "Khách đã nhận tại quầy" },
          ]
        : [
            {
              status: "pending",
              note:
                fulfillmentType === "pickup"
                  ? "Đơn đến lấy tại quầy — chờ xác nhận"
                  : "Đơn hàng đã được đặt",
            },
          ];

      return tx.order.create({
        data: {
          orderCode,
          userId: isWalkIn ? undefined : session?.userId,
          customerName,
          customerPhone,
          customerEmail,
          subtotal,
          shippingFee,
          discount,
          total,
          status: isWalkIn ? "delivered" : "pending",
          paymentMethod: (paymentMethod as string) || "cod",
          paymentStatus: isWalkIn ? "paid" : "pending",
          fulfillmentType,
          address: shipAddress,
          note: noteParts.join(" | ") || undefined,
          voucherCode: appliedVoucher,
          items: { create: orderItems },
          timeline: { create: timelineCreates },
        },
        include: orderInclude,
      });
    });

    return apiSuccess(mapOrder(order), 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Không tạo được đơn hàng";
    return apiError(msg);
  }
}
