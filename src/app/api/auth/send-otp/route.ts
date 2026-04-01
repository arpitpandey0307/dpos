import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOTP, sendOTPEmail } from "@/lib/email";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, type } = await req.json();

    if (!email || !type) {
      return NextResponse.json({ error: "email and type are required" }, { status: 400 });
    }

    if (!["REGISTER", "RESET_PASSWORD"].includes(type)) {
      return NextResponse.json({ error: "Invalid OTP type" }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    // For REGISTER: make sure email isn't already registered & verified
    if (type === "REGISTER") {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.emailVerified) {
        return NextResponse.json({ error: "Email already registered" }, { status: 409 });
      }
    }

    // For RESET_PASSWORD: make sure user exists
    if (type === "RESET_PASSWORD") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        // Don't reveal if user exists — return success anyway
        return NextResponse.json({ data: { message: "If this email exists, an OTP has been sent" } });
      }
    }

    // Delete old OTPs for this email+type
    await prisma.otpCode.deleteMany({ where: { email, type } });

    // Generate and save new OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otpCode.create({
      data: { email, code, type, expiresAt },
    });

    // Send email
    try {
      await sendOTPEmail(email, code, type as "REGISTER" | "RESET_PASSWORD");
    } catch (emailError) {
      console.error("Email send error:", emailError);
      // Delete the OTP since email failed
      await prisma.otpCode.deleteMany({ where: { email, code, type } });
      return NextResponse.json({ 
        error: "Failed to send OTP email. Please check email service configuration." 
      }, { status: 500 });
    }

    return NextResponse.json({ data: { message: "OTP sent to your email" } });
  } catch (err) {
    console.error("OTP send error:", err);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
