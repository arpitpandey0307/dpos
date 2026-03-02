import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/profile — get current user profile
export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      profilePicture: true,
      timezone: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    data: { ...user, createdAt: user.createdAt.toISOString() },
  });
}

// PATCH /api/profile — update name, bio, profilePicture
export async function PATCH(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, bio, profilePicture } = body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (bio !== undefined) updateData.bio = bio;
  if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      profilePicture: true,
      timezone: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    data: { ...user, createdAt: user.createdAt.toISOString() },
  });
}
