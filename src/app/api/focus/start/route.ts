import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { startFocusSession } from "@/services/focus.service";

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { timeBlockId } = await req.json();
    if (!timeBlockId) return NextResponse.json({ error: "timeBlockId required" }, { status: 400 });
    const session = await startFocusSession(auth.userId, timeBlockId);
    return NextResponse.json({ data: session }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
