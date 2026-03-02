import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getActiveSession } from "@/services/focus.service";

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await getActiveSession(auth.userId);
  return NextResponse.json({ data: session });
}
