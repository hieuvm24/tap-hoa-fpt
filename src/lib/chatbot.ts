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
  { id: "2", label: "Phí ship", message: "Phí ship bao nhiêu?" },
  { id: "3", label: "Đến lấy hàng", message: "Đến lấy hàng tại quầy được không?" },
  { id: "4", label: "Shop bán gì", message: "Shop bán những gì?" },
  { id: "5", label: "Khuyến mãi", message: "Có mã giảm giá không?" },
  { id: "6", label: "Địa chỉ", message: "Shop ở đâu?" },
  { id: "7", label: "Bán chạy", message: "Gợi ý món bán chạy" },
];

let storeName = DEFAULT_STORE.name;
let storePhone = DEFAULT_STORE.phone;

export function setChatbotContext(store: { name: string; phone: string }) {
  storeName = store.name || DEFAULT_STORE.name;
  storePhone = store.phone || DEFAULT_STORE.phone;
}

export function getWelcomeMessage(): string {
  return `Chào anh/chị ạ, em hỗ trợ **${storeName}** — tạp hóa / siêu thị mini (online + tại quầy).\n\nHỏi giá, còn hàng, ship, đến lấy, giờ mở cửa… cứ nhắn em nhé.`;
}

export function hintProducts(keyword: string, products: Product[], limit = 3): Product[] {
  return searchProductsByKeyword(keyword, products, limit);
}

export function formatProductHint(products: Product[]): string {
  return products.map((p) => `• **${p.name}** — ${formatPrice(p.price)}`).join("\n");
}

export { storePhone };
