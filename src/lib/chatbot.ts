import { DEFAULT_STORE } from "@/config/defaults";
import { formatPrice } from "@/lib/utils";
import { searchProductsByKeyword } from "@/lib/recommendations";
import type { Product } from "@/types";

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  products?: Product[];
  timestamp: Date;
}

export interface QuickReply {
  id: string;
  label: string;
  message: string;
}

export const QUICK_REPLIES: QuickReply[] = [
  { id: "1", label: "🕐 Giờ mở cửa", message: "Giờ mở cửa" },
  { id: "2", label: "🚚 Phí giao hàng", message: "Phí ship bao nhiêu" },
  { id: "3", label: "💳 Thanh toán", message: "Cách thanh toán VNPay" },
  { id: "4", label: "🎁 Khuyến mãi", message: "Khuyến mãi hôm nay" },
  { id: "5", label: "📞 Liên hệ", message: "Hotline liên hệ" },
  { id: "6", label: "📍 Bản đồ", message: "Địa chỉ bản đồ cửa hàng" },
  { id: "7", label: "🥬 Rau củ", message: "Có rau củ gì" },
];

let storeName = DEFAULT_STORE.name;
let storePhone = DEFAULT_STORE.phone;

export function setChatbotContext(
  store: { name: string; phone: string },
  _products?: Product[]
) {
  storeName = store.name || DEFAULT_STORE.name;
  storePhone = store.phone || DEFAULT_STORE.phone;
}

export function getWelcomeMessage(): string {
  return `Xin chào! 👋 Em là trợ lý AI của **${storeName}**.\n\nEm sẵn sàng tư vấn sản phẩm, phí ship, khuyến mãi, VNPay và hướng dẫn đặt hàng.\n\nAnh/chị cần giúp gì ạ?`;
}

/** Gợi ý sản phẩm nhanh phía client (fallback khi API chưa trả products) */
export function hintProducts(
  keyword: string,
  products: Product[],
  limit = 3
): Product[] {
  return searchProductsByKeyword(keyword, products, limit).map((p) => ({
    ...p,
    // keep shape
  }));
}

export function formatProductHint(products: Product[]): string {
  return products
    .map((p) => `• **${p.name}** — ${formatPrice(p.price)}`)
    .join("\n");
}

export { storePhone };
