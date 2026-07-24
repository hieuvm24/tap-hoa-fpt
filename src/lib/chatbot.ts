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
  { id: "1", label: "Giờ mở cửa", message: "Giờ mở cửa lúc nào?" },
  { id: "2", label: "Phí giao hàng", message: "Phí ship bao nhiêu?" },
  { id: "3", label: "Thanh toán", message: "Thanh toán VNPay thế nào?" },
  { id: "4", label: "Khuyến mãi", message: "Có mã giảm giá không?" },
  { id: "5", label: "Liên hệ", message: "Cho xin số điện thoại shop" },
  { id: "6", label: "Địa chỉ", message: "Shop ở đâu?" },
  { id: "7", label: "Gợi ý mua", message: "Gợi ý món bán chạy" },
];

let storeName = DEFAULT_STORE.name;
let storePhone = DEFAULT_STORE.phone;

export function setChatbotContext(store: { name: string; phone: string }) {
  storeName = store.name || DEFAULT_STORE.name;
  storePhone = store.phone || DEFAULT_STORE.phone;
}

export function getWelcomeMessage(): string {
  return `Chào anh/chị ạ, em hỗ trợ của **${storeName}**.\n\nEm giúp được: tìm hàng, hỏi giá, phí ship, khuyến mãi, cách đặt đơn.\nAnh/chị cứ nhắn nhu cầu nhé.`;
}

export function hintProducts(keyword: string, products: Product[], limit = 3): Product[] {
  return searchProductsByKeyword(keyword, products, limit);
}

export function formatProductHint(products: Product[]): string {
  return products.map((p) => `• **${p.name}** — ${formatPrice(p.price)}`).join("\n");
}

export { storePhone };
