import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapProduct, mapCategory, apiSuccess, apiError } from "@/lib/mappers";
import { normalizeVi, slugifyVi } from "@/lib/normalize-vi";

export async function GET(req: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const search =
    searchParams.get("search")?.trim() ||
    searchParams.get("q")?.trim() ||
    "";
  const brand = searchParams.get("brand");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const all = searchParams.get("all") === "true";
  const statusFilter = searchParams.get("status");
  const idsParam = searchParams.get("ids")?.trim() || "";

  const where: Record<string, unknown> = {};

  // Lấy theo danh sách id (gợi ý / đã xem gần đây)
  if (idsParam) {
    const ids = idsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50);
    if (ids.length === 0) {
      return apiSuccess({ products: [], total: 0, brands: [] });
    }
    const byIds = await prisma.product.findMany({
      where: {
        id: { in: ids },
        ...(session && isAdminRole(session.role) ? {} : { status: "ACTIVE" }),
      },
      include: { category: true },
    });
    const orderMap = new Map(ids.map((id, i) => [id, i]));
    byIds.sort(
      (a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99)
    );
    return apiSuccess({
      products: byIds.map(mapProduct),
      total: byIds.length,
      brands: [],
    });
  }

  // Khách chỉ thấy ACTIVE; admin có thể ?all=true hoặc ?status=
  if (all && session && isAdminRole(session.role)) {
    if (statusFilter === "active") where.status = "ACTIVE";
    else if (statusFilter === "inactive") where.status = "INACTIVE";
  } else {
    where.status = "ACTIVE";
  }

  if (category) {
    where.category = { slug: category };
  }
  if (featured === "true") {
    where.isFeatured = true;
  }
  if (search) {
    const isPostgres = (process.env.DATABASE_URL || "").startsWith("postgres");
    const mode = isPostgres ? ({ mode: "insensitive" as const }) : {};
    const nq = normalizeVi(search);
    const slugQ = slugifyVi(search);

    // Tim "rau cu" / "Rau củ" → ca danh muc rau-cu (khong chi ten SP)
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
    });
    const matchedCatIds = categories
      .filter((c) => {
        const nn = normalizeVi(c.name);
        const ns = normalizeVi(c.slug.replace(/-/g, " "));
        return (
          nn === nq ||
          nn.includes(nq) ||
          nq.includes(nn) ||
          ns === nq ||
          c.slug === slugQ ||
          c.slug.includes(slugQ) ||
          slugQ.includes(c.slug)
        );
      })
      .map((c) => c.id);

    where.OR = [
      { name: { contains: search, ...mode } },
      { brand: { contains: search, ...mode } },
      { sku: { contains: search, ...mode } },
      { slug: { contains: slugQ, ...mode } },
      ...(matchedCatIds.length
        ? [{ categoryId: { in: matchedCatIds } }]
        : []),
      {
        category: {
          OR: [
            { name: { contains: search, ...mode } },
            { slug: { contains: slugQ, ...mode } },
          ],
        },
      },
    ];
  }
  if (brand) {
    where.brand = brand;
  }
  if (minPrice || maxPrice) {
    where.price = {
      ...(minPrice && { gte: parseInt(minPrice) }),
      ...(maxPrice && { lte: parseInt(maxPrice) }),
    };
  }

  const orderBy =
    sort === "price-asc"
      ? { price: "asc" as const }
      : sort === "price-desc"
        ? { price: "desc" as const }
        : sort === "sold" || sort === "bestsellers"
          ? { soldCount: "desc" as const }
          : sort === "rating"
            ? { rating: "desc" as const }
            : sort === "name"
              ? { name: "asc" as const }
              : { createdAt: "desc" as const };

  const [products, total, brandGroups] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.product.groupBy({
      by: ["brand"],
      where: { status: "ACTIVE" },
    }),
  ]);

  return apiSuccess({
    products: products.map(mapProduct),
    total,
    brands: brandGroups.map((b) => b.brand).sort(),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminRole(session.role)) {
    return apiError("Forbidden", 403);
  }

  const body = await req.json();
  const category = await prisma.category.findUnique({
    where: { slug: body.categorySlug },
  });
  if (!category) return apiError("Danh mục không tồn tại");

  const product = await prisma.product.create({
    data: {
      name: body.name,
      slug: body.slug,
      description: body.description || "",
      price: body.price,
      originalPrice: body.originalPrice || body.price,
      image: body.image,
      images: JSON.stringify(body.images || [body.image]),
      brand: body.brand,
      sku: body.sku,
      stock: body.stock || 0,
      status: body.status === "inactive" ? "INACTIVE" : "ACTIVE",
      isFeatured: body.isFeatured || false,
      isPromotion: body.isPromotion || false,
      specs: JSON.stringify(body.specs || {}),
      categoryId: category.id,
    },
    include: { category: true },
  });

  return apiSuccess(mapProduct(product), 201);
}
