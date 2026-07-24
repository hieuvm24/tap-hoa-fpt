import { formatPrice } from "@/lib/utils";
import { searchProductsByKeyword } from "@/lib/recommendations";
import { FREE_SHIP_THRESHOLD, SHIPPING_FEE } from "@/config/defaults";
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
    .slice(0, 60)
    .map(
      (p) =>
        `- ${p.name} | giá ${formatPrice(p.price)} | danh mục ${p.category} | tồn ${p.stock} | đánh giá ${p.rating}/5`
    )
    .join("\n");
  const promos =
    ctx.promotions?.map((p) => `- ${p.title} (giảm ${p.discount}%)`).join("\n") ||
    "- Mã ANPHU10 giảm 10% đơn hàng";

  return `Bạn là nhân viên tư vấn online của cửa hàng "${ctx.store.name}".
Nói chuyện tự nhiên như người bán hàng thật, tiếng Việt, ngắn gọn, lịch sự. Có thể dùng markdown nhẹ (in đậm).

Thông tin cửa hàng:
- Địa chỉ: ${ctx.store.address}
- Điện thoại / hotline: ${ctx.store.phone}
- Zalo: ${ctx.store.zalo}
- Facebook: ${ctx.store.facebook}
- Email: ${ctx.store.email}
- Giờ mở cửa: ${ctx.store.openHours}

Chính sách:
- Phí ship ${formatPrice(SHIPPING_FEE)}, miễn phí ship từ đơn ${formatPrice(FREE_SHIP_THRESHOLD)}
- Giao nội thị khoảng 2 giờ, vùng ven 3-4 giờ (trong giờ mở cửa)
- Thanh toán: COD, chuyển khoản, VNPay
- Đổi trả trong 24h nếu hàng lỗi / không đúng mô tả
- Đặt hàng: thêm vào giỏ → thanh toán trên website

Khuyến mãi đang chạy:
${promos}

Sản phẩm đang bán (tham khảo):
${catalog}

Quy tắc trả lời:
1. Hỏi giá / còn hàng / gợi ý món → dựa vào danh sách sản phẩm ở trên, nêu tên + giá cụ thể.
2. Không bịa sản phẩm không có trong danh sách.
3. Nếu không chắc, hướng khách gọi ${ctx.store.phone} hoặc xem mục Danh mục trên web.
4. Trả lời đúng trọng tâm câu hỏi, tối đa khoảng 8-10 dòng.`;
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
        temperature: 0.35,
        messages: [
          { role: "system", content: buildSystemPrompt(ctx) },
          ...history.slice(-10),
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

function normalizeVi(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function findProducts(query: string, products: Product[], limit = 4): Product[] {
  const found = searchProductsByKeyword(query, products, limit);
  if (found.length) return found;

  const q = normalizeVi(query);
  const scored = products
    .map((p) => {
      const hay = normalizeVi(`${p.name} ${p.brand} ${p.category} ${p.description}`);
      let score = 0;
      for (const token of q.split(/\s+/).filter(Boolean)) {
        if (hay.includes(token)) score += token.length > 2 ? 2 : 1;
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

function ruleBasedReply(message: string, ctx: AiChatContext): AiChatResult {
  const { store, products, promotions } = ctx;
  const raw = message.trim();
  const normalized = normalizeVi(raw);

  if (/(xin chao|chao shop|hello|hi\b|chào)/i.test(raw) || normalized === "chao") {
    return {
      text: `Chào anh/chị, mình hỗ trợ đặt hàng giúp **${store.name}** ạ.\nAnh/chị cần tìm món gì, hỏi phí ship, giờ mở cửa hay cách thanh toán cứ nhắn mình nhé.`,
      source: "rules",
    };
  }

  if (/(gio mo|mo cua|may gio mo|giờ mở)/i.test(raw) || normalized.includes("gio mo")) {
    return {
      text: `Shop mở cửa **${store.openHours}**.\nĐặt online được mọi lúc; đơn ngoài giờ sẽ xử lý vào ca làm việc tiếp theo.`,
      source: "rules",
    };
  }

  if (/(ship|giao hang|phi giao|freeship|miễn phí ship)/i.test(raw)) {
    return {
      text: `Về giao hàng:\n• Phí ship **${formatPrice(SHIPPING_FEE)}**\n• **Freeship** từ đơn **${formatPrice(FREE_SHIP_THRESHOLD)}**\n• Nội thị khoảng 2 giờ, vùng ven 3–4 giờ (trong giờ mở cửa)\nĐịa chỉ giao lấy theo sổ địa chỉ khi thanh toán.`,
      source: "rules",
    };
  }

  if (/(thanh toan|cod|vnpay|chuyen khoan|qr)/i.test(raw)) {
    return {
      text: `Shop nhận 3 hình thức:\n1. **COD** — trả tiền khi nhận hàng\n2. **Chuyển khoản** — thông tin TK hiện ở bước thanh toán\n3. **VNPay** — quét QR / app ngân hàng\nAnh/chị chọn lúc vào trang Thanh toán là được.`,
      source: "rules",
    };
  }

  if (/(khuyen mai|voucher|giam gia|ma giam|uu dai)/i.test(raw)) {
    const promoLines =
      promotions && promotions.length
        ? promotions.map((p) => `• ${p.title} (−${p.discount}%)`).join("\n")
        : "• Đang cập nhật chương trình mới";
    return {
      text: `Ưu đãi hiện có:\n${promoLines}\n\nMã nhanh: **ANPHU10** giảm 10% (nhập ở giỏ hàng / thanh toán).`,
      source: "rules",
    };
  }

  if (/(lien he|hotline|zalo|dia chi|so dien thoai|sdt)/i.test(raw)) {
    return {
      text: `**${store.name}**\n• Hotline: **${store.phone}**\n• Zalo: **${store.zalo}**\n• Email: ${store.email}\n• Địa chỉ: ${store.address}`,
      source: "rules",
    };
  }

  if (/(ban do|chi duong|duong di|o dau|map)/i.test(raw)) {
    return {
      text: `Cửa hàng tại: **${store.address}**\nAnh/chị vào mục **Liên hệ** trên web để xem bản đồ.`,
      source: "rules",
    };
  }

  if (/(dat hang|mua the nao|cach mua|huong dan dat)/i.test(raw)) {
    return {
      text: `Cách đặt hàng nhanh:\n1. Chọn sản phẩm → **Thêm giỏ**\n2. Vào **Giỏ hàng** kiểm tra số lượng\n3. Bấm **Thanh toán**, điền địa chỉ\n4. Chọn COD / CK / VNPay → xác nhận\nCó tài khoản thì theo dõi đơn trong mục **Tài khoản → Đơn hàng**.`,
      source: "rules",
    };
  }

  if (/(doi tra|hoan tien|hang loi)/i.test(raw)) {
    return {
      text: `Đổi trả trong **24 giờ** nếu hàng hỏng, sai mẫu hoặc thiếu món.\nGiữ hóa đơn / mã đơn và liên hệ **${store.phone}** hoặc Zalo **${store.zalo}** để được hỗ trợ.`,
      source: "rules",
    };
  }

  // Bán chạy / gợi ý chung — ưu tiên trước khi tách từ khóa
  if (
    /(ban chay|noi bat|goi y mon|goi y mua|nen mua gi|hom nay mua gi|goi y\??$)/i.test(
      normalized
    ) ||
    /(gợi ý món|bán chạy|nên mua gì)/i.test(raw)
  ) {
    const featured = [...products]
      .sort(
        (a, b) =>
          Number(b.isFeatured) - Number(a.isFeatured) ||
          b.reviewCount - a.reviewCount ||
          b.rating - a.rating
      )
      .slice(0, 5);
    return {
      text: `Mấy món đang bán chạy ở shop:\n\n${listProducts(featured)}\n\nAnh/chị muốn tìm loại nào cụ thể (mì, sữa, nước…) cứ nhắn tên nhé.`,
      products: featured,
      source: "rules",
    };
  }

  // Hỏi giá / còn hàng theo tên sản phẩm
  const priceMatch = raw.match(/(?:giá|bao nhiêu|còn không|còn hàng|có bán)\s+(.+)/i);
  const buyMatch = raw.match(/(?:có|bán|mua|tìm|gợi ý|xem|cần)\s+(.+)/i);
  let keyword =
    priceMatch?.[1]?.trim() ||
    buyMatch?.[1]?.trim() ||
    null;

  if (keyword) {
    keyword = keyword.replace(/[?.!]+$/g, "").trim();
  }

  if (!keyword) {
    const cats = [
      "rau",
      "cu",
      "trai cay",
      "sua",
      "mi",
      "nuoc",
      "gia vi",
      "banh",
      "keo",
      "dong lanh",
      "cafe",
      "ca phe",
      "gao",
      "tom",
      "thit",
      "trung",
      "dau",
    ];
    keyword = cats.find((c) => normalized.includes(c)) || null;
  }

  // Câu chỉ gồm tên món: "sữa tươi", "mì hảo hảo"
  if (!keyword && raw.length >= 2 && raw.length <= 40) {
    const guess = findProducts(raw, products, 3);
    if (guess.length) keyword = raw;
  }

  if (keyword) {
    const found = findProducts(keyword, products, 4);
    if (found.length) {
      return {
        text: `Shop đang có mấy món liên quan **${keyword}**:\n\n${listProducts(found)}\n\nAnh/chị bấm vào sản phẩm để xem chi tiết hoặc thêm giỏ hàng nhé.`,
        products: found,
        source: "rules",
      };
    }
    return {
      text: `Kho chưa thấy món khớp “${keyword}”. Anh/chị thử tên khác, vào **Danh mục**, hoặc gọi **${store.phone}** hỏi trực tiếp.`,
      source: "rules",
    };
  }

  return {
    text: `Anh/chị hỏi mình kiểu này là được ạ:\n• “Có sữa tươi không?”\n• “Phí ship bao nhiêu?”\n• “Giờ mở cửa?”\n• “Thanh toán VNPay thế nào?”\n• “Gợi ý mì gói”\n\nHoặc gọi **${store.phone}**.`,
    source: "rules",
  };
}

export async function generateAiReply(input: {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
  context: AiChatContext;
}): Promise<AiChatResult> {
  // Ưu tiên rule khi đã khớp FAQ / tìm được sản phẩm — trả lời đúng số liệu cửa hàng
  const ruled = ruleBasedReply(input.message, input.context);
  const isGenericHelp =
    ruled.text.includes("Anh/chị hỏi mình kiểu này") ||
    ruled.text.includes("Anh/chị có thể hỏi");

  if (!isGenericHelp) {
    return ruled;
  }

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
