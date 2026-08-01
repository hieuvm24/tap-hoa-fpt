/**
 * Mở rộng catalog lên ≥300 sản phẩm + gắn ảnh thực tế (Open Food Facts / Unsplash).
 * Không scrape Shopee (vi phạm bản quyền & ToS).
 *
 * npx tsx scripts/expand-300.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&h=600&q=80`;

type Item = {
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  categorySlug: string;
  brand: string;
  sku: string;
  stock: number;
  search?: string; // từ khóa tìm ảnh OFF
  fallback: string;
  isFeatured?: boolean;
  isPromotion?: boolean;
  specs?: Record<string, string>;
};

/** [tên SP, từ khóa OFF, giá cơ sở] */
type CatalogRow = [name: string, search: string, base: number];

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function money(base: number, i: number) {
  const price = base + (i % 7) * 1000;
  return { price, originalPrice: Math.round(price * 1.12) };
}

/** Sinh nhiều biến thể hàng tạp hóa / siêu thị mini */
function buildCatalog(): Item[] {
  const items: Item[] = [];

  const veggies = [
    ["Rau muống", "water spinach", u("photo-1622206151226-18ca2c9ab4a1")],
    ["Cải thìa", "bok choy", u("photo-1576045057995-568f588f82fb")],
    ["Cải ngọt", "greens", u("photo-1540420773420-3366772f4999")],
    ["Rau mồng tơi", "leafy greens", u("photo-1512621776951-a57141f2eefd")],
    ["Cà chua bi", "cherry tomato", u("photo-1546094096-0df4bcaaa337")],
    ["Cà chua beef", "tomato", u("photo-1546470427-e26264be0d41")],
    ["Cà rốt", "carrot", u("photo-1598170845058-32b9d6a5da37")],
    ["Khoai tây", "potato", u("photo-1518977676601-b53f82aba655")],
    ["Khoai lang", "sweet potato", u("photo-1518977676601-b53f82aba655")],
    ["Bắp cải", "cabbage", u("photo-1594282486552-05b4d80fbb9f")],
    ["Dưa leo", "cucumber", u("photo-1449300079323-02e209d9b5a0")],
    ["Bí đao", "winter melon", u("photo-1597362925123-77861d3fbac7")],
    ["Bí đỏ", "pumpkin", u("photo-1570586437263-ab629fccc818")],
    ["Cà tím", "eggplant", u("photo-1615485290382-441e4d049cb5")],
    ["Ớt hiểm", "chili", u("photo-1599909533730-b27de933e0c1")],
    ["Hành lá", "green onion", u("photo-1618375569909-3c8616cf7733")],
    ["Tỏi củ", "garlic", u("photo-1540148426945-6cf22a6b2383")],
    ["Gừng củ", "ginger", u("photo-1615485500704-8e990f9900f7")],
    ["Nấm rơm", "mushroom", u("photo-1504674900247-0877df9cc836")],
    ["Nấm đùi gà", "king oyster mushroom", u("photo-1504674900247-0877df9cc836")],
    ["Đậu que", "green beans", u("photo-1464226184884-fa280b87c399")],
    ["Bắp Mỹ", "corn", u("photo-1551754655-cd27e38d2076")],
    ["Su su", "chayote", u("photo-1597362925123-77861d3fbac7")],
    ["Măng tây", "asparagus", u("photo-1510627489930-0c1b0bfb6785")],
  ];
  veggies.forEach(([name, search, fb], i) => {
    const { price, originalPrice } = money(12000 + i * 500, i);
    items.push({
      name: `${name} tươi ${i % 2 === 0 ? "500g" : "1kg"}`,
      slug: slugify(`rau-${name}-${i}`),
      description: `${name} tươi mỗi ngày, nhập chợ đầu mối Gia Viễn.`,
      price,
      originalPrice,
      categorySlug: "rau-cu",
      brand: i % 2 === 0 ? "Đà Lạt Fresh" : "Nông trại địa phương",
      sku: `RC3${String(i).padStart(3, "0")}`,
      stock: 40 + (i % 20) * 5,
      search: String(search),
      fallback: String(fb).includes("photo-") ? String(fb) : u("photo-1540420773420-3366772f4999"),
      isFeatured: i < 4,
      specs: { "Xuất xứ": i % 2 === 0 ? "Đà Lạt" : "Ninh Bình" },
    });
  });

  const fruits = [
    ["Cam sành", "orange", u("photo-1547514701-42782101795e")],
    ["Cam Cara", "cara orange", u("photo-1582979512210-99b6a53386f0")],
    ["Chuối sứ", "banana", u("photo-1571771894821-ce9b6c11b08e")],
    ["Chuối già", "banana", u("photo-1603833665858-e61d17a86224")],
    ["Táo Fuji", "fuji apple", u("photo-1560806887-1e4cd0b6cbd6")],
    ["Táo Envy", "apple", u("photo-1570913149827-d2ac84ab3f9a")],
    ["Nho xanh", "green grape", u("photo-1537640538966-79f369143f8f")],
    ["Nho đen", "black grape", u("photo-1537640538966-79f369143f8f")],
    ["Dưa hấu", "watermelon", u("photo-1587049352846-4a222e784d38")],
    ["Dưa lưới", "cantaloupe", u("photo-1571575173700-afb9492e6ec1")],
    ["Xoài cát", "mango", u("photo-1553279768-865429fa0078")],
    ["Xoài keo", "mango", u("photo-1553279768-865429fa0078")],
    ["Ổi", "guava", u("photo-1536511132770-e413829c4f3f")],
    ["Thanh long đỏ", "dragon fruit", u("photo-1526318472351-c75fcf070305")],
    ["Thanh long trắng", "dragon fruit", u("photo-1490474418585-ba9bad8fd0ea")],
    ["Bưởi da xanh", "pomelo", u("photo-1559181567-c3190ca9959b")],
    ["Quýt đường", "tangerine", u("photo-1547514701-42782101795e")],
    ["Lê Hàn", "pear", u("photo-1490885578174-acda8905d2a9")],
    ["Dâu tây", "strawberry", u("photo-1464965911861-746a04b4b937")],
    ["Chôm chôm", "rambutan", u("photo-1619566636858-adf3ef46400b")],
    ["Nhãn", "longan", u("photo-1619566636858-adf3ef46400b")],
    ["Măng cụt", "mangosteen", u("photo-1610832958506-aa56368176cf")],
    ["Khóm / dứa", "pineapple", u("photo-1550258987-190a78bafd63")],
    ["Đu đủ", "papaya", u("photo-1517282009859-f000957d4ac3")],
  ];
  fruits.forEach(([name, search, fb], i) => {
    const { price, originalPrice } = money(25000 + i * 1500, i);
    items.push({
      name: `${name} ${i % 3 === 0 ? "1kg" : i % 3 === 1 ? "500g" : "trái"}`,
      slug: slugify(`trai-${name}-${i}`),
      description: `${name} chín tự nhiên, bán online hoặc tại quầy.`,
      price,
      originalPrice,
      categorySlug: "trai-cay",
      brand: "Import Fresh",
      sku: `TC3${String(i).padStart(3, "0")}`,
      stock: 30 + (i % 15) * 4,
      search: String(search),
      fallback: String(fb).startsWith("http") ? String(fb) : u("photo-1619566636858-adf3ef46400b"),
      isFeatured: i < 5,
      isPromotion: i % 4 === 0,
      specs: { "Xuất xứ": "Việt Nam" },
    });
  });

  const drinks: [string, string, string, number][] = [
    ["Coca Cola", "coca cola", u("photo-1554866585-cd94860890b7"), 10000],
    ["Pepsi", "pepsi", u("photo-1629203851122-3726ecdf080e"), 10000],
    ["Sprite", "sprite", u("photo-1625772299848-391b6a87d7b3"), 10000],
    ["Fanta cam", "fanta orange", u("photo-1437418747212-8d9709afab22"), 10000],
    ["7Up", "7up", u("photo-1544145945-f90425340c7e"), 10000],
    ["Sting dâu", "sting energy", u("photo-1622483767028-3f66f32aef97"), 9000],
    ["Number One", "number one drink", u("photo-1622483767028-3f66f32aef97"), 9000],
    ["Revive", "revive drink", u("photo-1621506289937-a8e4df240d0b"), 10000],
    ["Aquafina", "aquafina", u("photo-1548839140-29a749e1cf4d"), 8000],
    ["Lavie", "lavie water", u("photo-1548839140-29a749e1cf4d"), 8000],
    ["Dasani", "dasani", u("photo-1548839140-29a749e1cf4d"), 8000],
    ["Trà xanh 0 độ", "green tea drink", u("photo-1556679343-c7306c1976bc"), 10000],
    ["C2", "c2 tea", u("photo-1556679343-c7306c1976bc"), 9000],
    ["Trà Atiso", "tea drink", u("photo-1576092768241-dec231879fc3"), 10000],
    ["Twister cam", "orange juice", u("photo-1621506289937-a8e4df240d0b"), 12000],
    ["Vinamilk cacao", "cacao drink", u("photo-1517487881594-2787fef5ebf7"), 12000],
    ["Highlands lon", "coffee can", u("photo-1514432324607-a09d9b4aefdd"), 15000],
    ["Nescafe lon", "nescafe", u("photo-1495474472287-4d71bcdd2085"), 15000],
    ["Heineken", "heineken", u("photo-1608270586620-248524c67de9"), 18000],
    ["Tiger", "tiger beer", u("photo-1618885472179-5e474019f2a9"), 16000],
    ["Sài Gòn Special", "saigon beer", u("photo-1618885472179-5e474019f2a9"), 12000],
    ["333", "333 beer", u("photo-1608270586620-248524c67de9"), 11000],
    ["Red Bull", "red bull", u("photo-1622483767028-3f66f32aef97"), 15000],
    ["Mirinda", "mirinda", u("photo-1544145945-f90425340c7e"), 10000],
  ];
  const sizes = ["330ml", "500ml", "1.5L"];
  drinks.forEach(([name, search, fb, base], i) => {
    const size = sizes[i % sizes.length];
    const { price, originalPrice } = money(base + (size === "1.5L" ? 6000 : 0), i);
    items.push({
      name: `${name} ${size}`,
      slug: slugify(`uong-${name}-${size}-${i}`),
      description: `${name} ${size}, mát lạnh tại quầy hoặc giao tận nhà.`,
      price,
      originalPrice,
      categorySlug: "do-uong",
      brand: name.split(" ")[0],
      sku: `DU3${String(i).padStart(3, "0")}`,
      stock: 80 + (i % 10) * 10,
      search: `${search} ${size}`,
      fallback: fb,
      isFeatured: i < 6,
      specs: { "Dung tích": size },
    });
  });

  const noodles: CatalogRow[] = [
    ["Hảo Hảo tôm chua cay", "hao hao", 4500],
    ["Hảo Hảo sa tế hành", "hao hao", 4500],
    ["Omachi bò hầm", "omachi", 8000],
    ["Omachi sườn hầm", "omachi", 8000],
    ["Kokomi tôm", "kokomi", 4000],
    ["3 Miền Gold", "3 mien", 5000],
    ["Gấu Đỏ", "gau do noodle", 4500],
    ["Lẩu Thái", "lau thai noodle", 7000],
    ["Phở Đệ Nhất", "pho de nhat", 9000],
    ["Phở Cung Đình", "pho cung dinh", 9000],
    ["Hủ tiếu Vifon", "hu tieu vifon", 10000],
    ["Cháo Vifon", "chao vifon", 8000],
    ["Mì ly Handy", "handy noodle", 9000],
    ["Mì ly Omachi", "omachi cup", 12000],
    ["Miến Phú Hương", "mien phu huong", 7000],
    ["Bún tươi ăn liền", "bun an lien", 8000],
  ];
  noodles.forEach(([name, search, base], i) => {
    const { price, originalPrice } = money(base, i);
    items.push({
      name: String(name),
      slug: slugify(`mi-${name}-${i}`),
      description: `${name} — hàng ăn liền bán chạy ở tiệm.`,
      price,
      originalPrice,
      categorySlug: "mi-goi",
      brand: name.split(" ")[0],
      sku: `MG3${String(i).padStart(3, "0")}`,
      stock: 100 + i * 8,
      search: String(search),
      fallback: u("photo-1612929633738-8fe44f7ec841"),
      isFeatured: i < 5,
      isPromotion: i % 3 === 0,
      specs: { "Loại": "Ăn liền" },
    });
  });

  const milks: CatalogRow[] = [
    ["Vinamilk không đường 1L", "vinamilk", 32000],
    ["Vinamilk có đường 1L", "vinamilk", 32000],
    ["TH True Milk 1L", "th true milk", 36000],
    ["Dutch Lady 1L", "dutch lady", 30000],
    ["Fami nguyên chất", "fami", 7000],
    ["Fami Canxi", "fami canxi", 8000],
    ["Ông Thọ đỏ", "ong tho", 28000],
    ["Ngôi Sao Phương Nam", "ngoi sao phuong nam", 26000],
    ["Sữa chua ăn Vinamilk", "vinamilk yogurt", 16000],
    ["Probi uống", "probi", 18000],
    ["Yakult", "yakult", 20000],
    ["Milo hộp", "milo", 12000],
    ["Ovaltine", "ovaltine", 14000],
    ["Ensure Gold", "ensure", 385000],
    ["Grow Plus+", "grow plus", 320000],
    ["Con Bò Cười", "laughing cow", 42000],
  ];
  milks.forEach(([name, search, base], i) => {
    const { price, originalPrice } = money(base, i);
    items.push({
      name: String(name),
      slug: slugify(`sua-${name}-${i}`),
      description: `${name} — dùng hàng ngày, có tại quầy.`,
      price,
      originalPrice,
      categorySlug: "sua",
      brand: name.split(" ")[0],
      sku: `SU3${String(i).padStart(3, "0")}`,
      stock: 50 + i * 5,
      search: String(search),
      fallback: u("photo-1563636619-e9143da7973b"),
      isFeatured: i < 4,
      specs: { "Loại": "Sữa / đồ uống từ sữa" },
    });
  });

  const spices: CatalogRow[] = [
    ["Nước mắm Nam Ngư", "nam ngu", 42000],
    ["Nước mắm Chinsu", "chinsu fish sauce", 38000],
    ["Nước tương Maggi", "maggi soy", 28000],
    ["Tương ớt Cholimex", "cholimex chili", 16000],
    ["Tương cà Cholimex", "cholimex ketchup", 15000],
    ["Dầu Neptune", "neptune oil", 45000],
    ["Dầu Simply", "simply oil", 52000],
    ["Đường Biên Hòa", "bien hoa sugar", 28000],
    ["Muối Visaco", "iodized salt", 6000],
    ["Hạt nêm Knorr", "knorr", 35000],
    ["Bột ngọt Ajinomoto", "ajinomoto", 32000],
    ["Bột canh Vedan", "vedan", 18000],
    ["Giấm gạo", "rice vinegar", 15000],
    ["Mayonnaise Aji", "mayonnaise", 32000],
    ["Tương đen", "black bean sauce", 22000],
    ["Dầu hào", "oyster sauce", 28000],
    ["Gạo ST25 5kg", "rice", 145000],
    ["Gạo Jasmine 5kg", "jasmine rice", 130000],
    ["Gạo tám xoan 5kg", "rice", 120000],
    ["Mì chính hạt", "msg", 25000],
  ];
  spices.forEach(([name, search, base], i) => {
    const { price, originalPrice } = money(base, i);
    items.push({
      name: name,
      slug: slugify(`gv-${name}-${i}`),
      description: `${name} — gia vị / lương thực thiết yếu.`,
      price,
      originalPrice,
      categorySlug: "gia-vi",
      brand: name.split(" ")[0],
      sku: `GV3${String(i).padStart(3, "0")}`,
      stock: 60 + i * 3,
      search: String(search),
      fallback: name.includes("Gạo")
        ? u("photo-1586201375761-83865001e31c")
        : u("photo-1596040033229-a9821ebd058d"),
      isFeatured: i < 4,
      isPromotion: i % 5 === 0,
    });
  });

  const snacks: CatalogRow[] = [
    ["Oreo", "oreo", 22000],
    ["Cosy", "cosy biscuit", 28000],
    ["AFC", "afc biscuit", 25000],
    ["Pocky", "pocky", 18000],
    ["Choco Pie", "choco pie", 48000],
    ["Oishi", "oishi snack", 6000],
    ["Swing", "swing snack", 8000],
    ["Slide", "slide potato", 10000],
    ["Alpenliebe", "alpenliebe", 18000],
    ["Mentos", "mentos", 12000],
    ["Cool Air", "chewing gum", 10000],
    ["Want Want", "want want", 22000],
    ["KitKat", "kitkat", 16000],
    ["Snickers", "snickers", 18000],
    ["Kẹo dẻo", "gummy candy", 15000],
    ["Bánh gạo", "rice cracker", 20000],
  ];
  snacks.forEach(([name, search, base], i) => {
    const { price, originalPrice } = money(base, i);
    items.push({
      name: String(name),
      slug: slugify(`bk-${name}-${i}`),
      description: `${name} — ăn vặt bán chạy.`,
      price,
      originalPrice,
      categorySlug: "banh-keo",
      brand: name,
      sku: `BK3${String(i).padStart(3, "0")}`,
      stock: 90 + i * 4,
      search: String(search),
      fallback: u("photo-1558961363-fa8fdf86f2cf"),
      isFeatured: i < 4,
    });
  });

  const frozen: CatalogRow[] = [
    ["Xúc xích CP", "sausage", 55000],
    ["Há cảo CP", "dumpling", 62000],
    ["Chả giò", "spring roll", 52000],
    ["Cá viên", "fish ball", 48000],
    ["Bò viên", "meatball", 58000],
    ["Tôm sú đông lạnh", "shrimp", 120000],
    ["Cá basa phi lê", "basa fish", 75000],
    ["Khoai tây chiên", "french fries", 45000],
    ["Kem Merino", "ice cream", 12000],
    ["Kem Celano", "ice cream", 15000],
    ["Chả cá", "fish cake", 40000],
    ["Thịt viên", "meatball", 50000],
  ];
  frozen.forEach(([name, search, base], i) => {
    const { price, originalPrice } = money(base, i);
    items.push({
      name: `${name} đông lạnh`,
      slug: slugify(`dl-${name}-${i}`),
      description: `${name} bảo quản lạnh, giao nhanh trong ngày.`,
      price,
      originalPrice,
      categorySlug: "dong-lanh",
      brand: "CP",
      sku: `DL3${String(i).padStart(3, "0")}`,
      stock: 40 + i * 3,
      search: String(search),
      fallback: u("photo-1626804475297-41608ea09aeb"),
      isFeatured: i < 3,
    });
  });

  const household: CatalogRow[] = [
    ["OMO", "omo detergent", 95000],
    ["Ariel", "ariel detergent", 98000],
    ["Comfort", "comfort softener", 135000],
    ["Downy", "downy", 140000],
    ["Sunlight rửa chén", "sunlight", 28000],
    ["Gift lau sàn", "floor cleaner", 32000],
    ["Vim toilet", "vim", 35000],
    ["Pulppy", "toilet paper", 48000],
    ["Bless You", "tissue", 35000],
    ["Túi rác", "garbage bag", 25000],
    ["Pin AA", "aa battery", 18000],
    ["Pin AAA", "aaa battery", 16000],
    ["Bóng LED 5W", "led bulb", 28000],
    ["Bóng LED 9W", "led bulb", 35000],
    ["Nước tẩy Javel", "bleach", 22000],
    ["Khăn giấy ướt", "wet wipe", 28000],
  ];
  household.forEach(([name, search, base], i) => {
    const { price, originalPrice } = money(base, i);
    items.push({
      name: String(name),
      slug: slugify(`gd-${name}-${i}`),
      description: `${name} — đồ dùng nhà cửa bán tại tạp hóa.`,
      price,
      originalPrice,
      categorySlug: "do-gia-dung",
      brand: name.split(" ")[0],
      sku: `GD3${String(i).padStart(3, "0")}`,
      stock: 45 + i * 2,
      search: String(search),
      fallback: u("photo-1583947215259-38e31be8751f"),
      isFeatured: i < 3,
    });
  });

  const personal: CatalogRow[] = [
    ["Head & Shoulders", "head shoulders shampoo", 65000],
    ["Clear Men", "clear shampoo", 72000],
    ["Pantene", "pantene", 78000],
    ["Sunsilk", "sunsilk", 68000],
    ["Lifebuoy tắm", "lifebuoy", 78000],
    ["Dove tắm", "dove body wash", 85000],
    ["P/S", "ps toothpaste", 32000],
    ["Colgate", "colgate", 35000],
    ["Oral-B", "oral b toothbrush", 25000],
    ["Closeup", "closeup", 30000],
    ["Xà bông Lifebuoy", "lifebuoy soap", 12000],
    ["Xà bông Safeguard", "safeguard", 14000],
    ["Khăn ướt Lepapé", "baby wipe", 28000],
    ["Bông tần", "cotton pad", 22000],
    ["Dầu gió", "medicated oil", 25000],
    ["Băng keo cá nhân", "band aid", 15000],
  ];
  personal.forEach(([name, search, base], i) => {
    const { price, originalPrice } = money(base, i);
    items.push({
      name: String(name),
      slug: slugify(`cn-${name}-${i}`),
      description: `${name} — chăm sóc cá nhân dùng hàng ngày.`,
      price,
      originalPrice,
      categorySlug: "cham-soc-ca-nhan",
      brand: name.split(" ")[0],
      sku: `CN3${String(i).padStart(3, "0")}`,
      stock: 50 + i * 2,
      search: String(search),
      fallback: u("photo-1556228578-0d85b1a4d571"),
      isFeatured: i < 3,
    });
  });

  return items;
}

const offCache = new Map<string, string | null>();

async function fetchOffImage(query: string): Promise<string | null> {
  const key = query.toLowerCase().trim();
  if (offCache.has(key)) return offCache.get(key)!;
  try {
    const url =
      "https://world.openfoodfacts.org/cgi/search.pl?" +
      new URLSearchParams({
        search_terms: query,
        search_simple: "1",
        action: "process",
        json: "1",
        page_size: "6",
      });
    const res = await fetch(url, {
      headers: {
        "User-Agent": "TapHoaFPT/1.0 (graduation thesis; contact: vuminhhieunp@mail.com)",
      },
    });
    if (!res.ok) {
      offCache.set(key, null);
      return null;
    }
    const data = (await res.json()) as {
      products?: { image_front_url?: string; image_url?: string; product_name?: string }[];
    };
    const hit = data.products?.find((p) => p.image_front_url || p.image_url);
    const img = hit?.image_front_url || hit?.image_url || null;
    offCache.set(key, img);
    return img;
  } catch {
    offCache.set(key, null);
    return null;
  }
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log("Expand catalog to 300+ with real-ish product images...");
  console.log("NOTE: Không lấy ảnh Shopee (bản quyền). Dùng Open Food Facts + Unsplash.");

  // Categories
  const neededCats = [
    { name: "Đồ gia dụng", slug: "do-gia-dung", icon: "Home" },
    { name: "Chăm sóc cá nhân", slug: "cham-soc-ca-nhan", icon: "Sparkles" },
  ];
  for (const c of neededCats) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  const cats = await prisma.category.findMany();
  const catMap = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  const existing = await prisma.product.findMany({ select: { slug: true, sku: true } });
  const slugSet = new Set(existing.map((p) => p.slug));
  const skuSet = new Set(existing.map((p) => p.sku));

  const catalog = buildCatalog();
  let added = 0;
  let offHits = 0;

  for (const p of catalog) {
    if (slugSet.has(p.slug) || skuSet.has(p.sku)) continue;
    if (!catMap[p.categorySlug]) continue;

    // Ưu tiên ảnh Open Food Facts cho hàng đóng gói
    let image = p.fallback;
    const useOff = !["rau-cu", "trai-cay"].includes(p.categorySlug);
    if (useOff && p.search) {
      const off = await fetchOffImage(p.search);
      await sleep(220);
      if (off) {
        image = off;
        offHits++;
      }
    }

    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        image,
        images: JSON.stringify([image]),
        brand: p.brand,
        sku: p.sku,
        stock: p.stock,
        rating: 0,
        reviewCount: 0,
        soldCount: 0,
        status: "ACTIVE",
        isFeatured: p.isFeatured ?? false,
        isPromotion: p.isPromotion ?? false,
        specs: JSON.stringify(p.specs || {}),
        categoryId: catMap[p.categorySlug],
      },
    });
    slugSet.add(p.slug);
    skuSet.add(p.sku);
    added++;
    if (added % 20 === 0) console.log(`+${added} products (OFF images: ${offHits})`);
  }

  // Nếu vẫn < 300: nhân bản biến thể size/vị nhẹ
  let total = await prisma.product.count();
  let extra = 0;
  if (total < 300) {
    const base = await prisma.product.findMany({
      take: 80,
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });
    let n = 0;
    while (total + extra < 300 && n < 200) {
      const src = base[n % base.length];
      const slug = `${src.slug}-v${n + 1}`;
      const sku = `${src.sku}V${n + 1}`;
      if (slugSet.has(slug) || skuSet.has(sku)) {
        n++;
        continue;
      }
      const suffixes = ["gói nhỏ", "gói lớn", "combo 2", "siêu tiết kiệm", "hàng ngày"];
      const suffix = suffixes[n % suffixes.length];
      await prisma.product.create({
        data: {
          name: `${src.name} (${suffix})`,
          slug,
          description: `${src.description} Phiên bản ${suffix}.`,
          price: Math.round(src.price * (1 + (n % 5) * 0.05)),
          originalPrice: Math.round(src.originalPrice * (1 + (n % 5) * 0.05)),
          image: src.image,
          images: src.images,
          brand: src.brand,
          sku,
          stock: 30 + (n % 40),
          rating: 0,
          reviewCount: 0,
          soldCount: 0,
          status: "ACTIVE",
          isFeatured: false,
          isPromotion: n % 4 === 0,
          specs: src.specs,
          categoryId: src.categoryId,
        },
      });
      slugSet.add(slug);
      skuSet.add(sku);
      extra++;
      n++;
    }
  }

  total = await prisma.product.count();
  console.log(
    JSON.stringify(
      {
        addedNew: added,
        variantExtra: extra,
        openFoodFactsImages: offHits,
        totalProducts: total,
        tip: "Ảnh đóng gói lấy từ Open Food Facts (mở). Không scrape Shopee.",
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
