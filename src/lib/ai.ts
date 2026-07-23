import { formatPrice } from "@/lib/utils";
import { searchProductsByKeyword } from "@/lib/recommendations";
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
  };
  products: Product[];
  promotions?: { title: string; discount: number }[];
}

export interface AiChatResult {
  text: string;
  products?: Product[];
  source: "openai" | "rules";
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function buildSystemPrompt(ctx: AiChatContext): string {
  const catalog = ctx.products
    .slice(0, 40)
    .map(
      (p) =>
        `- ${p.name} | ${formatPrice(p.price)} | ${p.category} | còn ${p.stock}`
    )
    .join("\n");
  const promos =
    ctx.promotions?.map((p) => `- ${p.title} (-${p.discount}%)`).join("\n") ||
    "- ANPHU10 giảm 10%";

  return `Bạn là trợ lý AI của cửa hàng tạp hóa "${ctx.store.name}".
Trả lời bằng tiếng Việt, ngắn gọn, thân thiện, dùng markdown nhẹ.
Thông tin cửa hàng:
- Địa chỉ: ${ctx.store.address}
- Hotline: ${ctx.store.phone}
- Zalo: ${ctx.store.zalo}
- Giờ mở cửa: ${ctx.store.openHours}
- Email: ${ctx.store.email}
Chính sách: freeship từ 200.000đ, phí ship 15.000đ, giao 2-4 giờ, COD / chuyển khoản / VNPay.
Khuyến mãi:
${promos}
Catalog (một phần):
${catalog}
Nếu khách hỏi sản phẩm, gợi ý tối đa 3 món phù hợp từ catalog.`;
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
        temperature: 0.4,
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

function ruleBasedReply(message: string, ctx: AiChatContext): AiChatResult {
  const { store, products } = ctx;
  const normalized = message.toLowerCase().trim();

  const rules: { keys: string[]; text: string }[] = [
    {
      keys: ["xin chào", "hello", "hi", "chào"],
      text: `Xin chào! Em là trợ lý AI của **${store.name}**. Em có thể tư vấn sản phẩm, phí ship, khuyến mãi và thanh toán VNPay.`,
    },
    {
      keys: ["giờ mở", "mở cửa", "mấy giờ"],
      text: `🕐 **Giờ mở cửa:** ${store.openHours}\nĐặt online bất cứ lúc nào, shop xử lý trong giờ mở cửa.`,
    },
    {
      keys: ["ship", "giao hàng", "phí giao", "freeship"],
      text: `🚚 **Giao hàng:**\n• Nội thị ~2 giờ, vùng ven ~4 giờ\n• Freeship từ **200.000đ**\n• Phí thường: **15.000đ**`,
    },
    {
      keys: ["thanh toán", "cod", "vnpay", "chuyển khoản"],
      text: `💳 **Thanh toán:**\n• COD khi nhận hàng\n• Chuyển khoản ngân hàng\n• **VNPay** (thẻ/QR/ứng dụng ngân hàng)`,
    },
    {
      keys: ["khuyến mãi", "voucher", "giảm giá", "ưu đãi"],
      text: `🎁 Dùng mã **ANPHU10** giảm 10%. Xem thêm mục Khuyến mãi trên menu.`,
    },
    {
      keys: ["liên hệ", "hotline", "zalo", "địa chỉ"],
      text: `📞 **${store.name}**\n• Hotline: **${store.phone}**\n• Zalo: **${store.zalo}**\n• Địa chỉ: ${store.address}`,
    },
    {
      keys: ["bản đồ", "map", "đường đi", "chỉ đường"],
      text: `📍 Cửa hàng tại: **${store.address}**\nXem bản đồ Google Maps tại trang **Liên hệ**.`,
    },
  ];

  for (const rule of rules) {
    if (rule.keys.some((k) => normalized.includes(k))) {
      return { text: rule.text, source: "rules" };
    }
  }

  const patterns = [
    /(?:có|bán|mua|tìm|gợi ý|xem)\s+(.+)/i,
    /(?:sản phẩm|món|hàng)\s+(.+)/i,
  ];
  let keyword: string | null = null;
  for (const p of patterns) {
    const m = message.match(p);
    if (m?.[1]) {
      keyword = m[1].trim();
      break;
    }
  }
  if (!keyword) {
    const cats = ["rau", "củ", "trái cây", "sữa", "mì", "nước", "gia vị", "bánh", "đông lạnh"];
    keyword = cats.find((c) => normalized.includes(c)) || null;
  }

  if (keyword) {
    const found = searchProductsByKeyword(keyword, products, 3);
    if (found.length) {
      const list = found
        .map((p) => `• **${p.name}** — ${formatPrice(p.price)}`)
        .join("\n");
      return {
        text: `Em gợi ý ${found.length} sản phẩm cho "${keyword}":\n\n${list}`,
        products: found,
        source: "rules",
      };
    }
    return {
      text: `Em chưa thấy "${keyword}" trong kho. Anh/chị thử **Danh mục** hoặc gọi **${store.phone}**.`,
      source: "rules",
    };
  }

  return {
    text: `Em chưa hiểu rõ ạ. Anh/chị có thể hỏi giờ mở cửa, phí ship, VNPay, hoặc gõ *"có sữa gì"*, *"tìm rau muống"*.`,
    source: "rules",
  };
}

export async function generateAiReply(input: {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
  context: AiChatContext;
}): Promise<AiChatResult> {
  const openaiText = await callOpenAI(
    input.message,
    input.history || [],
    input.context
  );
  if (openaiText) {
    const products = searchProductsByKeyword(input.message, input.context.products, 3);
    return {
      text: openaiText,
      products: products.length ? products : undefined,
      source: "openai",
    };
  }
  return ruleBasedReply(input.message, input.context);
}
