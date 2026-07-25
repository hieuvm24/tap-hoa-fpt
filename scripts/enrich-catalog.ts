/**
 * Bổ sung sản phẩm, khách, đơn (lượt mua), bình luận — không xóa data cũ.
 * npx tsx scripts/enrich-catalog.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const IMG = {
  rau: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop",
  traiCay: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop",
  doUong: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=400&h=400&fit=crop",
  giaVi: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=400&fit=crop",
  banhKeo: "https://images.unsplash.com/photo-1481391319762-47dfffb64917?w=400&h=400&fit=crop",
  dongLanh: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=400&h=400&fit=crop",
  miGoi: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=400&fit=crop",
  sua: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop",
  giaDung: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&h=400&fit=crop",
  caNhan: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
  gao: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=400&fit=crop",
};

const NEW_CATEGORIES = [
  { name: "Đồ gia dụng", slug: "do-gia-dung", icon: "Home" },
  { name: "Chăm sóc cá nhân", slug: "cham-soc-ca-nhan", icon: "Sparkles" },
];

const NEW_PRODUCTS = [
  // Thêm thực phẩm
  { name: "Gạo ST25 túi 5kg", slug: "gao-st25-5kg", description: "Gạo ST25 thơm dẻo, túi 5kg.", price: 145000, originalPrice: 165000, image: IMG.gao, categorySlug: "gia-vi", brand: "ST25", sku: "GA001", stock: 80, isFeatured: true, isPromotion: true, specs: { "Trọng lượng": "5kg" } },
  { name: "Gạo tám xoan 5kg", slug: "gao-tam-xoan-5kg", description: "Gạo tám xoan ngon cơm.", price: 120000, originalPrice: 135000, image: IMG.gao, categorySlug: "gia-vi", brand: "Địa phương", sku: "GA002", stock: 70, specs: { "Trọng lượng": "5kg" } },
  { name: "Trứng gà ta khay 10", slug: "trung-ga-ta-khay-10", description: "Trứng gà ta tươi khay 10 quả.", price: 38000, originalPrice: 42000, image: IMG.rau, categorySlug: "rau-cu", brand: "Nông trại địa phương", sku: "TR001", stock: 120, isFeatured: true, specs: { "Số lượng": "10 quả" } },
  { name: "Đậu phụ trắng 500g", slug: "dau-phu-trang-500g", description: "Đậu phụ mềm, đóng hộp.", price: 12000, originalPrice: 15000, image: IMG.rau, categorySlug: "rau-cu", brand: "Vissan", sku: "DP001", stock: 90, specs: { "Trọng lượng": "500g" } },
  { name: "Nước tương Maggi 700ml", slug: "nuoc-tuong-maggi-700ml", description: "Nước tương đậm đà.", price: 28000, originalPrice: 32000, image: IMG.giaVi, categorySlug: "gia-vi", brand: "Maggi", sku: "GV008", stock: 110, specs: { "Dung tích": "700ml" } },
  { name: "Tương cà Cholimex 270g", slug: "tuong-ca-cholimex", description: "Tương cà chua ngọt.", price: 15000, originalPrice: 18000, image: IMG.giaVi, categorySlug: "gia-vi", brand: "Cholimex", sku: "GV009", stock: 100, specs: { "Trọng lượng": "270g" } },
  { name: "Bia Heineken lon 330ml", slug: "bia-heineken-330ml", description: "Bia Heineken lon lạnh.", price: 18000, originalPrice: 22000, image: IMG.doUong, categorySlug: "do-uong", brand: "Heineken", sku: "DU008", stock: 160, isFeatured: true, specs: { "Dung tích": "330ml" } },
  { name: "Bia Sài Gòn Special 330ml", slug: "bia-sai-gon-special", description: "Bia Sài Gòn Special.", price: 12000, originalPrice: 15000, image: IMG.doUong, categorySlug: "do-uong", brand: "Sabeco", sku: "DU009", stock: 180, specs: { "Dung tích": "330ml" } },
  { name: "Nước yến không đường", slug: "nuoc-yen-khong-duong", description: "Nước yến tiện lợi.", price: 12000, originalPrice: 15000, image: IMG.doUong, categorySlug: "do-uong", brand: "Yến Việt", sku: "DU010", stock: 90, specs: { "Dung tích": "190ml" } },
  { name: "Mì ly Handy Hảo Hảo", slug: "mi-ly-handy-hao-hao", description: "Mì ly Handy tiện mang đi.", price: 9000, originalPrice: 11000, image: IMG.miGoi, categorySlug: "mi-goi", brand: "Acecook", sku: "MG007", stock: 200, isPromotion: true, specs: { "Trọng lượng": "67g" } },
  { name: "Cháo tổ yến ăn liền", slug: "chao-to-yen-an-lien", description: "Cháo tổ yến tiện lợi.", price: 15000, originalPrice: 18000, image: IMG.miGoi, categorySlug: "mi-goi", brand: "Vifon", sku: "MG008", stock: 100, specs: { "Trọng lượng": "50g" } },
  { name: "Sữa Ensure Gold 400g", slug: "sua-ensure-gold-400g", description: "Sữa bột dinh dưỡng Ensure.", price: 385000, originalPrice: 420000, image: IMG.sua, categorySlug: "sua", brand: "Ensure", sku: "SU007", stock: 40, isFeatured: true, specs: { "Trọng lượng": "400g" } },
  { name: "Phô mai Con Bò Cười 8 miếng", slug: "pho-mai-con-bo-cuoi", description: "Phô mai lát Con Bò Cười.", price: 42000, originalPrice: 48000, image: IMG.sua, categorySlug: "sua", brand: "Laughing Cow", sku: "SU008", stock: 75, specs: { "Số lượng": "8 miếng" } },
  { name: "Kem cây Merino socola", slug: "kem-cay-merino", description: "Kem cây Merino vị socola.", price: 12000, originalPrice: 15000, image: IMG.dongLanh, categorySlug: "dong-lanh", brand: "Merino", sku: "DL006", stock: 80, isPromotion: true, specs: { "Loại": "Kem cây" } },
  { name: "Thanh long ruột đỏ", slug: "thanh-long-ruot-do", description: "Thanh long ruột đỏ ngọt.", price: 25000, originalPrice: 30000, image: IMG.traiCay, categorySlug: "trai-cay", brand: "Bình Thuận", sku: "TC008", stock: 60, specs: { "Xuất xứ": "Bình Thuận" } },
  { name: "Bưởi da xanh trái", slug: "buoi-da-xanh", description: "Bưởi da xanh mọng nước.", price: 45000, originalPrice: 55000, image: IMG.traiCay, categorySlug: "trai-cay", brand: "Bến Tre", sku: "TC009", stock: 50, isFeatured: true, specs: { "Xuất xứ": "Bến Tre" } },
  // Đồ gia dụng
  { name: "Bột giặt OMO 3kg", slug: "bot-giat-omo-3kg", description: "Bột giặt OMO túi 3kg.", price: 95000, originalPrice: 110000, image: IMG.giaDung, categorySlug: "do-gia-dung", brand: "OMO", sku: "GD001", stock: 70, isFeatured: true, isPromotion: true, specs: { "Trọng lượng": "3kg" } },
  { name: "Nước giặt Comfort 3.6L", slug: "nuoc-giat-comfort", description: "Nước giặt Comfort hương nước hoa.", price: 135000, originalPrice: 155000, image: IMG.giaDung, categorySlug: "do-gia-dung", brand: "Comfort", sku: "GD002", stock: 55, specs: { "Dung tích": "3.6L" } },
  { name: "Nước rửa chén Sunlight 750g", slug: "nuoc-rua-chen-sunlight", description: "Nước rửa chén Sunlight chanh.", price: 28000, originalPrice: 32000, image: IMG.giaDung, categorySlug: "do-gia-dung", brand: "Sunlight", sku: "GD003", stock: 140, isFeatured: true, specs: { "Trọng lượng": "750g" } },
  { name: "Nước lau sàn Gift 1L", slug: "nuoc-lau-san-gift", description: "Nước lau sàn Gift hương hoa.", price: 32000, originalPrice: 38000, image: IMG.giaDung, categorySlug: "do-gia-dung", brand: "Gift", sku: "GD004", stock: 90, specs: { "Dung tích": "1L" } },
  { name: "Túi rác đen cuộn 1kg", slug: "tui-rac-den-cuon", description: "Túi rác đen loại trung.", price: 25000, originalPrice: 30000, image: IMG.giaDung, categorySlug: "do-gia-dung", brand: "Địa phương", sku: "GD005", stock: 100, specs: { "Trọng lượng": "1kg" } },
  { name: "Giấy vệ sinh Pulppy 10 cuộn", slug: "giay-ve-sinh-pulppy", description: "Giấy vệ sinh Pulppy lốc 10.", price: 48000, originalPrice: 55000, image: IMG.giaDung, categorySlug: "do-gia-dung", brand: "Pulppy", sku: "GD006", stock: 85, isPromotion: true, specs: { "Số lượng": "10 cuộn" } },
  { name: "Khăn giấy Bless You hộp", slug: "khan-giay-bless-you", description: "Khăn giấy rút Bless You.", price: 35000, originalPrice: 40000, image: IMG.giaDung, categorySlug: "do-gia-dung", brand: "Bless You", sku: "GD007", stock: 95, specs: { "Loại": "Hộp rút" } },
  { name: "Pin AA Panasonic cặp", slug: "pin-aa-panasonic", description: "Pin AA Panasonic 2 viên.", price: 18000, originalPrice: 22000, image: IMG.giaDung, categorySlug: "do-gia-dung", brand: "Panasonic", sku: "GD008", stock: 150, specs: { "Loại": "AA" } },
  { name: "Bóng đèn LED 9W", slug: "bong-den-led-9w", description: "Bóng đèn LED tiết kiệm điện.", price: 35000, originalPrice: 42000, image: IMG.giaDung, categorySlug: "do-gia-dung", brand: "Điện Quang", sku: "GD009", stock: 60, specs: { "Công suất": "9W" } },
  { name: "Muối tiêu xay 100g", slug: "muoi-tieu-xay-100g", description: "Muối tiêu xay sẵn.", price: 12000, originalPrice: 15000, image: IMG.giaVi, categorySlug: "gia-vi", brand: "Địa phương", sku: "GV010", stock: 130, specs: { "Trọng lượng": "100g" } },
  // Chăm sóc cá nhân
  { name: "Dầu gội Head & Shoulders 180ml", slug: "dau-goi-head-shoulders", description: "Dầu gội trị gàu.", price: 65000, originalPrice: 75000, image: IMG.caNhan, categorySlug: "cham-soc-ca-nhan", brand: "Head & Shoulders", sku: "CN001", stock: 80, isFeatured: true, specs: { "Dung tích": "180ml" } },
  { name: "Sữa tắm Lifebuoy 800g", slug: "sua-tam-lifebuoy", description: "Sữa tắm bảo vệ khỏi vi khuẩn.", price: 78000, originalPrice: 89000, image: IMG.caNhan, categorySlug: "cham-soc-ca-nhan", brand: "Lifebuoy", sku: "CN002", stock: 70, isPromotion: true, specs: { "Trọng lượng": "800g" } },
  { name: "Kem đánh răng P/S 180g", slug: "kem-danh-rang-ps", description: "Kem đánh răng P/S bảo vệ.", price: 32000, originalPrice: 38000, image: IMG.caNhan, categorySlug: "cham-soc-ca-nhan", brand: "P/S", sku: "CN003", stock: 120, isFeatured: true, specs: { "Trọng lượng": "180g" } },
  { name: "Bàn chải Oral-B mềm", slug: "ban-chai-oral-b", description: "Bàn chải đánh răng lông mềm.", price: 25000, originalPrice: 30000, image: IMG.caNhan, categorySlug: "cham-soc-ca-nhan", brand: "Oral-B", sku: "CN004", stock: 100, specs: { "Loại": "Lông mềm" } },
  { name: "Xà bông Lifebuoy cục", slug: "xa-bong-lifebuoy", description: "Xà bông cục kháng khuẩn.", price: 12000, originalPrice: 15000, image: IMG.caNhan, categorySlug: "cham-soc-ca-nhan", brand: "Lifebuoy", sku: "CN005", stock: 160, specs: { "Trọng lượng": "90g" } },
  { name: "Dầu gội Clear Men 180ml", slug: "dau-goi-clear-men", description: "Dầu gội Clear dành cho nam.", price: 72000, originalPrice: 82000, image: IMG.caNhan, categorySlug: "cham-soc-ca-nhan", brand: "Clear", sku: "CN006", stock: 65, specs: { "Dung tích": "180ml" } },
  { name: "Khăn ướt Lepapé 80 tờ", slug: "khan-uot-lepape", description: "Khăn ướt không mùi.", price: 28000, originalPrice: 34000, image: IMG.caNhan, categorySlug: "cham-soc-ca-nhan", brand: "Lepapé", sku: "CN007", stock: 110, isPromotion: true, specs: { "Số tờ": "80" } },
  { name: "Bông tần Sensicare", slug: "bong-tan-sensicare", description: "Bông tần vệ sinh cá nhân.", price: 22000, originalPrice: 26000, image: IMG.caNhan, categorySlug: "cham-soc-ca-nhan", brand: "Sensicare", sku: "CN008", stock: 90, specs: { "Loại": "Hộp" } },
];

const EXTRA_CUSTOMERS = [
  { email: "lan.ho@demo.com", name: "Hồ Thị Lan", phone: "0931001001" },
  { email: "hung.pham@demo.com", name: "Phạm Văn Hùng", phone: "0931001002" },
  { email: "my.nguyen@demo.com", name: "Nguyễn Thị Mỹ", phone: "0931001003" },
  { email: "tien.le@demo.com", name: "Lê Văn Tiến", phone: "0931001004" },
  { email: "nhung.tran@demo.com", name: "Trần Thị Nhung", phone: "0931001005" },
  { email: "cuong.vu@demo.com", name: "Vũ Văn Cường", phone: "0931001006" },
  { email: "ha.bui@demo.com", name: "Bùi Thị Hà", phone: "0931001007" },
  { email: "phuc.do@demo.com", name: "Đỗ Văn Phúc", phone: "0931001008" },
  { email: "dao.ngo@demo.com", name: "Ngô Thị Đào", phone: "0931001009" },
  { email: "khoa.dang@demo.com", name: "Đặng Văn Khoa", phone: "0931001010" },
  { email: "van.ly@demo.com", name: "Lý Thị Vân", phone: "0931001011" },
  { email: "tai.cao@demo.com", name: "Cao Văn Tài", phone: "0931001012" },
  { email: "oanh.dinh@demo.com", name: "Đinh Thị Oanh", phone: "0931001013" },
  { email: "binh.luu@demo.com", name: "Lưu Văn Bình", phone: "0931001014" },
  { email: "thu.mai@demo.com", name: "Mai Thị Thu", phone: "0931001015" },
];

const REVIEW_COMMENTS = [
  "Hàng đúng như mô tả, dùng ổn.",
  "Giá tiệm quê hợp lý, mua lại lần nữa.",
  "Giao nhanh trong xã, đóng gói cẩn thận.",
  "Đến lấy tại quầy tiện, nhân viên dễ thương.",
  "Chất lượng tốt, gia đình mình hay lấy.",
  "Ship đúng hẹn, cảm ơn shop.",
  "Mua online lần đầu cũng ổn.",
  "Hàng tươi / còn hạn xa, yên tâm.",
  "Sẽ giới thiệu hàng xóm mua.",
  "Đóng gói kỹ, không bị bẹp.",
  "Dùng quen rồi, đặt đều mỗi tuần.",
  "Shop trả lời chat nhanh.",
  "So với chợ gần nhà thì tiện hơn.",
  "Khuyến mãi ổn, freeship vừa đủ.",
  "Ngon / thơm / sạch tùy món, hài lòng.",
];

const ADDRESSES = [
  "Gián Khẩu, Xã Gia Trấn, Huyện Gia Viễn, Ninh Bình",
  "Thôn 2, Xã Gia Trấn, Huyện Gia Viễn, Ninh Bình",
  "Thôn 5, Xã Gia Sinh, Huyện Gia Viễn, Ninh Bình",
  "Thị trấn Me, Huyện Gia Viễn, Ninh Bình",
  "Xã Gia Lạc, Huyện Gia Viễn, Ninh Bình",
];

async function syncRating(productId: string) {
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

async function syncSoldCounts() {
  const groups = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    where: { order: { status: { not: "cancelled" } } },
  });
  for (const g of groups) {
    await prisma.product.update({
      where: { id: g.productId },
      data: { soldCount: g._sum.quantity || 0 },
    });
  }
}

async function main() {
  console.log("Enriching catalog...");
  const passwordHash = await bcrypt.hash("123456", 10);

  // Categories
  const catMap: Record<string, string> = {};
  for (const c of NEW_CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: c.slug } });
    if (existing) catMap[c.slug] = existing.id;
    else {
      const created = await prisma.category.create({ data: c });
      catMap[c.slug] = created.id;
      console.log("+ category", c.name);
    }
  }
  const allCats = await prisma.category.findMany();
  for (const c of allCats) catMap[c.slug] = c.id;

  // Customers
  let newCustomers = 0;
  for (let i = 0; i < EXTRA_CUSTOMERS.length; i++) {
    const c = EXTRA_CUSTOMERS[i];
    const exists = await prisma.user.findUnique({ where: { email: c.email } });
    if (exists) continue;
    await prisma.user.create({
      data: {
        email: c.email,
        password: passwordHash,
        name: c.name,
        phone: c.phone,
        role: "CUSTOMER",
        avatar: `https://i.pravatar.cc/100?u=${encodeURIComponent(c.email)}`,
        addresses: {
          create: {
            label: "Nhà",
            fullName: c.name,
            phone: c.phone,
            address: ADDRESSES[i % ADDRESSES.length],
            isDefault: true,
          },
        },
      },
    });
    newCustomers++;
  }
  console.log("+ customers", newCustomers);

  // Products
  let newProducts = 0;
  for (const p of NEW_PRODUCTS) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue;
    const categoryId = catMap[p.categorySlug];
    if (!categoryId) {
      console.warn("skip no category", p.slug, p.categorySlug);
      continue;
    }
    await prisma.product.create({
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
        categoryId,
      },
    });
    newProducts++;
  }
  console.log("+ products", newProducts);

  const customers = await prisma.user.findMany({ where: { role: "CUSTOMER" } });
  const products = await prisma.product.findMany({ where: { status: "ACTIVE" } });

  // Reviews — mỗi SP thiếu thì bổ sung đến 4–8 comment
  let newReviews = 0;
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const current = await prisma.review.count({ where: { productId: product.id } });
    const target = 4 + (i % 5); // 4..8
    const need = Math.max(0, target - current);
    for (let j = 0; j < need; j++) {
      const customer = customers[(i * 7 + j * 3) % customers.length];
      if (!customer) break;
      // tránh trùng user+product nếu unique không có — vẫn OK tạo nhiều
      await prisma.review.create({
        data: {
          productId: product.id,
          userId: customer.id,
          customerName: customer.name,
          avatar: customer.avatar,
          rating: 3 + ((i + j) % 3),
          comment: REVIEW_COMMENTS[(i + j * 2) % REVIEW_COMMENTS.length],
          createdAt: new Date(Date.now() - (i + j) * 3600_000 * 5),
        },
      });
      newReviews++;
    }
    if (need > 0) await syncRating(product.id);
  }
  console.log("+ reviews", newReviews);

  // Orders → lượt mua
  let orderSeq = (await prisma.order.count()) + 800;
  let newOrders = 0;
  const orderBatch = 120;
  for (let i = 0; i < orderBatch; i++) {
    const user = customers[i % customers.length];
    const itemCount = 1 + (i % 4);
    const items = [];
    let subtotal = 0;
    for (let k = 0; k < itemCount; k++) {
      const product = products[(i * 5 + k * 11) % products.length];
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
    const discount = i % 5 === 0 ? Math.round(subtotal * 0.1) : 0;
    const dayAgo = (i % 40) + 1;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - dayAgo);
    createdAt.setHours(8 + (i % 10), (i * 7) % 60, 0, 0);

    const statuses = ["delivered", "delivered", "delivered", "shipping", "confirmed", "pending"] as const;
    const status = statuses[i % statuses.length];

    await prisma.order.create({
      data: {
        orderCode: `DH${String(400000 + orderSeq++).slice(1)}`,
        userId: user.id,
        customerName: user.name,
        customerPhone: user.phone || "0900000000",
        customerEmail: user.email,
        subtotal,
        shippingFee,
        discount,
        total: subtotal + shippingFee - discount,
        status,
        paymentMethod: i % 3 === 0 ? "vnpay" : "cod",
        paymentStatus: status === "delivered" ? "paid" : "pending",
        address: ADDRESSES[i % ADDRESSES.length],
        createdAt,
        items: { create: items },
        timeline: {
          create: [
            { status: "pending", note: "Đặt hàng", createdAt },
            ...(status !== "pending"
              ? [
                  {
                    status: status === "confirmed" ? "confirmed" : status === "shipping" ? "shipping" : "delivered",
                    note: status === "delivered" ? "Giao thành công" : "Cập nhật",
                    createdAt: new Date(createdAt.getTime() + 3600_000 * 6),
                  },
                ]
              : []),
          ],
        },
      },
    });
    newOrders++;
  }
  console.log("+ orders", newOrders);

  await syncSoldCounts();
  // sync rating còn lại
  for (const p of products) await syncRating(p.id);

  const [pc, cc, oc, rc] = await Promise.all([
    prisma.product.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.count(),
    prisma.review.count(),
  ]);
  console.log(
    JSON.stringify(
      { products: pc, customers: cc, orders: oc, reviews: rc, added: { newProducts, newCustomers, newOrders, newReviews } },
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
