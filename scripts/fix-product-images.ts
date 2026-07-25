/**
 * Gán ảnh riêng theo từng sản phẩm cho khớp tên hơn, giảm trùng.
 * npx tsx scripts/fix-product-images.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const u = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&h=600&q=80`;

/** Map slug → ảnh Unsplash (mỗi sản phẩm một ảnh) */
const IMAGE_BY_SLUG: Record<string, string> = {
  // Rau củ
  "rau-muong-sach-da-lat": u("photo-1622206151226-18ca2c9ab4a1"),
  "ca-chua-bi-da-lat": u("photo-1546094096-0df4bcaaa337"),
  "cai-thia-huu-co": u("photo-1576045057995-568f588f82fb"),
  "ca-rot-baby-500g": u("photo-1598170845058-32b9d6a5da37"),
  "khoai-tay-da-lat-1kg": u("photo-1518977676601-b53f82aba655"),
  "bap-cai-trang": u("photo-1594282486552-05b4d80fbb9f"),
  "dua-leo-baby": u("photo-1449300079323-02e209d9b5a0"),
  "rau-thom-hon-hop": u("photo-1618375569909-3c8616cf7733"),
  "trung-ga-ta-khay-10": u("photo-1582722872445-44dc5f7e3c8f"),
  "dau-phu-trang-500g": u("photo-1609501676725-7186f017a4b7"),

  // Trái cây
  "cam-sanh-ha-giang": u("photo-1547514701-42782101795e"),
  "chuoi-su-tieu": u("photo-1571771894821-ce9b6c11b08e"),
  "tao-my-fuji-1kg": u("photo-1560806887-1e4cd0b6cbd6"),
  "nho-xanh-khong-hat": u("photo-1537640538966-79f369143f8f"),
  "dua-hau-do-2kg": u("photo-1587049352846-4a222e784d38"),
  "xoai-cat-hoa-loc": u("photo-1553279768-865429fa0078"),
  "oi-dai-loan": u("photo-1536511132770-e413829c4f3f"),
  "thanh-long-ruot-do": u("photo-1526318472351-c75fcf070305"),
  "buoi-da-xanh": u("photo-1559181567-c3190ca9959b"),

  // Đồ uống
  "nuoc-suoi-lavie-15l": u("photo-1548839140-29a749e1cf4d"),
  "tra-xanh-0-do": u("photo-1556679343-c7306c1976bc"),
  "coca-cola-330ml": u("photo-1554866585-cd94860890b7"),
  "pepsi-15l": u("photo-1629203851122-3726ecdf080e"),
  "sting-do-330ml": u("photo-1622483767028-3f66f32aef97"),
  "nuoc-cam-twister": u("photo-1621506289937-a8e4df240d0b"),
  "ca-phe-lon-highlands": u("photo-1514432324607-a09d9b4aefdd"),
  "bia-heineken-330ml": u("photo-1608270586620-248524c67de9"),
  "bia-sai-gon-special": u("photo-1618885472179-5e474019f2a9"),
  "nuoc-yen-khong-duong": u("photo-1551024506-0bccd828d692"),

  // Gia vị / gạo
  "nuoc-mam-nam-ngu-750ml": u("photo-1472476443507-2f0b6849e5b0"),
  "muoi-i-ot-visaco": u("photo-1518110925495-5fe2fda0442c"),
  "duong-trang-bien-hoa-1kg": u("photo-1546069901-ba9599a7e63c"),
  "dau-an-neptune-1l": u("photo-1474979266404-7eaacbcd87c5"),
  "tuong-ot-cholimex": u("photo-1599909533730-b27de933e0c1"),
  "hat-nem-knorr-400g": u("photo-1596040033229-a9821ebd058d"),
  "bot-ngot-ajinomoto": u("photo-1506368249639-51aebc4f0c87"),
  "nuoc-tuong-maggi-700ml": u("photo-1615485500704-8e990f9900f7"),
  "tuong-ca-cholimex": u("photo-1604908176997-125f25cc6f3d"),
  "muoi-tieu-xay-100g": u("photo-1599909533730-b27de933e0c1"),
  "gao-st25-5kg": u("photo-1586201375761-83865001e31c"),
  "gao-tam-xoan-5kg": u("photo-1536304993881-ff6e9ebee36b"),

  // Bánh kẹo
  "banh-quy-cosy-marie": u("photo-1558961363-fa8fdf86f2cf"),
  "keo-alpenliebe-120g": u("photo-1582058091505-f87a2e55a40f"),
  "banh-oreo-133g": u("photo-1499636136210-6f4ee915583e"),
  "snack-oishi-40g": u("photo-1621939514649-cdc8f2555400"),
  "banh-choco-pie-12": u("photo-1606312619070-d48b4cbcba05"),
  "keo-mentos-trai-cay": u("photo-1575224300306-1b8da36134ec"),

  // Đông lạnh
  "xuc-xich-cp-500g": u("photo-1607623814075-e51df1bdc82f"),
  "ha-cao-tom-thit": u("photo-1496116218417-1a781b1c416c"),
  "ca-vien-chi-town": u("photo-1565557623262-b51c2513a641"),
  "thit-bo-vien-300g": u("photo-1529692236671-f1f6cf9683ba"),
  "cha-gio-tom-thit": u("photo-1626804475297-41608ea09aeb"),
  "kem-cay-merino": u("photo-1563805042-7684c019e1cb"),

  // Mì gói
  "mi-hao-hao-tom-chua-cay": u("photo-1612929633738-8fe44f7ec841"),
  "mi-omachi-sot-bo-ham": u("photo-1569718212165-3a8278d5f624"),
  "mi-kokomi-tom-chua-cay": u("photo-1552611052-33e04de081de"),
  "pho-de-nhat-bo": u("photo-1582878826623-77b7ad9cfc1c"),
  "mi-3-mien-gold": u("photo-1617093727343-374698b1b08d"),
  "hu-tieu-nam-vang": u("photo-1569058242253-92a9c755a0ec"),
  "mi-ly-handy-hao-hao": u("photo-1547592166-23ac45744acd"),
  "chao-to-yen-an-lien": u("photo-1546069901-ba9599a7e63c"),

  // Sữa
  "sua-tuoi-vinamilk-1l": u("photo-1563636619-e9143da7973b"),
  "sua-dac-ong-tho": u("photo-1550583724-b2692b85b150"),
  "sua-chua-vinamilk-loc-4": u("photo-1488477181946-6428a0291777"),
  "sua-th-true-milk-1l": u("photo-1628088062854-d1870b4553da"),
  "sua-dau-nanh-fami": u("photo-1600788886242-5c96aabe3757"),
  "sua-bot-milo-400g": u("photo-1517487881594-2787fef5ebf7"),
  "sua-ensure-gold-400g": u("photo-1593095948071-474c5cc2989d"),
  "pho-mai-con-bo-cuoi": u("photo-1486297678162-eb2a19b0a32d"),

  // Đồ gia dụng
  "bot-giat-omo-3kg": u("photo-1610557892470-55d9e80c0bce"),
  "nuoc-giat-comfort": u("photo-1583947215259-38e31be8751f"),
  "nuoc-rua-chen-sunlight": u("photo-1563453399349-e959747c3089"),
  "nuoc-lau-san-gift": u("photo-1585421514738-01798af8613c"),
  "tui-rac-den-cuon": u("photo-1532996122724-e3c354a0b15b"),
  "giay-ve-sinh-pulppy": u("photo-1584556812952-905ffd0fe312"),
  "khan-giay-bless-you": u("photo-1584556812952-905ffd0fe312"),
  "pin-aa-panasonic": u("photo-1611532736597-de2d4265fba3"),
  "bong-den-led-9w": u("photo-1565814636199-ae9049e0f5c9"),

  // Chăm sóc cá nhân
  "dau-goi-head-shoulders": u("photo-1556228578-0d85b1a4d571"),
  "sua-tam-lifebuoy": u("photo-1556228720-195a672e8a03"),
  "kem-danh-rang-ps": u("photo-1559599101-f09722fb4948"),
  "ban-chai-oral-b": u("photo-1607613009820-a29f7bb81c04"),
  "xa-bong-lifebuoy": u("photo-1600857544200-b2f666aed6e0"),
  "dau-goi-clear-men": u("photo-1522338242992-e1a54906a8da"),
  "khan-uot-lepape": u("photo-1584308666744-24d5c474f2ae"),
  "bong-tan-sensicare": u("photo-1631730486572-226d1f595da1"),

  // Sản phẩm mở rộng thêm
  "aquafina-15l": u("photo-1548839140-29a749e1cf4d"),
  "banh-pocky-socola": u("photo-1481391319762-47dfffb64917"),
  "banh-gao-want-want": u("photo-1599490659213-e2b9527bd087"),
  "banh-quy-afc": u("photo-1559620192-032c4bc4674e"),
  "bi-xanh-non": u("photo-1597362925123-77861d3fbac7"),
  "cam-cara-ruot-do": u("photo-1582979512210-99b6a53386f0"),
  "chuoi-gia-hop": u("photo-1603833665858-e61d17a86224"),
  "chao-yen-mach": u("photo-1517673400267-0251440c45dc"),
  "cha-ca-thac-lat": u("photo-1467003909585-2f8a72700288"),
  "ca-phe-nescafe-lon": u("photo-1495474472287-4d71bcdd2085"),
  "ca-tim-nhat": u("photo-1615485290382-441e4d049cb5"),
  "ca-basa-dong-lanh": u("photo-1519708227418-c8fd9a32b7a2"),
  "cu-cai-duong": u("photo-1437252614745-073787c1a2c0"),
  "dua-luoi-ruot-cam": u("photo-1571575173700-afb9492e6ec1"),
  "dau-oliu-borges": u("photo-1474979266404-7eaacbcd87c5"),
  "fanta-cam-15l": u("photo-1437418747212-8d9709afab22"),
  "giam-tao-huu-co": u("photo-1608571423902-eed4a5ad8108"),
  "ha-cao-nhan-thit": u("photo-1534422298391-e4f8c172dddb"),
  "hu-tieu-vifon-ly": u("photo-1547592166-23ac45744acd"),
  "khoai-tay-chien-dl": u("photo-1573080496219-bb080dd4f877"),
  "mentos-bac-ha": u("photo-1575224300306-1b8da36134ec"),
  "keo-cao-su-cool-air": u("photo-1582058091505-f87a2e55a40f"),
  "le-han-quoc": u("photo-1490885578174-acda8905d2a9"),
  "mayonnaise-aji": u("photo-1472476443507-2f0b6849e5b0"),
  "mirinda-soda-kem": u("photo-1544145945-f90425340c7e"),
  "mi-gau-do": u("photo-1617093727343-374698b1b08d"),
  "mi-lau-thai": u("photo-1552611052-33e04de081de"),
  "mi-ly-hao-hao": u("photo-1569058242253-92a9c755a0ec"),
  "mang-tay-xanh": u("photo-1510627489930-0c1b0bfb6785"),
  "number-one-330": u("photo-1622483767028-3f66f32aef97"),
  "nuoc-mam-chinsu": u("photo-1506368249639-51aebc4f0c87"),
  "nam-kim-cham": u("photo-1504674900247-0877df9cc836"),
  "pho-mai-lat": u("photo-1486297678162-eb2a19b0a32d"),
  "pho-bo-cung-dinh": u("photo-1582878826623-77b7ad9cfc1c"),
  "quyt-duong": u("photo-1547514701-42782101795e"),
  "rau-cai-bo-xoi": u("photo-1512621776951-a57141f2eefd"),
  "rau-mong-toi": u("photo-1540420773420-3366772f4999"),
  "revive-chanh-muoi": u("photo-1621506289937-a8e4df240d0b"),
  "snack-swing-bo": u("photo-1599490659213-e2b9527bd087"),
  "su-hao-da-lat": u("photo-1464226184884-fa280b87c399"),
  "sua-bot-grow-plus": u("photo-1593095948071-474c5cc2989d"),
  "sua-chua-probi": u("photo-1488477181946-6428a0291777"),
  "sua-th-co-duong": u("photo-1628088062854-d1870b4553da"),
  "fami-canxi": u("photo-1600788886242-5c96aabe3757"),
  "sua-dac-ngoi-sao-xanh": u("photo-1550583724-b2692b85b150"),
  "thanh-long-trang": u("photo-1490474418585-ba9bad8fd0ea"),
  "tra-atiso-0-do": u("photo-1576092768241-dec231879fc3"),
  "tra-sua-c2": u("photo-1558857563-b371033873b8"),
  "tao-envy": u("photo-1570913149827-d2ac84ab3f9a"),
  "tom-su-dong-lanh": u("photo-1565680018434-b513d5ea5fe3"),
  "tuong-den-nam-duong": u("photo-1615485500704-8e990f9900f7"),
  "oi-ruby": u("photo-1610832958506-aa56368176cf"),
  "bot-canh-vedan": u("photo-1506368249639-51aebc4f0c87"),
};

/** Pool dự phòng theo danh mục — ảnh thật, xoay để giảm trùng */
const CATEGORY_POOL: Record<string, string[]> = {
  "rau-cu": [
    u("photo-1540420773420-3366772f4999"),
    u("photo-1512621776951-a57141f2eefd"),
    u("photo-1464226184884-fa280b87c399"),
    u("photo-1540420773420-3366772f4999"),
  ],
  "trai-cay": [
    u("photo-1619566636858-adf3ef46400b"),
    u("photo-1490474418585-ba9bad8fd0ea"),
    u("photo-1610832958506-aa56368176cf"),
  ],
  "do-uong": [
    u("photo-1625772299848-391b6a87d7b3"),
    u("photo-1437418747212-8d9709afab22"),
    u("photo-1544145945-f90425340c7e"),
  ],
  "gia-vi": [
    u("photo-1596040033229-a9821ebd058d"),
    u("photo-1506368249639-51aebc4f0c87"),
    u("photo-1472476443507-2f0b6849e5b0"),
  ],
  "banh-keo": [
    u("photo-1481391319762-47dfffb64917"),
    u("photo-1558961363-fa8fdf86f2cf"),
    u("photo-1582058091505-f87a2e55a40f"),
  ],
  "dong-lanh": [
    u("photo-1626804475297-41608ea09aeb"),
    u("photo-1607623814075-e51df1bdc82f"),
    u("photo-1496116218417-1a781b1c416c"),
  ],
  "mi-goi": [
    u("photo-1569718212165-3a8278d5f624"),
    u("photo-1612929633738-8fe44f7ec841"),
    u("photo-1552611052-33e04de081de"),
  ],
  sua: [
    u("photo-1563636619-e9143da7973b"),
    u("photo-1550583724-b2692b85b150"),
    u("photo-1488477181946-6428a0291777"),
  ],
  "do-gia-dung": [
    u("photo-1583947215259-38e31be8751f"),
    u("photo-1610557892470-55d9e80c0bce"),
    u("photo-1563453399349-e959747c3089"),
  ],
  "cham-soc-ca-nhan": [
    u("photo-1556228578-0d85b1a4d571"),
    u("photo-1556228720-195a672e8a03"),
    u("photo-1600857544200-b2f666aed6e0"),
  ],
};

function resolveImage(slug: string, categorySlug: string, index: number): string {
  if (IMAGE_BY_SLUG[slug]) return IMAGE_BY_SLUG[slug];
  const pool = CATEGORY_POOL[categorySlug] || CATEGORY_POOL["rau-cu"];
  return pool[index % pool.length];
}

async function main() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "asc" },
  });

  const usedCount = new Map<string, number>();
  let updated = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    let image = resolveImage(p.slug, p.category.slug, i);

    // Tránh trùng: nếu ảnh đã dùng và không phải map riêng, xoay pool
    if (!IMAGE_BY_SLUG[p.slug]) {
      const pool = CATEGORY_POOL[p.category.slug] || CATEGORY_POOL["rau-cu"];
      let tries = 0;
      while ((usedCount.get(image) || 0) > 0 && tries < pool.length) {
        image = pool[(i + tries + 1) % pool.length];
        tries++;
      }
    }

    usedCount.set(image, (usedCount.get(image) || 0) + 1);

    await prisma.product.update({
      where: { id: p.id },
      data: { image, images: JSON.stringify([image]) },
    });
    await prisma.orderItem.updateMany({
      where: { productId: p.id },
      data: { productImage: image },
    });
    updated++;
    console.log(`${IMAGE_BY_SLUG[p.slug] ? "✓" : "~"} ${p.name}`);
  }

  const unique = usedCount.size;
  const shared = [...usedCount.entries()].filter(([, n]) => n > 1).length;
  console.log(
    JSON.stringify({ total: products.length, updated, uniqueImages: unique, sharedImageGroups: shared }, null, 2)
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
