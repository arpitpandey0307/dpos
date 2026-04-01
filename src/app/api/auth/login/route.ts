import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, signToken, buildAuthCookie } from "@/lib/auth";
import type { LoginInput } from "@/types";

// Force dynamic rendering - don't try to prerender this route
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: LoginInput = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({ userId: user.id, email: user.email });

    const res = NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          timezone: user.timezone,
          createdAt: user.createdAt.toISOString(),
        },
        token,
      },
    });

    // Set HTTP-only cookie
    res.headers.set("Set-Cookie", buildAuthCookie(token));
    return res;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
