import { PrismaClient, type User } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&h=600&q=80`;

/** Ảnh theo loại — seed dùng ảnh riêng từng SP, không dùng 1 ảnh chung cả danh mục */
const productImages = {
  rau: img("photo-1540420773420-3366772f4999"),
  traiCay: img("photo-1619566636858-adf3ef46400b"),
  doUong: img("photo-1625772299848-391b6a87d7b3"),
  giaVi: img("photo-1596040033229-a9821ebd058d"),
  banhKeo: img("photo-1481391319762-47dfffb64917"),
  dongLanh: img("photo-1626804475297-41608ea09aeb"),
  miGoi: img("photo-1569718212165-3a8278d5f624"),
  sua: img("photo-1563636619-e9143da7973b"),
  // Ảnh riêng phổ biến
  rauMuong: img("photo-1622206151226-18ca2c9ab4a1"),
  caChua: img("photo-1546094096-0df4bcaaa337"),
  caRot: img("photo-1598170845058-32b9d6a5da37"),
  khoaiTay: img("photo-1518977676601-b53f82aba655"),
  duaLeo: img("photo-1449300079323-02e209d9b5a0"),
  cam: img("photo-1547514701-42782101795e"),
  chuoi: img("photo-1571771894821-ce9b6c11b08e"),
  tao: img("photo-1560806887-1e4cd0b6cbd6"),
  nho: img("photo-1537640538966-79f369143f8f"),
  duaHau: img("photo-1587049352846-4a222e784d38"),
  xoai: img("photo-1553279768-865429fa0078"),
  coca: img("photo-1554866585-cd94860890b7"),
  cafe: img("photo-1514432324607-a09d9b4aefdd"),
  nuocMam: img("photo-1472476443507-2f0b6849e5b0"),
  dauAn: img("photo-1474979266404-7eaacbcd87c5"),
  oreo: img("photo-1499636136210-6f4ee915583e"),
  banhQuy: img("photo-1558961363-fa8fdf86f2cf"),
  snack: img("photo-1621939514649-cdc8f2555400"),
  xucXich: img("photo-1607623814075-e51df1bdc82f"),
  mi: img("photo-1612929633738-8fe44f7ec841"),
  suaHop: img("photo-1550583724-b2692b85b150"),
  suaChua: img("photo-1488477181946-6428a0291777"),
  gao: img("photo-1586201375761-83865001e31c"),
};

type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  price: number;
  originalPrice: number;
  image: string;
  categorySlug: string;
  brand: string;
  sku: string;
  stock: number;
  isFeatured?: boolean;
  isPromotion?: boolean;
  specs: Record<string, string>;
};

async function syncProductRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { id: true },
  });
  const count = agg._count.id;
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: count === 0 ? 0 : Math.round((agg._avg.rating ?? 0) * 10) / 10,
      reviewCount: count,
    },
  });
}

async function main() {
  console.log("Seeding database...");

  await prisma.supportMessage.deleteMany();
  await prisma.supportThread.deleteMany();
  await prisma.orderTimeline.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.address.deleteMany();
  await prisma.news.deleteMany();
  await prisma.user.deleteMany();
  await prisma.storeSetting.deleteMany();

  const passwordHash = await bcrypt.hash("123456", 10);

  const avatarPool = [
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop",
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
  ];

  const customersDataVi = [
    { email: "khach@demo.com", name: "Nguyễn Thị Lan", phone: "0901234567" },
    { email: "tuan.nguyen@demo.com", name: "Nguyễn Văn Tuấn", phone: "0902345678" },
    { email: "huong.tran@demo.com", name: "Trần Thị Hương", phone: "0903456789" },
    { email: "minh.le@demo.com", name: "Lê Văn Minh", phone: "0904567890" },
    { email: "hoa.pham@demo.com", name: "Phạm Thị Hoa", phone: "0905678901" },
    { email: "dung.hoang@demo.com", name: "Hoàng Văn Dũng", phone: "0906789012" },
    { email: "mai.vu@demo.com", name: "Vũ Thị Mai", phone: "0907890123" },
    { email: "long.bui@demo.com", name: "Bùi Văn Long", phone: "0908901234" },
    { email: "thao.do@demo.com", name: "Đỗ Thị Thảo", phone: "0909012345" },
    { email: "khang.ngo@demo.com", name: "Ngô Văn Khang", phone: "0910123456" },
    { email: "linh.dang@demo.com", name: "Đặng Thị Linh", phone: "0911234567" },
    { email: "nam.vo@demo.com", name: "Võ Văn Nam", phone: "0912345670" },
    { email: "yen.truong@demo.com", name: "Trương Thị Yến", phone: "0913456781" },
    { email: "hieu.phan@demo.com", name: "Phan Văn Hiếu", phone: "0914567892" },
    { email: "nga.ly@demo.com", name: "Lý Thị Nga", phone: "0915678903" },
    { email: "son.cao@demo.com", name: "Cao Văn Sơn", phone: "0916789014" },
    { email: "trang.dinh@demo.com", name: "Đinh Thị Trang", phone: "0917890125" },
    { email: "quang.luu@demo.com", name: "Lưu Văn Quang", phone: "0918901236" },
    { email: "hanh.mai@demo.com", name: "Mai Thị Hạnh", phone: "0919012347" },
    { email: "duc.ton@demo.com", name: "Tôn Văn Đức", phone: "0920123458" },
  ];

  const customers: User[] = [];
  for (let i = 0; i < customersDataVi.length; i++) {
    const c = customersDataVi[i];
    const created = await prisma.user.create({
      data: {
        email: c.email,
        password: passwordHash,
        name: c.name,
        phone: c.phone,
        role: "CUSTOMER",
        avatar: avatarPool[i % avatarPool.length],
      },
    });
    customers.push(created);
  }

  await prisma.user.create({
    data: {
      email: "chu@demo.com",
      password: passwordHash,
      name: "Chủ cửa hàng FPT",
      phone: "0388025515",
      role: "OWNER",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
  });

  await prisma.user.create({
    data: {
      email: "nhanvien@demo.com",
      password: passwordHash,
      name: "Nhân viên Minh",
      phone: "0912345678",
      role: "STAFF",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
  });

  await prisma.storeSetting.create({
    data: {
      id: "default",
      name: "Tạp Hóa FPT",
      slogan: "Siêu thị mini quê — Online & tại quầy",
      address: "Gián Khẩu, Xã Gia Trấn, Huyện Gia Viễn, Ninh Bình",
      phone: "0388025515",
      email: "vuminhhieunp@mail.com",
      facebook: "https://www.facebook.com/vu.minh.hieu.503599",
      zalo: "0388025515",
      openHours: "6:00 - 21:00 hàng ngày",
      description:
        "Tạp hóa / siêu thị mini ở Gia Viễn: thực phẩm, đồ uống, gia vị, bánh kẹo, đông lạnh và đồ gia dụng. Mua online hoặc đến lấy tại quầy.",
      latitude: 20.333,
      longitude: 105.92,
      bankName: "Vietcombank",
      bankAccount: "0388025515",
      bankOwner: "TAP HOA FPT",
    },
  });

  const sampleAddresses = [
    "Gián Khẩu, Xã Gia Trấn, Huyện Gia Viễn, Ninh Bình",
    "Thôn 2, Xã Gia Trấn, Huyện Gia Viễn, Ninh Bình",
    "Thôn 5, Xã Gia Sinh, Huyện Gia Viễn, Ninh Bình",
    "Thị trấn Me, Huyện Gia Viễn, Ninh Bình",
    "Xã Gia Lạc, Huyện Gia Viễn, Ninh Bình",
  ];

  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    await prisma.address.create({
      data: {
        userId: c.id,
        label: i % 2 === 0 ? "Nhà" : "Công ty",
        fullName: c.name,
        phone: c.phone ?? "0900000000",
        address: sampleAddresses[i % sampleAddresses.length],
        isDefault: true,
      },
    });
  }

  await prisma.news.createMany({
    data: [
      {
        title: "Khai trương cửa hàng online Tạp Hóa FPT",
        slug: "khai-truong-online",
        excerpt: "Ra mắt website mua sắm online, giao hàng tận nhà.",
        content: "Chúng tôi vui mừng thông báo ra mắt website mua sắm online...",
        image: productImages.rau,
      },
      {
        title: "Rau củ tươi mỗi sáng",
        slug: "rau-cu-tuoi",
        excerpt: "Cam kết nhập rau củ tươi mỗi sáng, đảm bảo chất lượng.",
        content: "Cam kết nhập rau củ tươi mỗi sáng từ nông trại địa phương...",
        image: productImages.traiCay,
      },
      {
        title: "Thanh toán VNPay & AI tư vấn sản phẩm",
        slug: "vnpay-va-ai",
        excerpt: "Thanh toán VNPay và hỗ trợ chat tư vấn sản phẩm ngay trên web.",
        content: "Khách hàng có thể thanh toán qua VNPay và chat với trợ lý AI...",
        image: productImages.sua,
      },
    ],
  });

  await prisma.voucher.createMany({
    data: [
      { code: "TAPHOA10", discount: 10, minOrder: 100000, isActive: true },
      { code: "DEMO20", discount: 20, minOrder: 150000, isActive: true },
      { code: "FREESHIP", discount: 15, minOrder: 200000, isActive: true },
      { code: "WELCOME", discount: 5, minOrder: 50000, isActive: true },
      { code: "HETHAN", discount: 30, minOrder: 0, isActive: false },
    ],
  });

  const categoriesData = [
    { name: "Rau củ", slug: "rau-cu", icon: "Salad" },
    { name: "Trái cây", slug: "trai-cay", icon: "Apple" },
    { name: "Đồ uống", slug: "do-uong", icon: "Coffee" },
    { name: "Gia vị", slug: "gia-vi", icon: "Soup" },
    { name: "Bánh kẹo", slug: "banh-keo", icon: "Candy" },
    { name: "Đồ đông lạnh", slug: "dong-lanh", icon: "Snowflake" },
    { name: "Mì gói", slug: "mi-goi", icon: "UtensilsCrossed" },
    { name: "Sữa", slug: "sua", icon: "Milk" },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.slug] = created.id;
  }

  // rating/reviewCount KHONG hardcode — se tinh tu bang Review
  const productsData: ProductSeed[] = [
    { name: "Rau muống sạch Đà Lạt", slug: "rau-muong-sach-da-lat", description: "Rau muống tươi ngon, hữu cơ.", price: 12000, originalPrice: 15000, image: productImages.rauMuong, categorySlug: "rau-cu", brand: "Đà Lạt Fresh", sku: "RC001", stock: 150, isFeatured: true, isPromotion: true, specs: { "Xuất xứ": "Đà Lạt" } },
    { name: "Cà chua bi Đà Lạt", slug: "ca-chua-bi-da-lat", description: "Cà chua bi ngọt giòn.", price: 25000, originalPrice: 30000, image: productImages.caChua, categorySlug: "rau-cu", brand: "Đà Lạt Fresh", sku: "RC002", stock: 70, specs: { "Trọng lượng": "500g" } },
    { name: "Cải thìa hữu cơ", slug: "cai-thia-huu-co", description: "Cải thìa xanh giòn, không thuốc trừ sâu.", price: 15000, originalPrice: 18000, image: productImages.rau, categorySlug: "rau-cu", brand: "Đà Lạt Fresh", sku: "RC003", stock: 110, isFeatured: true, specs: { "Xuất xứ": "Đà Lạt" } },
    { name: "Cà rốt baby 500g", slug: "ca-rot-baby-500g", description: "Cà rốt baby ngọt, thích hợp nấu canh.", price: 22000, originalPrice: 26000, image: productImages.caRot, categorySlug: "rau-cu", brand: "Đà Lạt Fresh", sku: "RC004", stock: 85, isPromotion: true, specs: { "Trọng lượng": "500g" } },
    { name: "Khoai tây Đà Lạt 1kg", slug: "khoai-tay-da-lat-1kg", description: "Khoai tây chắc, ít mắt.", price: 28000, originalPrice: 32000, image: productImages.khoaiTay, categorySlug: "rau-cu", brand: "Đà Lạt Fresh", sku: "RC005", stock: 130, specs: { "Trọng lượng": "1kg" } },
    { name: "Bắp cải trắng", slug: "bap-cai-trang", description: "Bắp cải tươi, lá dày.", price: 16000, originalPrice: 20000, image: productImages.rau, categorySlug: "rau-cu", brand: "Nông trại địa phương", sku: "RC006", stock: 95, specs: { "Xuất xứ": "Ninh Bình" } },
    { name: "Dưa leo baby", slug: "dua-leo-baby", description: "Dưa leo baby giòn ngọt.", price: 18000, originalPrice: 22000, image: productImages.duaLeo, categorySlug: "rau-cu", brand: "Đà Lạt Fresh", sku: "RC007", stock: 100, specs: { "Trọng lượng": "500g" } },
    { name: "Rau thơm hỗn hợp", slug: "rau-thom-hon-hop", description: "Gói rau thơm: húng, ngò, rau răm.", price: 10000, originalPrice: 12000, image: productImages.rau, categorySlug: "rau-cu", brand: "Nông trại địa phương", sku: "RC008", stock: 160, isFeatured: true, specs: { "Xuất xứ": "Ninh Bình" } },
    { name: "Cam sành Hà Giang", slug: "cam-sanh-ha-giang", description: "Cam sành ngọt mọng nước.", price: 35000, originalPrice: 45000, image: productImages.cam, categorySlug: "trai-cay", brand: "Hà Giang", sku: "TC001", stock: 80, isFeatured: true, isPromotion: true, specs: { "Xuất xứ": "Hà Giang" } },
    { name: "Chuối sứ tiêu", slug: "chuoi-su-tieu", description: "Chuối sứ chín tự nhiên.", price: 18000, originalPrice: 22000, image: productImages.chuoi, categorySlug: "trai-cay", brand: "Nông trại địa phương", sku: "TC002", stock: 90, specs: { "Xuất xứ": "Việt Nam" } },
    { name: "Táo Mỹ Fuji 1kg", slug: "tao-my-fuji-1kg", description: "Táo Fuji giòn ngọt.", price: 65000, originalPrice: 75000, image: productImages.tao, categorySlug: "trai-cay", brand: "Import Fresh", sku: "TC003", stock: 55, isFeatured: true, specs: { "Xuất xứ": "Mỹ" } },
    { name: "Nho xanh không hạt", slug: "nho-xanh-khong-hat", description: "Nho xanh ngọt, không hạt.", price: 89000, originalPrice: 99000, image: productImages.nho, categorySlug: "trai-cay", brand: "Import Fresh", sku: "TC004", stock: 40, isPromotion: true, specs: { "Trọng lượng": "500g" } },
    { name: "Dưa hấu đỏ 2kg", slug: "dua-hau-do-2kg", description: "Dưa hấu đỏ ngọt mát.", price: 32000, originalPrice: 40000, image: productImages.duaHau, categorySlug: "trai-cay", brand: "Long An", sku: "TC005", stock: 45, specs: { "Trọng lượng": "2kg" } },
    { name: "Xoài cát Hòa Lộc", slug: "xoai-cat-hoa-loc", description: "Xoài cát thơm ngọt đặc sản.", price: 55000, originalPrice: 65000, image: productImages.xoai, categorySlug: "trai-cay", brand: "Tiền Giang", sku: "TC006", stock: 60, isFeatured: true, specs: { "Xuất xứ": "Tiền Giang" } },
    { name: "Ổi Đài Loan", slug: "oi-dai-loan", description: "Ổi giòn, ít hạt.", price: 28000, originalPrice: 34000, image: productImages.traiCay, categorySlug: "trai-cay", brand: "Nông trại địa phương", sku: "TC007", stock: 75, specs: { "Trọng lượng": "1kg" } },
    { name: "Nước suối Lavie 1.5L", slug: "nuoc-suoi-lavie-15l", description: "Nước suối tinh khiết.", price: 8000, originalPrice: 10000, image: productImages.doUong, categorySlug: "do-uong", brand: "Lavie", sku: "DU001", stock: 200, isFeatured: true, specs: { "Dung tích": "1.5L" } },
    { name: "Trà xanh 0 độ 455ml", slug: "tra-xanh-0-do", description: "Trà xanh thanh mát.", price: 10000, originalPrice: 12000, image: productImages.doUong, categorySlug: "do-uong", brand: "0 độ", sku: "DU002", stock: 150, specs: { "Dung tích": "455ml" } },
    { name: "Coca Cola 330ml", slug: "coca-cola-330ml", description: "Nước ngọt có ga.", price: 10000, originalPrice: 12000, image: productImages.coca, categorySlug: "do-uong", brand: "Coca-Cola", sku: "DU003", stock: 220, isFeatured: true, specs: { "Dung tích": "330ml" } },
    { name: "Pepsi 1.5L", slug: "pepsi-15l", description: "Nước ngọt Pepsi chai lớn.", price: 18000, originalPrice: 22000, image: productImages.doUong, categorySlug: "do-uong", brand: "Pepsi", sku: "DU004", stock: 140, specs: { "Dung tích": "1.5L" } },
    { name: "Sting đỏ 330ml", slug: "sting-do-330ml", description: "Nước tăng lực Sting.", price: 9000, originalPrice: 11000, image: productImages.doUong, categorySlug: "do-uong", brand: "Sting", sku: "DU005", stock: 180, specs: { "Dung tích": "330ml" } },
    { name: "Nước cam Twister 450ml", slug: "nuoc-cam-twister", description: "Nước cam ép Twister.", price: 12000, originalPrice: 15000, image: productImages.doUong, categorySlug: "do-uong", brand: "Twister", sku: "DU006", stock: 120, isPromotion: true, specs: { "Dung tích": "450ml" } },
    { name: "Cà phê Lon Highlands", slug: "ca-phe-lon-highlands", description: "Cà phê sữa đá đóng lon.", price: 15000, originalPrice: 18000, image: productImages.cafe, categorySlug: "do-uong", brand: "Highlands", sku: "DU007", stock: 90, specs: { "Dung tích": "330ml" } },
    { name: "Nước mắm Nam Ngư 750ml", slug: "nuoc-mam-nam-ngu-750ml", description: "Nước mắm truyền thống.", price: 42000, originalPrice: 48000, image: productImages.nuocMam, categorySlug: "gia-vi", brand: "Nam Ngư", sku: "GV001", stock: 95, isFeatured: true, isPromotion: true, specs: { "Dung tích": "750ml" } },
    { name: "Muối i-ốt Visaco 500g", slug: "muoi-i-ot-visaco", description: "Muối i-ốt tinh khiết.", price: 6000, originalPrice: 7000, image: productImages.giaVi, categorySlug: "gia-vi", brand: "Visaco", sku: "GV002", stock: 200, specs: { "Trọng lượng": "500g" } },
    { name: "Đường trắng Biên Hòa 1kg", slug: "duong-trang-bien-hoa-1kg", description: "Đường tinh luyện.", price: 28000, originalPrice: 32000, image: productImages.giaVi, categorySlug: "gia-vi", brand: "Biên Hòa", sku: "GV003", stock: 160, isFeatured: true, specs: { "Trọng lượng": "1kg" } },
    { name: "Dầu ăn Neptune 1L", slug: "dau-an-neptune-1l", description: "Dầu ăn tinh luyện.", price: 45000, originalPrice: 52000, image: productImages.dauAn, categorySlug: "gia-vi", brand: "Neptune", sku: "GV004", stock: 85, isPromotion: true, specs: { "Dung tích": "1L" } },
    { name: "Tương ớt Cholimex 270g", slug: "tuong-ot-cholimex", description: "Tương ớt cay vừa.", price: 16000, originalPrice: 19000, image: productImages.giaVi, categorySlug: "gia-vi", brand: "Cholimex", sku: "GV005", stock: 130, specs: { "Trọng lượng": "270g" } },
    { name: "Hạt nêm Knorr 400g", slug: "hat-nem-knorr-400g", description: "Hạt nêm thịt heo.", price: 35000, originalPrice: 40000, image: productImages.giaVi, categorySlug: "gia-vi", brand: "Knorr", sku: "GV006", stock: 110, specs: { "Trọng lượng": "400g" } },
    { name: "Bột ngọt Ajinomoto 400g", slug: "bot-ngot-ajinomoto", description: "Bột ngọt tinh khiết.", price: 32000, originalPrice: 36000, image: productImages.giaVi, categorySlug: "gia-vi", brand: "Ajinomoto", sku: "GV007", stock: 100, specs: { "Trọng lượng": "400g" } },
    { name: "Bánh quy Cosy Marie 336g", slug: "banh-quy-cosy-marie", description: "Bánh quy giòn tan.", price: 28000, originalPrice: 32000, image: productImages.banhQuy, categorySlug: "banh-keo", brand: "Cosy", sku: "BK001", stock: 120, isFeatured: true, specs: { "Trọng lượng": "336g" } },
    { name: "Kẹo Alpenliebe 120g", slug: "keo-alpenliebe-120g", description: "Kẹo sữa caramen.", price: 18000, originalPrice: 22000, image: productImages.banhKeo, categorySlug: "banh-keo", brand: "Alpenliebe", sku: "BK002", stock: 140, specs: { "Trọng lượng": "120g" } },
    { name: "Bánh Oreo 133g", slug: "banh-oreo-133g", description: "Bánh quy kem vani.", price: 22000, originalPrice: 26000, image: productImages.oreo, categorySlug: "banh-keo", brand: "Oreo", sku: "BK003", stock: 100, isFeatured: true, isPromotion: true, specs: { "Trọng lượng": "133g" } },
    { name: "Snack Oishi 40g", slug: "snack-oishi-40g", description: "Snack tôm cay.", price: 6000, originalPrice: 8000, image: productImages.snack, categorySlug: "banh-keo", brand: "Oishi", sku: "BK004", stock: 250, specs: { "Trọng lượng": "40g" } },
    { name: "Bánh Choco-Pie 12 cái", slug: "banh-choco-pie-12", description: "Bánh Choco-Pie hộp 12 cái.", price: 48000, originalPrice: 55000, image: productImages.banhKeo, categorySlug: "banh-keo", brand: "Orion", sku: "BK005", stock: 80, specs: { "Số lượng": "12 cái" } },
    { name: "Kẹo Mentos trái cây", slug: "keo-mentos-trai-cay", description: "Kẹo Mentos vị trái cây.", price: 12000, originalPrice: 15000, image: productImages.banhKeo, categorySlug: "banh-keo", brand: "Mentos", sku: "BK006", stock: 170, specs: { "Trọng lượng": "37.5g" } },
    { name: "Xúc xích CP 500g", slug: "xuc-xich-cp-500g", description: "Xúc xích đông lạnh.", price: 55000, originalPrice: 65000, image: productImages.xucXich, categorySlug: "dong-lanh", brand: "CP", sku: "DL001", stock: 60, isFeatured: true, isPromotion: true, specs: { "Trọng lượng": "500g" } },
    { name: "Há cảo tôm thịt 400g", slug: "ha-cao-tom-thit", description: "Há cảo đông lạnh sẵn.", price: 62000, originalPrice: 72000, image: productImages.dongLanh, categorySlug: "dong-lanh", brand: "CP", sku: "DL002", stock: 50, specs: { "Trọng lượng": "400g" } },
    { name: "Cá viên Chi-Town 500g", slug: "ca-vien-chi-town", description: "Cá viên chiên sẵn.", price: 48000, originalPrice: 55000, image: productImages.dongLanh, categorySlug: "dong-lanh", brand: "Chi-Town", sku: "DL003", stock: 70, isFeatured: true, specs: { "Trọng lượng": "500g" } },
    { name: "Thịt bò viên 300g", slug: "thit-bo-vien-300g", description: "Thịt bò viên đông lạnh.", price: 58000, originalPrice: 68000, image: productImages.dongLanh, categorySlug: "dong-lanh", brand: "CP", sku: "DL004", stock: 45, isPromotion: true, specs: { "Trọng lượng": "300g" } },
    { name: "Chả giò tôm thịt 500g", slug: "cha-gio-tom-thit", description: "Chả giò đông lạnh sẵn chiên.", price: 52000, originalPrice: 60000, image: productImages.dongLanh, categorySlug: "dong-lanh", brand: "Vissan", sku: "DL005", stock: 55, specs: { "Trọng lượng": "500g" } },
    { name: "Mì Hảo Hảo tôm chua cay", slug: "mi-hao-hao-tom-chua-cay", description: "Mì gói tiện lợi.", price: 4500, originalPrice: 5000, image: productImages.mi, categorySlug: "mi-goi", brand: "Acecook", sku: "MG001", stock: 300, isFeatured: true, specs: { "Trọng lượng": "75g" } },
    { name: "Mì Omachi sốt bò hầm", slug: "mi-omachi-sot-bo-ham", description: "Mì khoai tây Omachi.", price: 8000, originalPrice: 9000, image: productImages.miGoi, categorySlug: "mi-goi", brand: "Omachi", sku: "MG002", stock: 200, isFeatured: true, specs: { "Trọng lượng": "80g" } },
    { name: "Mì Kokomi tôm chua cay", slug: "mi-kokomi-tom-chua-cay", description: "Mì Kokomi giá tốt.", price: 4000, originalPrice: 4500, image: productImages.mi, categorySlug: "mi-goi", brand: "Kokomi", sku: "MG003", stock: 280, specs: { "Trọng lượng": "75g" } },
    { name: "Phở Đệ Nhất bò", slug: "pho-de-nhat-bo", description: "Phở ăn liền hương vị bò.", price: 9000, originalPrice: 11000, image: productImages.miGoi, categorySlug: "mi-goi", brand: "Đệ Nhất", sku: "MG004", stock: 150, isPromotion: true, specs: { "Trọng lượng": "70g" } },
    { name: "Mì 3 Miền Gold", slug: "mi-3-mien-gold", description: "Mì 3 Miền Gold tôm chua cay.", price: 5000, originalPrice: 6000, image: productImages.mi, categorySlug: "mi-goi", brand: "Uniben", sku: "MG005", stock: 240, specs: { "Trọng lượng": "75g" } },
    { name: "Hủ tiếu Nam Vang ăn liền", slug: "hu-tieu-nam-vang", description: "Hủ tiếu Nam Vang tiện lợi.", price: 10000, originalPrice: 12000, image: productImages.miGoi, categorySlug: "mi-goi", brand: "Vifon", sku: "MG006", stock: 120, specs: { "Trọng lượng": "70g" } },
    { name: "Sữa tươi Vinamilk 1L", slug: "sua-tuoi-vinamilk-1l", description: "Sữa tươi tiệt trùng.", price: 32000, originalPrice: 36000, image: productImages.sua, categorySlug: "sua", brand: "Vinamilk", sku: "SU001", stock: 100, isFeatured: true, isPromotion: true, specs: { "Dung tích": "1L" } },
    { name: "Sữa đặc Ông Thọ 380g", slug: "sua-dac-ong-tho", description: "Sữa đặc có đường.", price: 28000, originalPrice: 32000, image: productImages.suaHop, categorySlug: "sua", brand: "Vinamilk", sku: "SU002", stock: 130, isFeatured: true, specs: { "Trọng lượng": "380g" } },
    { name: "Sữa chua Vinamilk lốc 4", slug: "sua-chua-vinamilk-loc-4", description: "Sữa chua ăn lốc 4 hộp.", price: 16000, originalPrice: 19000, image: productImages.suaChua, categorySlug: "sua", brand: "Vinamilk", sku: "SU003", stock: 150, specs: { "Số lượng": "4 hộp" } },
    { name: "Sữa TH True Milk 1L", slug: "sua-th-true-milk-1l", description: "Sữa tươi sạch TH.", price: 36000, originalPrice: 40000, image: productImages.sua, categorySlug: "sua", brand: "TH True Milk", sku: "SU004", stock: 90, isPromotion: true, specs: { "Dung tích": "1L" } },
    { name: "Sữa đậu nành Fami 200ml", slug: "sua-dau-nanh-fami", description: "Sữa đậu nành nguyên chất.", price: 7000, originalPrice: 8500, image: productImages.suaHop, categorySlug: "sua", brand: "Fami", sku: "SU005", stock: 180, specs: { "Dung tích": "200ml" } },
    { name: "Sữa bột Milo 400g", slug: "sua-bot-milo-400g", description: "Thức uống lúa mạch Milo.", price: 95000, originalPrice: 110000, image: productImages.sua, categorySlug: "sua", brand: "Milo", sku: "SU006", stock: 65, isFeatured: true, specs: { "Trọng lượng": "400g" } },
  ];

  const productIds: Record<string, string> = {};
  const productIdList: string[] = [];
  for (const p of productsData) {
    const created = await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        originalPrice: p.originalPrice,
        image: p.image,
        images: JSON.stringify([p.image]),
        brand: p.brand,
        sku: p.sku,
        stock: p.stock,
        rating: 0,
        reviewCount: 0,
        soldCount: 0,
        status: "ACTIVE",
        isFeatured: p.isFeatured ?? false,
        isPromotion: p.isPromotion ?? false,
        specs: JSON.stringify(p.specs),
        categoryId: categories[p.categorySlug],
      },
    });
    productIds[p.slug] = created.id;
    productIdList.push(created.id);
  }

  const reviewComments = [
    "Sản phẩm rất tốt, sẽ mua lại!",
    "Chất lượng ổn, giao hàng nhanh.",
    "Giá hợp lý so với chợ.",
    "Hàng tươi, đóng gói cẩn thận.",
    "Đúng như mô tả, hài lòng.",
    "Gia đình mình dùng thường xuyên.",
    "Shop tư vấn nhiệt tình.",
    "Đóng gói đẹp, sản phẩm ngon.",
    "Đáng tiền, sẽ giới thiệu bạn bè.",
    "Giao đúng hẹn, cảm ơn shop.",
  ];

  // Tao danh gia that: moi SP 2-5 review, mỗi user chỉ 1 lần / SP
  const reviewsToCreate: {
    customerName: string;
    rating: number;
    comment: string;
    productId: string;
    userId: string;
    avatar: string | null;
  }[] = [];
  const reviewPair = new Set<string>();

  for (let i = 0; i < productIdList.length; i++) {
    const productId = productIdList[i];
    const reviewCount = 2 + (i % 4); // 2, 3, 4, 5
    let added = 0;
    for (let j = 0; added < reviewCount && j < customers.length * 2; j++) {
      const customer = customers[(i + j * 3) % customers.length];
      const key = `${customer.id}:${productId}`;
      if (reviewPair.has(key)) continue;
      reviewPair.add(key);
      const star = 3 + ((i + added * 2) % 3); // 3, 4, 5
      reviewsToCreate.push({
        customerName: customer.name,
        rating: star,
        comment: reviewComments[(i + added) % reviewComments.length],
        productId,
        userId: customer.id,
        avatar: customer.avatar,
      });
      added += 1;
    }
  }

  await prisma.review.createMany({ data: reviewsToCreate });

  // Dong bo rating/reviewCount tu Review that
  for (const productId of productIdList) {
    await syncProductRating(productId);
  }

  await prisma.promotion.createMany({
    data: [
      {
        title: "Giảm 20% rau củ tươi",
        description: "Tự động giảm 20% các SP danh mục Rau củ khi thanh toán",
        image: productImages.rau,
        discount: 20,
        endDate: new Date("2026-12-31"),
        ruleType: "percent",
        categorySlug: "rau-cu",
      },
      {
        title: "Mua 2 tặng 1 sữa",
        description: "Mua 3 sản phẩm sữa bất kỳ — tặng 1 (giá thấp nhất)",
        image: productImages.sua,
        discount: 0,
        endDate: new Date("2026-12-31"),
        ruleType: "bogo",
        categorySlug: "sua",
      },
      {
        title: "Freeship đơn từ 200K",
        description: "Miễn phí giao hàng nội thị khi đơn đủ điều kiện",
        image: productImages.banhKeo,
        discount: 0,
        endDate: new Date("2026-12-31"),
        ruleType: "banner",
        categorySlug: null,
      },
    ],
  });

  // --- Demo data: tồn thấp, wishlist, đơn hàng co-purchase, support ---
  type ProductMeta = {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  const productBySlug = await prisma.product.findMany();
  const productMeta: Record<string, ProductMeta> = {};
  for (const p of productBySlug) {
    productMeta[p.slug] = {
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
    };
  }

  // Tồn thấp để demo cảnh báo admin
  await prisma.product.update({
    where: { id: productIds["nho-xanh-khong-hat"] },
    data: { stock: 3 },
  });
  await prisma.product.update({
    where: { id: productIds["ha-cao-tom-thit"] },
    data: { stock: 4 },
  });
  await prisma.product.update({
    where: { id: productIds["sua-bot-milo-400g"] },
    data: { stock: 5 },
  });

  // Wishlist khách demo — personalization / trang yêu thích
  await prisma.wishlistItem.createMany({
    data: [
      { userId: customers[0].id, productId: productIds["sua-tuoi-vinamilk-1l"] },
      { userId: customers[0].id, productId: productIds["banh-oreo-133g"] },
      { userId: customers[0].id, productId: productIds["cam-sanh-ha-giang"] },
      { userId: customers[1].id, productId: productIds["mi-hao-hao-tom-chua-cay"] },
      { userId: customers[1].id, productId: productIds["coca-cola-330ml"] },
      { userId: customers[2].id, productId: productIds["xuc-xich-cp-500g"] },
    ],
  });

  /**
   * Giỏ hàng mẫu — lặp nhiều lần để recommendation "Thường mua kèm" rõ khi demo:
   * - Mì ↔ Coca / Snack
   * - Rau ↔ Nước mắm / Dầu ăn
   * - Sữa ↔ Bánh / Sữa chua
   * - Đông lạnh ↔ Mì / Gia vị
   */
  type Line = { slug: string; qty: number };
  const baskets: { name: string; lines: Line[]; weight: number }[] = [
    {
      name: "an-vat",
      weight: 18,
      lines: [
        { slug: "mi-hao-hao-tom-chua-cay", qty: 5 },
        { slug: "coca-cola-330ml", qty: 2 },
        { slug: "snack-oishi-40g", qty: 3 },
      ],
    },
    {
      name: "an-vat-2",
      weight: 12,
      lines: [
        { slug: "mi-omachi-sot-bo-ham", qty: 3 },
        { slug: "sting-do-330ml", qty: 2 },
        { slug: "banh-oreo-133g", qty: 1 },
      ],
    },
    {
      name: "nau-an",
      weight: 16,
      lines: [
        { slug: "rau-muong-sach-da-lat", qty: 2 },
        { slug: "nuoc-mam-nam-ngu-750ml", qty: 1 },
        { slug: "dau-an-neptune-1l", qty: 1 },
      ],
    },
    {
      name: "nau-an-2",
      weight: 10,
      lines: [
        { slug: "ca-chua-bi-da-lat", qty: 1 },
        { slug: "ca-rot-baby-500g", qty: 1 },
        { slug: "hat-nem-knorr-400g", qty: 1 },
        { slug: "tuong-ot-cholimex", qty: 1 },
      ],
    },
    {
      name: "sua-banh",
      weight: 14,
      lines: [
        { slug: "sua-tuoi-vinamilk-1l", qty: 2 },
        { slug: "banh-oreo-133g", qty: 1 },
        { slug: "sua-chua-vinamilk-loc-4", qty: 2 },
      ],
    },
    {
      name: "sua-trai-cay",
      weight: 8,
      lines: [
        { slug: "sua-th-true-milk-1l", qty: 1 },
        { slug: "cam-sanh-ha-giang", qty: 1 },
        { slug: "chuoi-su-tieu", qty: 1 },
      ],
    },
    {
      name: "dong-lanh",
      weight: 12,
      lines: [
        { slug: "xuc-xich-cp-500g", qty: 1 },
        { slug: "mi-hao-hao-tom-chua-cay", qty: 4 },
        { slug: "nuoc-mam-nam-ngu-750ml", qty: 1 },
      ],
    },
    {
      name: "dong-lanh-2",
      weight: 8,
      lines: [
        { slug: "ca-vien-chi-town", qty: 1 },
        { slug: "cha-gio-tom-thit", qty: 1 },
        { slug: "tra-xanh-0-do", qty: 2 },
      ],
    },
    {
      name: "do-uong-banh",
      weight: 10,
      lines: [
        { slug: "pepsi-15l", qty: 1 },
        { slug: "banh-choco-pie-12", qty: 1 },
        { slug: "keo-alpenliebe-120g", qty: 1 },
      ],
    },
    {
      name: "gia-dinh",
      weight: 10,
      lines: [
        { slug: "khoai-tay-da-lat-1kg", qty: 1 },
        { slug: "duong-trang-bien-hoa-1kg", qty: 1 },
        { slug: "muoi-i-ot-visaco", qty: 1 },
        { slug: "nuoc-suoi-lavie-15l", qty: 2 },
      ],
    },
  ];

  const weightedBaskets: typeof baskets = [];
  for (const b of baskets) {
    for (let w = 0; w < b.weight; w++) weightedBaskets.push(b);
  }

  const statusesFlow: {
    status: string;
    paymentStatus: string;
    paymentMethod: string;
    steps: { status: string; note?: string }[];
  }[] = [
    {
      status: "delivered",
      paymentStatus: "paid",
      paymentMethod: "cod",
      steps: [
        { status: "pending", note: "Đơn hàng đã được đặt" },
        { status: "confirmed" },
        { status: "shipping" },
        { status: "delivered", note: "Giao hàng thành công" },
      ],
    },
    {
      status: "delivered",
      paymentStatus: "paid",
      paymentMethod: "vnpay",
      steps: [
        { status: "pending", note: "Đơn hàng đã được đặt" },
        { status: "confirmed" },
        { status: "shipping" },
        { status: "delivered", note: "Thanh toán VNPay thành công" },
      ],
    },
    {
      status: "shipping",
      paymentStatus: "pending",
      paymentMethod: "cod",
      steps: [
        { status: "pending", note: "Đơn hàng đã được đặt" },
        { status: "confirmed" },
        { status: "shipping", note: "Đang giao hàng" },
      ],
    },
    {
      status: "confirmed",
      paymentStatus: "pending",
      paymentMethod: "cod",
      steps: [
        { status: "pending", note: "Đơn hàng đã được đặt" },
        { status: "confirmed", note: "Đã xác nhận đơn" },
      ],
    },
    {
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "vnpay",
      steps: [{ status: "pending", note: "Chờ thanh toán / xác nhận" }],
    },
  ];

  const soldBump = new Map<string, number>();
  let orderSeq = 2000;
  const daysBack = 45;
  const totalSyntheticOrders = 90;

  async function createDemoOrder(opts: {
    customerIndex: number | null;
    basket: Line[];
    daysAgo: number;
    hour: number;
    flowIndex: number;
    voucherCode?: string;
    walkIn?: boolean;
    fulfillmentType?: string;
    forceCode?: string;
  }) {
    const basket = opts.basket
      .map((l) => ({ ...l, meta: productMeta[l.slug] }))
      .filter((l) => l.meta);
    if (basket.length < 2) return;

    const subtotal = basket.reduce(
      (s, l) => s + l.meta!.price * l.qty,
      0
    );
    let discount = 0;
    if (opts.voucherCode === "TAPHOA10" && subtotal >= 100000) {
      discount = Math.round(subtotal * 0.1);
    } else if (opts.voucherCode === "DEMO20" && subtotal >= 150000) {
      discount = Math.round(subtotal * 0.2);
    } else if (opts.voucherCode === "WELCOME" && subtotal >= 50000) {
      discount = Math.round(subtotal * 0.05);
    }

    const flow = statusesFlow[opts.flowIndex % statusesFlow.length];
    const isPickup = opts.fulfillmentType === "pickup" || opts.walkIn;
    const shippingFee = isPickup ? 0 : subtotal >= 200000 ? 0 : 15000;
    const total = subtotal - discount + shippingFee;

    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - opts.daysAgo);
    createdAt.setHours(opts.hour, (orderSeq * 7) % 60, 0, 0);

    const customer =
      opts.customerIndex === null ? null : customers[opts.customerIndex];
    const orderCode =
      opts.forceCode || `DH${String(orderSeq++).padStart(6, "0")}`;

    await prisma.order.create({
      data: {
        orderCode,
        userId: customer?.id,
        customerName: customer?.name || "Khách tại quầy",
        customerPhone: customer?.phone || "0388025515",
        customerEmail: customer?.email,
        subtotal,
        shippingFee,
        discount,
        total,
        status: opts.walkIn ? "delivered" : flow.status,
        paymentMethod: opts.walkIn ? "cod" : flow.paymentMethod,
        paymentStatus: opts.walkIn ? "paid" : flow.paymentStatus,
        fulfillmentType: isPickup ? "pickup" : "delivery",
        address: isPickup
          ? "Nhận tại quầy — Tạp Hóa FPT"
          : sampleAddresses[(opts.customerIndex ?? 0) % sampleAddresses.length],
        voucherCode: opts.voucherCode,
        note: opts.walkIn ? "Đơn POS / tại quầy (seed demo)" : undefined,
        createdAt,
        items: {
          create: basket.map((l) => ({
            productId: l.meta!.id,
            quantity: l.qty,
            price: l.meta!.price,
            productName: l.meta!.name,
            productImage: l.meta!.image,
          })),
        },
        timeline: {
          create: (opts.walkIn
            ? [
                { status: "pending", note: "Bán tại quầy" },
                { status: "delivered", note: "Hoàn tất tại quầy" },
              ]
            : flow.steps
          ).map((s, idx) => ({
            status: s.status,
            note: s.note,
            createdAt: new Date(createdAt.getTime() + idx * 3600_000),
          })),
        },
      },
    });

    if ((opts.walkIn ? "delivered" : flow.status) !== "cancelled") {
      for (const l of basket) {
        soldBump.set(l.slug, (soldBump.get(l.slug) || 0) + l.qty);
      }
    }
  }

  // 1) Đơn cố định — dễ nhắc khi bảo vệ
  await createDemoOrder({
    customerIndex: 0,
    basket: baskets[0].lines,
    daysAgo: 2,
    hour: 9,
    flowIndex: 0,
    forceCode: "DHDEMO01",
  });
  await createDemoOrder({
    customerIndex: 0,
    basket: baskets[2].lines,
    daysAgo: 5,
    hour: 18,
    flowIndex: 0,
    forceCode: "DHDEMO02",
  });
  await createDemoOrder({
    customerIndex: 0,
    basket: baskets[4].lines,
    daysAgo: 1,
    hour: 10,
    flowIndex: 2,
    voucherCode: "TAPHOA10",
    forceCode: "DHDEMO03",
  });
  await createDemoOrder({
    customerIndex: 1,
    basket: baskets[0].lines,
    daysAgo: 0,
    hour: 14,
    flowIndex: 3,
    forceCode: "DHDEMO04",
  });
  await createDemoOrder({
    customerIndex: 2,
    basket: [
      { slug: "xoai-cat-hoa-loc", qty: 1 },
      { slug: "dau-an-neptune-1l", qty: 1 },
      { slug: "banh-oreo-133g", qty: 1 },
    ],
    daysAgo: 0,
    hour: 11,
    flowIndex: 4,
    forceCode: "DHDEMO05",
  });

  // 2) Nhiều đơn lặp basket → co-purchase / trending rõ
  for (let i = 0; i < totalSyntheticOrders; i++) {
    const basket = weightedBaskets[i % weightedBaskets.length].lines;
    const daysAgo = 1 + (i % daysBack);
    const hour = 7 + (i % 13); // 7h–19h peak
    const customerIndex = i % 3 === 0 ? null : i % customers.length;
    const walkIn = customerIndex === null;
    const voucherCode =
      i % 11 === 0 ? "TAPHOA10" : i % 17 === 0 ? "WELCOME" : undefined;

    await createDemoOrder({
      customerIndex: walkIn ? null : customerIndex,
      basket,
      daysAgo,
      hour,
      flowIndex: i % 7 === 0 ? 4 : i % 5 === 0 ? 2 : i % 4 === 0 ? 3 : i % 2,
      voucherCode,
      walkIn,
      fulfillmentType: walkIn || i % 9 === 0 ? "pickup" : "delivery",
    });
  }

  // 3) Một số đơn huỷ — demo báo cáo / lọc trạng thái
  const cancelBasket = baskets[1].lines;
  const cancelMeta = cancelBasket
    .map((l) => ({ ...l, meta: productMeta[l.slug] }))
    .filter((l) => l.meta);
  const cancelSub = cancelMeta.reduce((s, l) => s + l.meta!.price * l.qty, 0);
  await prisma.order.create({
    data: {
      orderCode: "DHDEMO99",
      userId: customers[3].id,
      customerName: customers[3].name,
      customerPhone: customers[3].phone!,
      customerEmail: customers[3].email,
      subtotal: cancelSub,
      shippingFee: 15000,
      discount: 0,
      total: cancelSub + 15000,
      status: "cancelled",
      paymentMethod: "cod",
      paymentStatus: "pending",
      address: sampleAddresses[3],
      note: "Khách hủy — seed demo",
      createdAt: new Date(Date.now() - 3 * 86400_000),
      items: {
        create: cancelMeta.map((l) => ({
          productId: l.meta!.id,
          quantity: l.qty,
          price: l.meta!.price,
          productName: l.meta!.name,
          productImage: l.meta!.image,
        })),
      },
      timeline: {
        create: [
          { status: "pending", note: "Đơn hàng đã được đặt" },
          { status: "cancelled", note: "Khách hủy đơn" },
        ],
      },
    },
  });

  // Cập nhật soldCount từ đơn thật (không tính cancelled)
  for (const [slug, qty] of soldBump) {
    const id = productIds[slug];
    if (!id) continue;
    await prisma.product.update({
      where: { id },
      data: { soldCount: qty },
    });
  }

  // Support chat — demo admin Tin nhắn
  const thread = await prisma.supportThread.create({
    data: {
      userId: customers[0].id,
      status: "open",
      lastMessageAt: new Date(),
      messages: {
        create: [
          {
            senderRole: "customer",
            senderId: customers[0].id,
            senderName: customers[0].name,
            content:
              "Chào shop, mình muốn hỏi combo mì + nước ngọt có giảm không ạ?",
            createdAt: new Date(Date.now() - 3600_000),
          },
          {
            senderRole: "staff",
            senderId: null,
            senderName: "Nhân viên Minh",
            content:
              "Chào chị Lan! Đang có voucher TAPHOA10 (giảm 10% đơn từ 100K). Mì Hảo Hảo hay mua kèm Coca — vào giỏ sẽ thấy gợi ý thêm ạ.",
            createdAt: new Date(Date.now() - 1800_000),
            readAt: new Date(),
          },
          {
            senderRole: "customer",
            senderId: customers[0].id,
            senderName: customers[0].name,
            content: "Cảm ơn shop, mình xem gợi ý trên web nhé!",
            createdAt: new Date(Date.now() - 600_000),
          },
        ],
      },
    },
  });
  void thread;

  const sample = await prisma.product.findFirst({
    where: { slug: "mi-hao-hao-tom-chua-cay" },
    include: { reviews: true },
  });
  const totalReviews = await prisma.review.count();
  const totalOrders = await prisma.order.count();
  const topSold = await prisma.product.findMany({
    orderBy: { soldCount: "desc" },
    take: 5,
    select: { name: true, soldCount: true, slug: true },
  });

  console.log("\n========== SEED DEMO HOÀN TẤT ==========");
  console.log(
    `Khách: ${customers.length} | SP: ${productIdList.length} | Đánh giá: ${totalReviews} | Đơn: ${totalOrders}`
  );
  if (sample) {
    console.log(
      `Gợi ý demo: mở "${sample.name}" → xem "Thường mua kèm" (Coca, Snack...)`
    );
    console.log(
      `  soldCount=${sample.soldCount}, rating=${sample.rating} (${sample.reviewCount} reviews)`
    );
  }
  console.log("Top bán chạy:");
  for (const p of topSold) {
    console.log(`  - ${p.name}: ${p.soldCount}`);
  }
  console.log("\n--- Tài khoản demo (mật khẩu: 123456) ---");
  console.log("  Khách:      khach@demo.com     → đơn DHDEMO01–03, wishlist, chat");
  console.log("  Chủ:        chu@demo.com       → admin / báo cáo");
  console.log("  Nhân viên:  nhanvien@demo.com  → POS / xử lý đơn");
  console.log("\n--- Script bảo vệ nhanh ---");
  console.log("  1. Đăng nhập khach@demo.com → Trang chủ: Gợi ý dành cho bạn / Bán chạy");
  console.log("  2. Mở SP Mì Hảo Hảo → Thường mua kèm: Coca, Snack (từ đơn thật)");
  console.log("  3. Giỏ: thêm Mì + bỏ Coca → block 'Có thể bạn cần thêm'");
  console.log("  4. Yêu thích / Đơn hàng: lịch sử + mua lại");
  console.log("  5. Admin chu@demo.com: Tổng quan, Báo cáo, tồn thấp, tin nhắn");
  console.log("  6. Voucher demo: TAPHOA10 | DEMO20 | WELCOME | FREESHIP");
  console.log("  7. Đơn mẫu: DHDEMO01…05, DHDEMO99 (đã hủy)");
  console.log("========================================\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
