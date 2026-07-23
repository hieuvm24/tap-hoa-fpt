import { NextResponse } from "next/server";
import type { Product, Category, Order, Review, Promotion, Customer, OrderStatus } from "@/types";
import type {
  Product as DbProduct,
  Category as DbCategory,
  Order as DbOrder,
  OrderItem,
  OrderTimeline,
  Review as DbReview,
  Promotion as DbPromotion,
  User,
} from "@prisma/client";

type ProductWithCategory = DbProduct & { category: DbCategory };
type OrderWithRelations = DbOrder & {
  items: (OrderItem & { product: DbProduct })[];
  timeline: OrderTimeline[];
};

export function mapProductStatus(status: string): "active" | "inactive" {
  return status === "ACTIVE" ? "active" : "inactive";
}

export function mapProduct(p: ProductWithCategory): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: p.price,
    originalPrice: p.originalPrice,
    image: p.image,
    images: JSON.parse(p.images || "[]") as string[],
    category: p.category.name,
    categorySlug: p.category.slug,
    brand: p.brand,
    sku: p.sku,
    stock: p.stock,
    rating: p.rating,
    reviewCount: p.reviewCount,
    status: mapProductStatus(p.status),
    specs: JSON.parse(p.specs || "{}") as Record<string, string>,
    isFeatured: p.isFeatured,
    isPromotion: p.isPromotion,
  };
}

export function mapCategory(c: DbCategory, productCount?: number): Category {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    productCount: productCount ?? 0,
  };
}

export function mapReview(r: DbReview): Review {
  return {
    id: r.id,
    customerName: r.customerName,
    avatar: r.avatar || "",
    rating: r.rating,
    comment: r.comment,
    date: r.createdAt.toISOString().split("T")[0],
  };
}

export function mapPromotion(p: DbPromotion): Promotion {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    image: p.image,
    discount: p.discount,
    endDate: p.endDate.toISOString().split("T")[0],
  };
}

export function mapOrder(o: OrderWithRelations): Order {
  return {
    id: o.id,
    orderCode: o.orderCode,
    customerId: o.userId || "",
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerEmail: o.customerEmail || undefined,
    items: o.items.map((item) => ({
      product: {
        id: item.productId,
        name: item.productName,
        slug: item.product.slug,
        description: item.product.description,
        price: item.price,
        originalPrice: item.product.originalPrice,
        image: item.productImage,
        images: [item.productImage],
        category: item.product.categoryId,
        categorySlug: "",
        brand: item.product.brand,
        sku: item.product.sku,
        stock: item.product.stock,
        rating: item.product.rating,
        reviewCount: item.product.reviewCount,
        status: mapProductStatus(item.product.status),
        specs: {},
      },
      quantity: item.quantity,
      price: item.price,
    })),
    total: o.total,
    shippingFee: o.shippingFee,
    discount: o.discount,
    status: o.status as OrderStatus,
    paymentMethod: o.paymentMethod as "cod" | "transfer" | "vnpay",
    paymentStatus: o.paymentStatus as "pending" | "paid" | "failed",
    paymentTxnRef: o.paymentTxnRef || undefined,
    address: o.address,
    note: o.note || undefined,
    createdAt: o.createdAt.toISOString(),
    timeline: o.timeline.map((t) => ({
      status: t.status as OrderStatus,
      date: t.createdAt.toISOString(),
      note: t.note || undefined,
    })),
  };
}

export function mapCustomer(
  u: User,
  stats: { orderCount: number; totalSpent: number }
): Customer {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone || "",
    email: u.email,
    orderCount: stats.orderCount,
    totalSpent: stats.totalSpent,
    avatar: u.avatar || "",
    joinedAt: u.createdAt.toISOString().split("T")[0],
  };
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function generateOrderCode(): Promise<string> {
  const count = await import("@/lib/db").then(({ prisma }) => prisma.order.count());
  return `DH${String(count + 1).padStart(6, "0")}`;
}
