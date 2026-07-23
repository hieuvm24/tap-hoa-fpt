import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, isAdminRole } from "@/lib/auth-server";
import { mapProduct, mapCategory, apiSuccess, apiError } from "@/lib/mappers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");
  const search = searchParams.get("search");
  const brand = searchParams.get("brand");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, unknown> = {
    status: "ACTIVE",
  };

  if (category) {
    where.category = { slug: category };
  }
  if (featured === "true") {
    where.isFeatured = true;
  }
  if (search) {
    const isPostgres = (process.env.DATABASE_URL || "").startsWith("postgres");
    where.OR = [
      {
        name: {
          contains: search,
          ...(isPostgres ? { mode: "insensitive" as const } : {}),
        },
      },
      {
        brand: {
          contains: search,
          ...(isPostgres ? { mode: "insensitive" as const } : {}),
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
