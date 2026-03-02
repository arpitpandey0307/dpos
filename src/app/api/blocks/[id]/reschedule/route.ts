import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { rescheduleBlock } from "@/services/timeblock.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { startTime, endTime } = await req.json();
    if (!startTime || !endTime) {
      return NextResponse.json({ error: "startTime and endTime required" }, { status: 400 });
    }
    const block = await rescheduleBlock(auth.userId, id, startTime, endTime);
    return NextResponse.json({ data: block });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
