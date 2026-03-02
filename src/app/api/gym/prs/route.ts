import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getExercisePRs } from "@/services/gym.service";

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prs = await getExercisePRs(auth.userId);
  return NextResponse.json({ data: prs });
}
