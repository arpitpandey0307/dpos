import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, email: true, name: true, bio: true, profilePicture: true, timezone: true, createdAt: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    data: { user: { ...user, createdAt: user.createdAt.toISOString() } },
  });
}
