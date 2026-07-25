import { formatPrice } from "@/lib/utils";
import { searchProductsByKeyword } from "@/lib/recommendations";
import { FREE_SHIP_THRESHOLD, SHIPPING_FEE } from "@/config/defaults";
import { normalizeVi } from "@/lib/normalize-vi";
import type { Product } from "@/types";

export interface AiChatContext {
  store: {
    name: string;
    phone: string;
    zalo: string;
    facebook: string;
    email: string;
    address: string;
    openHours: string;
    description?: string;
  };
  products: Product[];
  categories?: { name: string; slug: string; count: number }[];
  promotions?: { title: string; discount: number }[];
}

export interface AiChatResult {
  text: string;
  products?: Product[];
  source: "openai" | "rules";
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const STOP_WORDS = new Set([
  "co",
  "khong",
  "a",
  "ay",
  "oi",
  "nhe",
  "nha",
  "duoc",
  "giup",
  "cho",
  "toi",
  "minh",
  "anh",
  "chi",
  "em",
  "shop",
  "ban",
  "mua",
  "tim",
  "xem",
  "can",
  "gia",
  "bao",
  "nhieu",
  "hang",
  "the",
  "nao",
  "o",
  "dau",
  "tai",
  "cua",
  "hang",
]);

function cleanKeyword(raw: string) {
  return normalizeVi(raw)
    .split(" ")
    .filter((t) => t && !STOP_WORDS.has(t) && t.length > 1)
    .join(" ")
    .trim();
}

function buildSystemPrompt(ctx: AiChatContext): string {
  const catalog = ctx.products
    .slice(0, 80)
    .map(
      (p) =>
        `- ${p.name} | ${formatPrice(p.price)} | ${p.category} | ton ${p.stock}`
    )
    .join("\n");
  const cats =
    ctx.categories
      ?.map((c) => `${c.name} (${c.count})`)
      .join(", ") || "thuc pham, do uong, gia vi, banh keo, do gia dung...";
  const promos =
    ctx.promotions?.map((p) => `- ${p.title} (giam ${p.discount}%)`).join("\n") ||
    "- Ma TAPHOA10 giam 10% (don tu 100.000d)";

  return `Ban la nhan vien tu van cua "${ctx.store.name}" — tiem tap hoa / sieu thi mini o que (Gia Vien, Ninh Binh).
Noi tieng Viet tu nhien, ngan gon, lich su. Co the dung **in dam**.

Cua hang:
- Vua ban online (web), vua ban truc tiep tai quay
- Ban nhu sieu thi mini: thuc pham, do uong, gia vi, banh keo, do dong lanh, do gia dung, do dung ca nhan...
- Dia chi: ${ctx.store.address}
- Hotline/Zalo: ${ctx.store.phone}
- Facebook: ${ctx.store.facebook}
- Email: ${ctx.store.email}
- Gio mo cua: ${ctx.store.openHours}
${ctx.store.description ? `- Mo ta: ${ctx.store.description}` : ""}

Chinh sach:
- Phi ship ${formatPrice(SHIPPING_FEE)}, freeship tu ${formatPrice(FREE_SHIP_THRESHOLD)}
- Giao noi thi ~2 gio, vung ven 3-4 gio (trong gio mo cua)
- Den lay tai quay: khong tinh ship
- Thanh toan: COD, chuyen khoan, VNPay; tai quay: tien mat / chuyen khoan
- Doi tra 24h neu hang loi

Danh muc: ${cats}

Khuyen mai:
${promos}

San pham (tham khao):
${catalog}

Quy tac:
1. Tra loi DUNG trong tam cau hoi (gia, con hang, ship, gio mo, den lay...).
2. Chi gioi thieu san pham co trong danh sach tren; khong bia.
3. Neu khong chac → goi ${ctx.store.phone} hoac den cua hang.
4. Toi da ~8 dong.`;
}

async function callOpenAI(
  message: string,
  history: { role: "user" | "assistant"; content: string }[],
  ctx: AiChatContext
): Promise<string | null> {
  if (!OPENAI_API_KEY) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: buildSystemPrompt(ctx) },
          ...history.slice(-8),
          { role: "user", content: message },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

function findProducts(query: string, products: Product[], limit = 4): Product[] {
  const cleaned = cleanKeyword(query) || normalizeVi(query);
  const found = searchProductsByKeyword(cleaned, products, limit);
  if (found.length) return found;

  const q = cleaned;
  const tokens = q.split(/\s+/).filter(Boolean);
  const scored = products
    .map((p) => {
      const hay = normalizeVi(
        `${p.name} ${p.brand} ${p.category} ${p.description}`
      );
      let score = 0;
      if (hay.includes(q)) score += 10;
      for (const token of tokens) {
        if (hay.includes(token)) score += token.length > 2 ? 3 : 1;
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating);
  return scored.slice(0, limit).map((x) => x.p);
}

function listProducts(products: Product[]) {
  return products
    .map(
      (p) =>
        `• **${p.name}** — ${formatPrice(p.price)}${p.stock > 0 ? ` (còn ${p.stock})` : " (tạm hết)"}`
    )
    .join("\n");
}

type Intent =
  | "greeting"
  | "hours"
  | "shipping"
  | "payment"
  | "promo"
  | "contact"
  | "location"
  | "howto"
  | "return"
  | "walkin"
  | "catalog"
  | "featured"
  | "product"
  | "unknown";

function detectIntent(raw: string, normalized: string): Intent {
  if (
    /^(xin chao|chao shop|chao|hello|hi|hey)(\s|$)/i.test(normalized) ||
    normalized === "chao"
  ) {
    return "greeting";
  }
  if (/(gio mo|mo cua|may gio|giờ mở)/i.test(raw) || normalized.includes("gio mo")) {
    return "hours";
  }
  if (
    /(ship|giao hang|phi giao|freeship|mien phí ship|giao tan)/i.test(raw) ||
    normalized.includes("phi ship")
  ) {
    return "shipping";
  }
  if (/(thanh toan|cod|vnpay|chuyen khoan|qr|tien mat)/i.test(raw)) {
    return "payment";
  }
  if (/(khuyen mai|voucher|giam gia|ma giam|uu dai)/i.test(raw)) {
    return "promo";
  }
  if (
    /(lien he|hotline|zalo|so dien thoai|sdt)\b/i.test(normalized) ||
    /(liên hệ|số điện thoại)/i.test(raw)
  ) {
    return "contact";
  }
  // Quan trong: dung chuoi da bo dau ("shop o dau") — raw "ở đâu" khong match /o dau/
  if (
    /\b(o dau|dia chi|ban do|chi duong|map|vi tri|dia diem)\b/i.test(
      normalized
    ) ||
    /(ở đâu|địa chỉ|bản đồ|chỉ đường|vị trí)/i.test(raw)
  ) {
    return "location";
  }
  if (/(dat hang|mua the nao|cach mua|huong dan dat|order)/i.test(raw)) {
    return "howto";
  }
  if (/(doi tra|hoan tien|hang loi)/i.test(raw)) {
    return "return";
  }
  if (
    /(den lay|tai quay|mua truc tiep|toi shop|den shop|mua tai cua hang|lay hang)/i.test(
      raw
    ) ||
    /(den lay|tai quay|truc tiep)/i.test(normalized)
  ) {
    return "walkin";
  }
  if (
    /(ban gi|co nhung gi|danh muc|sieu thi|tap hoa ban|hang hoa)/i.test(raw) ||
    /(ban gi|co gi ban)/i.test(normalized)
  ) {
    return "catalog";
  }
  if (
    /(ban chay|noi bat|goi y mon|goi y mua|nen mua gi|hom nay mua)/i.test(
      normalized
    ) ||
    /(gợi ý|bán chạy|nên mua gì)/i.test(raw)
  ) {
    return "featured";
  }
  if (
    /\b(gia|bao nhieu|con khong|con hang|co ban|tim|mua|can|xem)\b/i.test(
      normalized
    )
  ) {
    return "product";
  }
  // Cau ngan chi coi la tim SP khi co tu khoa hang — tranh "shop o dau?" → product
  if (
    raw.length <= 40 &&
    !/\b(o dau|dia chi|giup|hoi|the nao|sao|ai|khi nao)\b/i.test(normalized)
  ) {
    return "product";
  }
  return "unknown";
}

function extractProductQuery(raw: string, normalized: string): string | null {
  const patterns = [
    /(?:giá|bao nhiêu|còn không|còn hàng|có bán|có)\s+(.+)/i,
    /(?:bán|mua|tìm|xem|cần|gợi ý)\s+(.+)/i,
    /(.+?)\s+(?:bao nhiêu|giá bao nhiêu|còn không)/i,
  ];
  for (const re of patterns) {
    const m = raw.match(re);
    if (m?.[1]) {
      const cleaned = cleanKeyword(m[1]);
      if (cleaned.length >= 2) return cleaned;
    }
  }

  const cats = [
    ["bot giat", "bot giat"],
    ["dau goi", "dau goi"],
    ["kem danh rang", "kem"],
    ["nuoc mam", "nuoc mam"],
    ["dau an", "dau an"],
    ["mi goi", "mi"],
    ["sua tuoi", "sua"],
    ["trai cay", "trai cay"],
    ["rau cu", "rau"],
    ["banh keo", "banh"],
    ["dong lanh", "dong lanh"],
    ["gia vi", "gia vi"],
    ["do uong", "nuoc"],
    ["gao", "gao"],
    ["sua", "sua"],
    ["mi", "mi"],
    ["cafe", "cafe"],
    ["ca phe", "ca phe"],
    ["oreo", "oreo"],
    ["coca", "coca"],
    ["lavie", "lavie"],
  ];
  for (const [needle, key] of cats) {
    if (normalized.includes(needle)) return key;
  }

  const cleaned = cleanKeyword(raw);
  if (cleaned.length >= 2 && cleaned.length <= 40) return cleaned;
  return null;
}

function ruleBasedReply(message: string, ctx: AiChatContext): AiChatResult {
  const { store, products, promotions, categories } = ctx;
  const raw = message.trim();
  const normalized = normalizeVi(raw);
  const intent = detectIntent(raw, normalized);

  if (intent === "greeting") {
    return {
      text: `Chào anh/chị ạ, em hỗ trợ **${store.name}**.\nShop vừa bán online vừa bán tại quầy — đồ ăn uống, gia vị, bánh kẹo, đồ dùng nhà… như siêu thị mini.\nAnh/chị cần hỏi gì (giá, còn hàng, ship, giờ mở cửa) cứ nhắn em nhé.`,
      source: "rules",
    };
  }

  if (intent === "hours") {
    return {
      text: `Shop mở **${store.openHours}**.\n• Online: đặt mọi lúc, ngoài giờ xử lý ca sau.\n• Đến mua trực tiếp: trong giờ mở cửa tại ${store.address}.`,
      source: "rules",
    };
  }

  if (intent === "shipping") {
    return {
      text: `Giao hàng online:\n• Phí ship **${formatPrice(SHIPPING_FEE)}**\n• Freeship từ **${formatPrice(FREE_SHIP_THRESHOLD)}**\n• Nội thị ~2 giờ, vùng ven 3–4 giờ\n\nHoặc anh/chị **đến lấy tại quầy** thì không tính ship.`,
      source: "rules",
    };
  }

  if (intent === "payment") {
    return {
      text: `Thanh toán:\n• **Online:** COD, chuyển khoản, VNPay\n• **Tại quầy:** tiền mặt hoặc chuyển khoản\nAnh/chị chọn lúc thanh toán trên web hoặc trả khi nhận hàng / tại shop.`,
      source: "rules",
    };
  }

  if (intent === "promo") {
    const promoLines =
      promotions && promotions.length
        ? promotions.map((p) => `• ${p.title} (−${p.discount}%)`).join("\n")
        : "• Đang cập nhật chương trình mới";
    return {
      text: `Ưu đãi hiện có:\n${promoLines}\n\nMã nhanh: **TAPHOA10** giảm 10% cho đơn từ 100.000đ (nhập ở giỏ / thanh toán). Có thể giao hoặc đến lấy tại quầy.`,
      source: "rules",
    };
  }

  if (intent === "contact") {
    return {
      text: `**${store.name}**\n• Hotline / Zalo: **${store.phone}**\n• Email: ${store.email}\n• Địa chỉ: ${store.address}\n• Facebook: ${store.facebook}`,
      source: "rules",
    };
  }

  if (intent === "location") {
    return {
      text: `Cửa hàng tại: **${store.address}**.\nAnh/chị vào mục **Liên hệ** trên web xem bản đồ, hoặc gọi **${store.phone}** hỏi đường.`,
      source: "rules",
    };
  }

  if (intent === "howto") {
    return {
      text: `**Mua online:** chọn hàng → Thêm giỏ → Thanh toán → chờ giao hoặc chọn đến lấy.\n**Mua tại quầy:** đến ${store.address} trong giờ **${store.openHours}**, chọn hàng thanh toán luôn.\nTheo dõi đơn online: Tài khoản → Đơn hàng.`,
      source: "rules",
    };
  }

  if (intent === "return") {
    return {
      text: `Đổi trả trong **24 giờ** nếu hàng hỏng / sai / thiếu.\nGiữ hóa đơn hoặc mã đơn, liên hệ **${store.phone}** (Zalo cũng được).`,
      source: "rules",
    };
  }

  if (intent === "walkin") {
    return {
      text: `Anh/chị có thể **đến mua / lấy hàng tại quầy**:\n• Địa chỉ: **${store.address}**\n• Giờ: **${store.openHours}**\n• Không tính ship khi đến lấy\nĐặt trước trên web rồi ghé lấy cũng được ạ.`,
      source: "rules",
    };
  }

  if (intent === "catalog") {
    const catText =
      categories && categories.length
        ? categories.map((c) => `• ${c.name} (${c.count} sp)`).join("\n")
        : "• Thực phẩm, đồ uống, gia vị, bánh kẹo, đông lạnh, đồ gia dụng…";
    return {
      text: `**${store.name}** là tạp hóa / siêu thị mini — bán online + tại quầy.\nCác nhóm hàng đang có:\n${catText}\n\nAnh/chị muốn xem nhóm nào (vd: “có mì gói không?”) cứ nhắn tên nhé.`,
      source: "rules",
    };
  }

  if (intent === "featured") {
    const featured = [...products]
      .sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          b.reviewCount - a.reviewCount ||
          b.rating - a.rating
      )
      .slice(0, 5);
    return {
      text: `Mấy món đang bán chạy:\n\n${listProducts(featured)}\n\nCần loại nào cụ thể cứ nhắn tên (mì, sữa, nước, bánh…).`,
      products: featured,
      source: "rules",
    };
  }

  // product / unknown → thử tìm hàng
  const keyword = extractProductQuery(raw, normalized);
  if (keyword) {
    const found = findProducts(keyword, products, 4);
    if (found.length) {
      return {
        text: `Shop đang có liên quan **${keyword}**:\n\n${listProducts(found)}\n\nMua online thêm giỏ, hoặc đến quầy lấy trong giờ mở cửa nhé.`,
        products: found,
        source: "rules",
      };
    }
    if (intent === "product") {
      return {
        text: `Kho chưa thấy món khớp “${keyword}”. Thử tên khác, xem **Danh mục**, gọi **${store.phone}**, hoặc ghé ${store.address} hỏi trực tiếp.`,
        source: "rules",
      };
    }
  }

  return {
    text: `Anh/chị hỏi kiểu này em trả lời được ngay:\n• “Có sữa tươi không?”\n• “Phí ship bao nhiêu?”\n• “Đến lấy hàng được không?”\n• “Giờ mở cửa?”\n• “Shop bán những gì?”\n\nHoặc gọi **${store.phone}**.`,
    source: "rules",
  };
}

function isFallbackHelp(text: string) {
  return (
    text.includes("Anh/chị hỏi kiểu này") ||
    text.includes("Anh/chị có thể hỏi")
  );
}

export async function generateAiReply(input: {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
  context: AiChatContext;
}): Promise<AiChatResult> {
  const ruled = ruleBasedReply(input.message, input.context);

  // FAQ / tìm được hàng → dùng rule (đúng số liệu)
  if (!isFallbackHelp(ruled.text)) {
    return ruled;
  }

  // Câu tự do → OpenAI nếu có key
  const openaiText = await callOpenAI(
    input.message,
    input.history || [],
    input.context
  );
  if (openaiText) {
    const products = findProducts(input.message, input.context.products, 3);
    return {
      text: openaiText,
      products: products.length ? products : undefined,
      source: "openai",
    };
  }

  return ruled;
}
