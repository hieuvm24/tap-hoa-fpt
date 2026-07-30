import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/mappers";

/** Liveness / readiness — dùng cho deploy & giám sát */
export async function GET() {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return apiSuccess({
      status: "ok",
      database: "up",
      uptimeMs: Math.round(process.uptime() * 1000),
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return apiError("Database unavailable", 503);
  }
}
