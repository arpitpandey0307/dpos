import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getGymSessionByBlock } from "@/services/gym.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ timeBlockId: string }> }) {
  const auth = getAuthUser(req.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { timeBlockId } = await params;
  const session = await getGymSessionByBlock(auth.userId, timeBlockId);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: session });
}
