import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { updateBlockStatus } from "@/services/timeblock.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const { status } = await req.json();
    if (!status) return NextResponse.json({ error: "status is required" }, { status: 400 });
    const block = await updateBlockStatus(auth.userId, id, status);
    return NextResponse.json({ data: block });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
