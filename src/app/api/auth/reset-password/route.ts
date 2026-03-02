import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "email, code, and newPassword are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check OTP is verified 
    const otp = await prisma.otpCode.findFirst({
      where: { email, type: "RESET_PASSWORD", code, verified: true },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ error: "Invalid or unverified OTP" }, { status: 400 });
    }

    // Check not expired (allow 15 min window after verification)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (otp.createdAt < fifteenMinAgo) {
      return NextResponse.json({ error: "OTP has expired. Request a new one." }, { status: 400 });
    }

    // Update password
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    // Clean up OTPs
    await prisma.otpCode.deleteMany({ where: { email, type: "RESET_PASSWORD" } });

    return NextResponse.json({ data: { message: "Password reset successful" } });
  } catch {
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}
