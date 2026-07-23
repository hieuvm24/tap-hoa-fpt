import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapOrder, apiSuccess, apiError } from "@/lib/mappers";

const orderInclude = {
  items: { include: { product: true } },
  timeline: { orderBy: { createdAt: "asc" as const } },
};

export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const mine = searchParams.get("mine");

  const where: Record<string, unknown> = {};

  if (mine === "true") {
    if (!session) return apiError("Unauthorized", 401);
    where.userId = session.userId;
  } else if (!session || !isAdminRole(session.role)) {
    if (!session) return apiError("Unauthorized", 401);
    where.userId = session.userId;
  }

  const orders = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
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
  } = body;

  if (!customerName || !customerPhone || !address || !items?.length) {
    return apiError("Thiếu thông tin đơn hàng");
  }

  const productIds = items.map((i: { productId: string }) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let subtotal = 0;
  const orderItems = items.map((item: { productId: string; quantity: number }) => {
    const product = productMap[item.productId];
    if (!product) throw new Error("Sản phẩm không tồn tại");
    if (product.stock < item.quantity) {
      throw new Error(`${product.name} không đủ hàng (còn ${product.stock})`);
    }
    subtotal += product.price * item.quantity;
    return {
      productId: product.id,
      quantity: item.quantity,
      price: product.price,
      productName: product.name,
      productImage: product.image,
    };
  });

  let discount = 0;
  if (voucherCode) {
    const voucher = await prisma.voucher.findFirst({
      where: { code: voucherCode.toUpperCase(), isActive: true },
    });
    if (voucher && subtotal >= voucher.minOrder) {
      discount = Math.round(subtotal * (voucher.discount / 100));
    }
  }

  const shippingFee = subtotal >= 200000 ? 0 : 15000;
  const total = subtotal + shippingFee - discount;

  const count = await prisma.order.count();
  const orderCode = `DH${String(count + 1).padStart(6, "0")}`;

  const order = await prisma.$transaction(async (tx) => {
    for (const item of orderItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return tx.order.create({
      data: {
        orderCode,
        userId: session?.userId,
        customerName,
        customerPhone,
        customerEmail,
        subtotal,
        shippingFee,
        discount,
        total,
        paymentMethod: paymentMethod as string,
        paymentStatus: "pending",
        address,
        note,
        voucherCode: voucherCode?.toUpperCase(),
        items: { create: orderItems },
        timeline: {
          create: [{ status: "pending", note: "Đơn hàng đã được đặt" }],
        },
      },
      include: orderInclude,
    });
  });

  return apiSuccess(mapOrder(order), 201);
}
