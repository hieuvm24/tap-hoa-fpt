/**
 * Đồng bộ STK cửa hàng + gắn ruleType/categorySlug cho khuyến mãi hiện có.
 * npx tsx scripts/sync-store-promos.ts
 */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_STORE } from "../src/config/defaults";

const prisma = new PrismaClient();

async function main() {
  const store = await prisma.storeSetting.update({
    where: { id: "default" },
    data: {
      bankName: DEFAULT_STORE.bankName,
      bankAccount: DEFAULT_STORE.bankAccount,
      bankOwner: DEFAULT_STORE.bankOwner,
    },
  });
  console.log("Store bank:", store.bankName, store.bankAccount, store.bankOwner);

  const promos = await prisma.promotion.findMany();
  for (const p of promos) {
    const title = p.title.toLowerCase();
    let ruleType = p.ruleType || "banner";
    let categorySlug = p.categorySlug;

    if (title.includes("rau")) {
      ruleType = "percent";
      categorySlug = "rau-cu";
    } else if (title.includes("sữa") || title.includes("sua")) {
      ruleType = "bogo";
      categorySlug = "sua";
    } else if (title.includes("freeship") || title.includes("giao")) {
      ruleType = "banner";
      categorySlug = null;
    }

    await prisma.promotion.update({
      where: { id: p.id },
      data: { ruleType, categorySlug },
    });
    console.log("Promo:", p.title, "→", ruleType, categorySlug);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
