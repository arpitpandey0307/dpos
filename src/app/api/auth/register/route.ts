import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, signToken, buildAuthCookie } from "@/lib/auth";
import type { RegisterInput } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: RegisterInput = await req.json();
    const { email, password, name, timezone } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "email, password and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, password: hashed, name, timezone: timezone ?? "UTC" },
      select: { id: true, email: true, name: true, timezone: true, createdAt: true },
    });

    const token = signToken({ userId: user.id, email: user.email });

    const res = NextResponse.json(
      { data: { user: { ...user, createdAt: user.createdAt.toISOString() }, token } },
      { status: 201 }
    );

    // Set HTTP-only cookie
    res.headers.set("Set-Cookie", buildAuthCookie(token));
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
