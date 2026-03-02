import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { createGymSession, getRecentGymSessions } from "@/services/gym.service";
import { computeAndSaveDailyScore } from "@/services/scoring.service";

export async function POST(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const session = await createGymSession(auth.userId, body);

    // Recalculate score after gym completion
    await computeAndSaveDailyScore(auth.userId, new Date());

    return NextResponse.json({ data: session }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessions = await getRecentGymSessions(auth.userId);
  return NextResponse.json({ data: sessions });
}
