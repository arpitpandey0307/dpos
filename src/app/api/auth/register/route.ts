import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, signToken, buildAuthCookie } from "@/lib/auth";
import type { RegisterInput } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, timezone, otpCode } = body as RegisterInput & { otpCode: string };

    if (!email || !password || !name || !otpCode) {
      return NextResponse.json(
        { error: "email, password, name, and OTP code are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Verify OTP was validated
    const otp = await prisma.otpCode.findFirst({
      where: { email, type: "REGISTER", code: otpCode, verified: true },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ error: "Email not verified. Please verify OTP first." }, { status: 400 });
    }

    // Check OTP not too old (15 min window)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (otp.createdAt < fifteenMinAgo) {
      return NextResponse.json({ error: "OTP expired. Please request a new one." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.emailVerified) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await hashPassword(password);

    let user;
    if (existing && !existing.emailVerified) {
      // Update unverified user
      user = await prisma.user.update({
        where: { id: existing.id },
        data: { password: hashed, name, timezone: timezone ?? "UTC", emailVerified: true },
        select: { id: true, email: true, name: true, timezone: true, createdAt: true },
      });
    } else {
      user = await prisma.user.create({
        data: { email, password: hashed, name, timezone: timezone ?? "UTC", emailVerified: true },
        select: { id: true, email: true, name: true, timezone: true, createdAt: true },
      });
    }

    // Clean up OTPs
    await prisma.otpCode.deleteMany({ where: { email, type: "REGISTER" } });

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
