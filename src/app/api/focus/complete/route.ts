import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { completeFocusSession } from "@/services/focus.service";
import { computeAndSaveDailyScore } from "@/services/scoring.service";

export async function POST(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const session = await completeFocusSession(auth.userId, body);

    // Recalculate today's score after completing a session
    await computeAndSaveDailyScore(auth.userId, new Date(body.completedAt ?? Date.now()));

    return NextResponse.json({ data: session });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
