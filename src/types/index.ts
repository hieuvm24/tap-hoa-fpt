export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  images: string[];
  category: string;
  categorySlug: string;
  brand: string;
  sku: string;
  stock: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  status: "active" | "inactive";
  specs: Record<string, string>;
  isFeatured?: boolean;
  isPromotion?: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Review {
  id: string;
  customerName: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  discount: number;
  endDate: string;
}

export interface Order {
  id: string;
  orderCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: { product: Product; quantity: number; price: number }[];
  total: number;
  shippingFee: number;
  discount: number;
  status: OrderStatus;
  paymentMethod: "cod" | "transfer" | "vnpay";
  paymentStatus: "pending" | "paid" | "failed";
  paymentTxnRef?: string;
  address: string;
  note?: string;
  createdAt: string;
  timeline: { status: OrderStatus; date: string; note?: string }[];
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  isDefault: boolean;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  publishedAt: string;
  isPublished: boolean;
}

export interface StoreInfo {
  name: string;
  slogan: string;
  address: string;
  phone: string;
  email: string;
  facebook: string;
  zalo: string;
  openHours: string;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
  mapEmbedUrl?: string | null;
  bankName?: string;
  bankAccount?: string;
  bankOwner?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipping"
  | "delivered"
  | "cancelled";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  avatar: string;
  joinedAt: string;
}

export interface DashboardStats {
  todayRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  revenueChange: number;
  ordersChange: number;
}

export interface ChartData {
  label: string;
  value: number;
}
