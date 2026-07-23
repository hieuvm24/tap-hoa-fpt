import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createWriteStream } from "fs";
import { copyFile, mkdir, access } from "fs/promises";
import path from "path";
import { pipeline } from "stream/promises";
import { Readable } from "stream";

const prisma = new PrismaClient();

const IMG = {
  rau: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=600&fit=crop",
  traiCay: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=600&h=600&fit=crop",
  doUong: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=600&h=600&fit=crop",
  giaVi: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&h=600&fit=crop",
  banhKeo: "https://images.unsplash.com/photo-1481391319762-47dfffb64917?w=600&h=600&fit=crop",
  dongLanh: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=600&h=600&fit=crop",
  miGoi: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=600&fit=crop",
  sua: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&h=600&fit=crop",
  // Ảnh chuyên biệt hơn theo loại
  rauCai: "https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=600&h=600&fit=crop",
  caRot: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&h=600&fit=crop",
  khoai: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&h=600&fit=crop",
  duaLeo: "https://images.unsplash.com/photo-1449300079323-02e209d9b5a0?w=600&h=600&fit=crop",
  cam: "https://images.unsplash.com/photo-1547514701-42782101795e?w=600&h=600&fit=crop",
  chuoi: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&h=600&fit=crop",
  tao: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&h=600&fit=crop",
  nho: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&h=600&fit=crop",
  duaHau: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=600&fit=crop",
  xoai: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&h=600&fit=crop",
  coca: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&h=600&fit=crop",
  cafe: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&h=600&fit=crop",
  nuocMam: "https://images.unsplash.com/photo-1472476443507-2f0b6849e5b0?w=600&h=600&fit=crop",
  dauAn: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=600&fit=crop",
  banh: "https://images.unsplash.com/photo-1558961363-fa8fdf86f2cf?w=600&h=600&fit=crop",
  keo: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&h=600&fit=crop",
  snack: "https://images.unsplash.com/photo-1621939514649-cdc8f2555400?w=600&h=600&fit=crop",
  xucXich: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&h=600&fit=crop",
  mi: "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=600&h=600&fit=crop",
  suaHop: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&h=600&fit=crop",
  suaChua: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=600&fit=crop",
  avatar1: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  avatar2: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  avatar3: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  avatar4: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  avatar5: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
  avatar6: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
};

type NewProduct = {
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  categorySlug: string;
  brand: string;
  sku: string;
  stock: number;
  imageKey: keyof typeof IMG;
  isFeatured?: boolean;
  isPromotion?: boolean;
  specs: Record<string, string>;
};

const NEW_PRODUCTS: NewProduct[] = [
  { name: "Rau cải ngọt hữu cơ", slug: "rau-cai-ngot-huu-co", description: "Cải ngọt xanh mướt, trồng hữu cơ.", price: 14000, originalPrice: 18000, categorySlug: "rau-cu", brand: "Đà Lạt Fresh", sku: "RC101", stock: 120, imageKey: "rauCai", specs: { "Xuất xứ": "Đà Lạt" } },
  { name: "Củ cải trắng 500g", slug: "cu-cai-trang-500g", description: "Củ cải trắng giòn, dùng nấu canh.", price: 12000, originalPrice: 15000, categorySlug: "rau-cu", brand: "Nông trại địa phương", sku: "RC102", stock: 90, imageKey: "rau", specs: { "Trọng lượng": "500g" } },
  { name: "Bí đỏ Nhật 1kg", slug: "bi-do-nhat-1kg", description: "Bí đỏ ngọt, thích hợp nấu chè/soup.", price: 30000, originalPrice: 36000, categorySlug: "rau-cu", brand: "Đà Lạt Fresh", sku: "RC103", stock: 70, imageKey: "khoai", isFeatured: true, specs: { "Trọng lượng": "1kg" } },
  { name: "Ớt chuông Đà Lạt", slug: "ot-chuong-da-lat", description: "Ớt chuông đỏ vàng giòn ngọt.", price: 45000, originalPrice: 55000, categorySlug: "rau-cu", brand: "Đà Lạt Fresh", sku: "RC104", stock: 60, imageKey: "caRot", isPromotion: true, specs: { "Trọng lượng": "500g" } },
  { name: "Nấm bào ngư xám 300g", slug: "nam-bao-ngu-xam", description: "Nấm bào ngư tươi sạch.", price: 28000, originalPrice: 32000, categorySlug: "rau-cu", brand: "Nấm Việt", sku: "RC105", stock: 80, imageKey: "rauCai", specs: { "Trọng lượng": "300g" } },
  { name: "Dưa chuột Việt Gap", slug: "dua-chuot-viet-gap", description: "Dưa chuột đạt chuẩn VietGAP.", price: 16000, originalPrice: 20000, categorySlug: "rau-cu", brand: "VietGAP", sku: "RC106", stock: 100, imageKey: "duaLeo", specs: { "Xuất xứ": "Ninh Bình" } },

  { name: "Bưởi da xanh 1 trái", slug: "buoi-da-xanh", description: "Bưởi da xanh ngọt thanh, ít hạt.", price: 55000, originalPrice: 65000, categorySlug: "trai-cay", brand: "Bến Tre", sku: "TC101", stock: 40, imageKey: "traiCay", isFeatured: true, specs: { "Xuất xứ": "Bến Tre" } },
  { name: "Thanh long ruột đỏ", slug: "thanh-long-ruot-do", description: "Thanh long ruột đỏ ngọt mát.", price: 32000, originalPrice: 38000, categorySlug: "trai-cay", brand: "Bình Thuận", sku: "TC102", stock: 55, imageKey: "duaHau", specs: { "Trọng lượng": "1kg" } },
  { name: "Táo xanh Granny Smith", slug: "tao-xanh-granny", description: "Táo xanh chua nhẹ, giòn.", price: 70000, originalPrice: 82000, categorySlug: "trai-cay", brand: "Import Fresh", sku: "TC103", stock: 45, imageKey: "tao", isPromotion: true, specs: { "Xuất xứ": "New Zealand" } },
  { name: "Chuối già Nam Mỹ", slug: "chuoi-gia-nam-my", description: "Chuối già chín vàng đều.", price: 25000, originalPrice: 30000, categorySlug: "trai-cay", brand: "Import Fresh", sku: "TC104", stock: 70, imageKey: "chuoi", specs: { "Trọng lượng": "1kg" } },
  { name: "Nho đen không hạt", slug: "nho-den-khong-hat", description: "Nho đen ngọt đậm, không hạt.", price: 95000, originalPrice: 110000, categorySlug: "trai-cay", brand: "Import Fresh", sku: "TC105", stock: 35, imageKey: "nho", isFeatured: true, specs: { "Trọng lượng": "500g" } },
  { name: "Cam vàng Ai Cập", slug: "cam-vang-ai-cap", description: "Cam vàng mọng nước, dễ bóc.", price: 48000, originalPrice: 58000, categorySlug: "trai-cay", brand: "Import Fresh", sku: "TC106", stock: 50, imageKey: "cam", specs: { "Trọng lượng": "1kg" } },
  { name: "Xoài keo chín cây", slug: "xoai-keo-chin-cay", description: "Xoài keo chín cây, thơm ngọt.", price: 40000, originalPrice: 48000, categorySlug: "trai-cay", brand: "Đồng Tháp", sku: "TC107", stock: 65, imageKey: "xoai", specs: { "Xuất xứ": "Đồng Tháp" } },

  { name: "Sprite lon 330ml", slug: "sprite-lon-330ml", description: "Nước ngọt vị chanh Sprite.", price: 10000, originalPrice: 12000, categorySlug: "do-uong", brand: "Sprite", sku: "DU101", stock: 200, imageKey: "doUong", specs: { "Dung tích": "330ml" } },
  { name: "7Up 1.5L", slug: "7up-15l", description: "Nước ngọt 7Up chai lớn.", price: 18000, originalPrice: 22000, categorySlug: "do-uong", brand: "7Up", sku: "DU102", stock: 150, imageKey: "doUong", specs: { "Dung tích": "1.5L" } },
  { name: "Red Bull 250ml", slug: "red-bull-250ml", description: "Nước tăng lực Red Bull.", price: 15000, originalPrice: 18000, categorySlug: "do-uong", brand: "Red Bull", sku: "DU103", stock: 180, imageKey: "coca", isPromotion: true, specs: { "Dung tích": "250ml" } },
  { name: "Trà Lipton Ice Tea 450ml", slug: "tra-lipton-ice-tea", description: "Trà đào Lipton mát lạnh.", price: 12000, originalPrice: 14000, categorySlug: "do-uong", brand: "Lipton", sku: "DU104", stock: 140, imageKey: "doUong", specs: { "Dung tích": "450ml" } },
  { name: "Cà phê G7 hòa tan 16g", slug: "ca-phe-g7-hoa-tan", description: "Cà phê sữa hòa tan G7.", price: 4500, originalPrice: 5500, categorySlug: "do-uong", brand: "Trung Nguyên", sku: "DU105", stock: 300, imageKey: "cafe", isFeatured: true, specs: { "Trọng lượng": "16g" } },
  { name: "Nước ép Cam Twister 1L", slug: "nuoc-ep-cam-twister-1l", description: "Nước cam ép chai 1 lít.", price: 28000, originalPrice: 34000, categorySlug: "do-uong", brand: "Twister", sku: "DU106", stock: 90, imageKey: "traiCay", specs: { "Dung tích": "1L" } },

  { name: "Nước tương Maggi 700ml", slug: "nuoc-tuong-maggi-700ml", description: "Nước tương đậm đà Maggi.", price: 28000, originalPrice: 32000, categorySlug: "gia-vi", brand: "Maggi", sku: "GV101", stock: 110, imageKey: "giaVi", isFeatured: true, specs: { "Dung tích": "700ml" } },
  { name: "Dầu hào Maggi 350g", slug: "dau-hao-maggi-350g", description: "Dầu hào sánh đặc.", price: 22000, originalPrice: 26000, categorySlug: "gia-vi", brand: "Maggi", sku: "GV102", stock: 100, imageKey: "dauAn", specs: { "Trọng lượng": "350g" } },
  { name: "Tương cà Cholimex 270g", slug: "tuong-ca-cholimex", description: "Tương cà chua Cholimex.", price: 14000, originalPrice: 17000, categorySlug: "gia-vi", brand: "Cholimex", sku: "GV103", stock: 130, imageKey: "giaVi", specs: { "Trọng lượng": "270g" } },
  { name: "Giấm gạo lên men 500ml", slug: "giam-gao-len-men", description: "Giấm gạo nấu canh chua.", price: 18000, originalPrice: 22000, categorySlug: "gia-vi", brand: "Ajinomoto", sku: "GV104", stock: 90, imageKey: "giaVi", specs: { "Dung tích": "500ml" } },
  { name: "Hạt tiêu xay 50g", slug: "hat-tieu-xay-50g", description: "Tiêu xay thơm cay.", price: 25000, originalPrice: 30000, categorySlug: "gia-vi", brand: "Ông Chà Và", sku: "GV105", stock: 85, imageKey: "giaVi", isPromotion: true, specs: { "Trọng lượng": "50g" } },

  { name: "Bánh quy Digestive 400g", slug: "banh-quy-digestive", description: "Bánh quy lúa mạch tiêu hóa tốt.", price: 45000, originalPrice: 52000, categorySlug: "banh-keo", brand: "McVitie's", sku: "BK101", stock: 70, imageKey: "banh", isFeatured: true, specs: { "Trọng lượng": "400g" } },
  { name: "Kẹo sô-cô-la KitKat", slug: "keo-kitkat", description: "Bánh xốp phủ socola KitKat.", price: 15000, originalPrice: 18000, categorySlug: "banh-keo", brand: "KitKat", sku: "BK102", stock: 160, imageKey: "keo", specs: { "Trọng lượng": "35g" } },
  { name: "Snack khoai tây Lay's 50g", slug: "snack-lays-50g", description: "Snack Lay's vị tự nhiên.", price: 9000, originalPrice: 11000, categorySlug: "banh-keo", brand: "Lay's", sku: "BK103", stock: 200, imageKey: "snack", isPromotion: true, specs: { "Trọng lượng": "50g" } },
  { name: "Bánh gạo One One 150g", slug: "banh-gao-one-one", description: "Bánh gạo giòn One One.", price: 20000, originalPrice: 24000, categorySlug: "banh-keo", brand: "One One", sku: "BK104", stock: 120, imageKey: "banh", specs: { "Trọng lượng": "150g" } },
  { name: "Kẹo dẻo Chupa Chups", slug: "keo-deo-chupa", description: "Kẹo dẻo trái cây Chupa Chups.", price: 22000, originalPrice: 26000, categorySlug: "banh-keo", brand: "Chupa Chups", sku: "BK105", stock: 100, imageKey: "keo", specs: { "Trọng lượng": "90g" } },

  { name: "Tôm tẩm bột đông lạnh 500g", slug: "tom-tam-bot-dong-lanh", description: "Tôm tẩm bột sẵn chiên.", price: 89000, originalPrice: 99000, categorySlug: "dong-lanh", brand: "CP", sku: "DL101", stock: 40, imageKey: "dongLanh", isFeatured: true, specs: { "Trọng lượng": "500g" } },
  { name: "Thanh cua đông lạnh 250g", slug: "thanh-cua-dong-lanh", description: "Thanh cua làm salad/món cuốn.", price: 42000, originalPrice: 48000, categorySlug: "dong-lanh", brand: "Avalo", sku: "DL102", stock: 55, imageKey: "dongLanh", specs: { "Trọng lượng": "250g" } },
  { name: "Xúc xích Đức Đông Nam Á", slug: "xuc-xich-duc", description: "Xúc xích Đức hương vị đậm.", price: 65000, originalPrice: 75000, categorySlug: "dong-lanh", brand: "Đức Việt", sku: "DL103", stock: 50, imageKey: "xucXich", isPromotion: true, specs: { "Trọng lượng": "500g" } },
  { name: "Há cảo tôm Hong Kong", slug: "ha-cao-tom-hk", description: "Há cảo tôm kiểu Hồng Kông.", price: 72000, originalPrice: 82000, categorySlug: "dong-lanh", brand: "CP", sku: "DL104", stock: 45, imageKey: "dongLanh", specs: { "Trọng lượng": "400g" } },

  { name: "Mì ăn liền Indomie vị bò", slug: "mi-indomie-bo", description: "Mì Indomie hương vị bò xào.", price: 7000, originalPrice: 8500, categorySlug: "mi-goi", brand: "Indomie", sku: "MG101", stock: 220, imageKey: "mi", isFeatured: true, specs: { "Trọng lượng": "80g" } },
  { name: "Mì ly Modern tôm chua", slug: "mi-ly-modern", description: "Mì ly Modern tiện lợi.", price: 9000, originalPrice: 11000, categorySlug: "mi-goi", brand: "Modern", sku: "MG102", stock: 180, imageKey: "miGoi", specs: { "Trọng lượng": "65g" } },
  { name: "Phở chay Đệ Nhất", slug: "pho-chay-de-nhat", description: "Phở chay ăn liền.", price: 10000, originalPrice: 12000, categorySlug: "mi-goi", brand: "Đệ Nhất", sku: "MG103", stock: 140, imageKey: "miGoi", isPromotion: true, specs: { "Trọng lượng": "70g" } },
  { name: "Hủ tiếu bò Kho Vifon", slug: "hu-tieu-bo-kho", description: "Hủ tiếu bò kho ăn liền.", price: 11000, originalPrice: 13000, categorySlug: "mi-goi", brand: "Vifon", sku: "MG104", stock: 130, imageKey: "mi", specs: { "Trọng lượng": "70g" } },
  { name: "Mì không chiên Acecook", slug: "mi-khong-chien-acecook", description: "Mì không chiên tốt cho sức khỏe.", price: 6000, originalPrice: 7000, categorySlug: "mi-goi", brand: "Acecook", sku: "MG105", stock: 200, imageKey: "miGoi", specs: { "Trọng lượng": "75g" } },

  { name: "Sữa chua uống Yakult lốc 5", slug: "yakult-loc-5", description: "Sữa chua uống men sống Yakult.", price: 28000, originalPrice: 32000, categorySlug: "sua", brand: "Yakult", sku: "SU101", stock: 100, imageKey: "suaChua", isFeatured: true, specs: { "Số lượng": "5 chai" } },
  { name: "Sữa đặc Ngôi Sao Phương Nam", slug: "sua-dac-ngoi-sao", description: "Sữa đặc có đường Ngôi Sao.", price: 26000, originalPrice: 30000, categorySlug: "sua", brand: "Vinamilk", sku: "SU102", stock: 120, imageKey: "suaHop", specs: { "Trọng lượng": "380g" } },
  { name: "Sữa bò tươi Đà Lạt Milk", slug: "sua-da-lat-milk", description: "Sữa tươi Đà Lạt Milk tiệt trùng.", price: 34000, originalPrice: 38000, categorySlug: "sua", brand: "Đà Lạt Milk", sku: "SU103", stock: 85, imageKey: "sua", isPromotion: true, specs: { "Dung tích": "1L" } },
  { name: "Sữa hạt óc chó 1L", slug: "sua-hat-oc-cho", description: "Sữa hạt óc chó không đường.", price: 52000, originalPrice: 60000, categorySlug: "sua", brand: "TH True Nut", sku: "SU104", stock: 60, imageKey: "suaHop", specs: { "Dung tích": "1L" } },
  { name: "Phô mai Con Bò Cười 8 miếng", slug: "pho-mai-con-bo-cuoi", description: "Phô mai Con Bò Cười hộp 8.", price: 38000, originalPrice: 45000, categorySlug: "sua", brand: "Laughing Cow", sku: "SU105", stock: 75, imageKey: "suaChua", isFeatured: true, specs: { "Số lượng": "8 miếng" } },
];

const NEW_CUSTOMERS = [
  { email: "an.nguyen@demo.com", name: "Nguyễn Văn An", phone: "0931001001" },
  { email: "binh.tran@demo.com", name: "Trần Thị Bình", phone: "0931001002" },
  { email: "chi.le@demo.com", name: "Lê Thị Chi", phone: "0931001003" },
  { email: "dat.pham@demo.com", name: "Phạm Văn Đạt", phone: "0931001004" },
  { email: "em.hoang@demo.com", name: "Hoàng Thị Em", phone: "0931001005" },
  { email: "phong.vu@demo.com", name: "Vũ Minh Phong", phone: "0931001006" },
  { email: "quynh.bui@demo.com", name: "Bùi Thị Quỳnh", phone: "0931001007" },
  { email: "sang.do@demo.com", name: "Đỗ Văn Sang", phone: "0931001008" },
  { email: "tam.ngo@demo.com", name: "Ngô Thị Tâm", phone: "0931001009" },
  { email: "uyen.dang@demo.com", name: "Đặng Thị Uyên", phone: "0931001010" },
  { email: "viet.vo@demo.com", name: "Võ Quốc Việt", phone: "0931001011" },
  { email: "xuan.truong@demo.com", name: "Trương Thị Xuân", phone: "0931001012" },
  { email: "yen.phan@demo.com", name: "Phan Thị Yến", phone: "0931001013" },
  { email: "hung.ly@demo.com", name: "Lý Văn Hùng", phone: "0931001014" },
  { email: "lan.cao@demo.com", name: "Cao Thị Lan", phone: "0931001015" },
];

const ADDRESSES = [
  "Gián Khẩu, Xã Gia Trấn, Huyện Gia Viễn, Ninh Bình",
  "Thôn Trung, Xã Gia Trấn, Huyện Gia Viễn, Ninh Bình",
  "Thôn Đông, Xã Gia Phương, Huyện Gia Viễn, Ninh Bình",
  "Thị trấn Me, Huyện Gia Viễn, Ninh Bình",
  "Xã Gia Lạc, Huyện Gia Viễn, Ninh Bình",
  "Xã Gia Sinh, Huyện Gia Viễn, Ninh Bình",
];

const AVATAR_KEYS = ["avatar1", "avatar2", "avatar3", "avatar4", "avatar5", "avatar6"] as const;

async function downloadToFile(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} ${url}`);
  await pipeline(Readable.fromWeb(res.body as any), createWriteStream(dest));
}

async function ensureImage(slug: string, imageKey: keyof typeof IMG, folder: "products" | "avatars") {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const filename = `${slug}.jpg`;
  const dest = path.join(dir, filename);
  const localUrl = `/uploads/${folder}/${filename}`;

  try {
    await access(dest);
    return localUrl;
  } catch {
    // continue download
  }

  try {
    await downloadToFile(IMG[imageKey], dest);
    return localUrl;
  } catch {
    // fallback: copy any existing product image
    const fallback = path.join(process.cwd(), "public", "uploads", "products", "rau-muong-sach-da-lat.jpg");
    try {
      await copyFile(fallback, dest);
      return localUrl;
    } catch {
      return IMG[imageKey];
    }
  }
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("Expanding catalog, users, and order history...");

  const categories = await prisma.category.findMany();
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  // --- Products ---
  let addedProducts = 0;
  for (const p of NEW_PRODUCTS) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue;
    if (!catMap[p.categorySlug]) {
      console.warn("Missing category", p.categorySlug);
      continue;
    }
    const image = await ensureImage(p.slug, p.imageKey, "products");
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
        status: "ACTIVE",
        isFeatured: p.isFeatured ?? false,
        isPromotion: p.isPromotion ?? false,
        specs: JSON.stringify(p.specs),
        categoryId: catMap[p.categorySlug],
      },
    });
    addedProducts++;
    console.log("+ Product:", p.name);
  }

  // --- Customers ---
  const passwordHash = await bcrypt.hash("123456", 10);
  const newUsers = [];
  for (let i = 0; i < NEW_CUSTOMERS.length; i++) {
    const c = NEW_CUSTOMERS[i];
    const exists = await prisma.user.findUnique({ where: { email: c.email } });
    if (exists) {
      newUsers.push(exists);
      continue;
    }
    const avatar = await ensureImage(
      c.email.replace(/[^a-z0-9]/gi, "-"),
      AVATAR_KEYS[i % AVATAR_KEYS.length],
      "avatars"
    );
    const user = await prisma.user.create({
      data: {
        email: c.email,
        password: passwordHash,
        name: c.name,
        phone: c.phone,
        role: "CUSTOMER",
        avatar,
      },
    });
    await prisma.address.create({
      data: {
        userId: user.id,
        label: i % 2 === 0 ? "Nhà" : "Công ty",
        fullName: c.name,
        phone: c.phone,
        address: ADDRESSES[i % ADDRESSES.length],
        isDefault: true,
      },
    });
    newUsers.push(user);
    console.log("+ Customer:", c.name);
  }

  // --- Order history for all customers ---
  const allCustomers = await prisma.user.findMany({ where: { role: "CUSTOMER" } });
  const allProducts = await prisma.product.findMany({ where: { status: "ACTIVE" } });
  const existingOrders = await prisma.order.count();
  let orderSeq = existingOrders + 1;
  let addedOrders = 0;

  const statuses: Array<{
    status: string;
    paymentStatus: string;
    timeline: { status: string; note?: string }[];
  }> = [
    {
      status: "delivered",
      paymentStatus: "paid",
      timeline: [
        { status: "pending", note: "Đơn hàng đã được đặt" },
        { status: "confirmed" },
        { status: "shipping" },
        { status: "delivered", note: "Giao hàng thành công" },
      ],
    },
    {
      status: "shipping",
      paymentStatus: "pending",
      timeline: [
        { status: "pending", note: "Đơn hàng đã được đặt" },
        { status: "confirmed" },
        { status: "shipping", note: "Đang giao" },
      ],
    },
    {
      status: "confirmed",
      paymentStatus: "pending",
      timeline: [
        { status: "pending", note: "Đơn hàng đã được đặt" },
        { status: "confirmed", note: "Đã xác nhận" },
      ],
    },
    {
      status: "delivered",
      paymentStatus: "paid",
      timeline: [
        { status: "pending", note: "Đơn hàng đã được đặt" },
        { status: "confirmed" },
        { status: "shipping" },
        { status: "delivered", note: "Giao thành công" },
      ],
    },
  ];

  for (let i = 0; i < allCustomers.length; i++) {
    const user = allCustomers[i];
    const userOrderCount = await prisma.order.count({ where: { userId: user.id } });
    // Mỗi khách có thêm 2-4 đơn nếu còn ít
    const need = Math.max(0, 2 + (i % 3) - userOrderCount);
    const addr =
      (await prisma.address.findFirst({ where: { userId: user.id } }))?.address ||
      ADDRESSES[i % ADDRESSES.length];

    for (let j = 0; j < need; j++) {
      const st = statuses[(i + j) % statuses.length];
      const itemCount = 1 + ((i + j) % 3);
      const items = [];
      let subtotal = 0;
      for (let k = 0; k < itemCount; k++) {
        const product = allProducts[(i * 5 + j * 3 + k * 7) % allProducts.length];
        const qty = 1 + ((i + k) % 3);
        subtotal += product.price * qty;
        items.push({
          productId: product.id,
          quantity: qty,
          price: product.price,
          productName: product.name,
          productImage: product.image,
        });
      }
      const shippingFee = subtotal >= 200000 ? 0 : 15000;
      const discount = j === 0 && i % 4 === 0 ? Math.round(subtotal * 0.1) : 0;
      const total = subtotal + shippingFee - discount;
      const paymentMethod = (i + j) % 3 === 0 ? "vnpay" : "cod";
      const code = `DH${String(100000 + orderSeq).slice(1)}`;
      orderSeq++;

      await prisma.order.create({
        data: {
          orderCode: code,
          userId: user.id,
          customerName: user.name,
          customerPhone: user.phone || "0900000000",
          customerEmail: user.email,
          subtotal,
          shippingFee,
          discount,
          total,
          status: st.status,
          paymentMethod,
          paymentStatus: paymentMethod === "vnpay" && st.status === "delivered" ? "paid" : st.paymentStatus,
          address: addr,
          voucherCode: discount > 0 ? "ANPHU10" : null,
          createdAt: daysAgo(1 + i + j * 3),
          items: { create: items },
          timeline: {
            create: st.timeline.map((t, idx) => ({
              status: t.status,
              note: t.note,
              createdAt: daysAgo(1 + i + j * 3 - idx),
            })),
          },
        },
      });
      addedOrders++;
    }
  }

  // Thêm vài đánh giá cho sản phẩm mới (rating thật)
  const freshProducts = await prisma.product.findMany({
    where: { sku: { startsWith: "RC1" } },
  });
  const comments = [
    "Sản phẩm tươi ngon.",
    "Giao hàng nhanh, đóng gói đẹp.",
    "Giá hợp lý, sẽ mua lại.",
    "Chất lượng ổn định.",
  ];
  for (let i = 0; i < Math.min(freshProducts.length, 12); i++) {
    const product = freshProducts[i];
    const customer = allCustomers[i % allCustomers.length];
    const existing = await prisma.review.count({
      where: { productId: product.id, userId: customer.id },
    });
    if (existing > 0) continue;
    await prisma.review.create({
      data: {
        productId: product.id,
        userId: customer.id,
        customerName: customer.name,
        avatar: customer.avatar,
        rating: 4 + (i % 2),
        comment: comments[i % comments.length],
      },
    });
    const agg = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { id: true },
    });
    await prisma.product.update({
      where: { id: product.id },
      data: {
        rating: Math.round((agg._avg.rating || 0) * 10) / 10,
        reviewCount: agg._count.id,
      },
    });
  }

  const totals = {
    products: await prisma.product.count(),
    customers: await prisma.user.count({ where: { role: "CUSTOMER" } }),
    orders: await prisma.order.count(),
    addedProducts,
    addedCustomers: NEW_CUSTOMERS.length,
    addedOrders,
  };
  console.log("Done:", totals);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
