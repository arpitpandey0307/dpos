import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { computeAndSaveDailyScore } from "@/services/scoring.service";

export async function POST(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { date: dateStr } = await req.json();
    const date = dateStr ? new Date(dateStr) : new Date();
    const score = await computeAndSaveDailyScore(auth.userId, date);
    return NextResponse.json({ data: score });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
