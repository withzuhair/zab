import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Health check database query failed.", error);
    return Response.json(
      {
        ok: false,
        error: {
          code: "SERVER",
          message: "Database unavailable.",
        },
      },
      { status: 503 },
    );
  }
}
