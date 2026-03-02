import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, code, type } = await req.json();

    if (!email || !code || !type) {
      return NextResponse.json({ error: "email, code, and type are required" }, { status: 400 });
    }

    // Find the most recent OTP
    const otp = await prisma.otpCode.findFirst({
      where: { email, type, verified: false },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ error: "No OTP found. Request a new one." }, { status: 400 });
    }

    if (new Date() > otp.expiresAt) {
      return NextResponse.json({ error: "OTP has expired. Request a new one." }, { status: 400 });
    }

    if (otp.code !== code) {
      return NextResponse.json({ error: "Invalid OTP code" }, { status: 400 });
    }

    // Mark as verified
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    return NextResponse.json({ data: { verified: true } });
  } catch {
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
