import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") ?? "30", 10);

  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const scores = await prisma.dailyScore.findMany({
    where: { userId: auth.userId, date: { gte: since } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({
    data: scores.map((s) => ({
      ...s,
      date: s.date.toISOString(),
      calculatedAt: s.calculatedAt.toISOString(),
    })),
  });
}
