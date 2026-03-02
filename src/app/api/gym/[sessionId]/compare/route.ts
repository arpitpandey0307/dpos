import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { compareWithPreviousSession } from "@/services/gym.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const auth = getAuthUser(req.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sessionId } = await params;
  try {
    const comparison = await compareWithPreviousSession(auth.userId, sessionId);
    return NextResponse.json({ data: comparison });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 404 });
  }
}
