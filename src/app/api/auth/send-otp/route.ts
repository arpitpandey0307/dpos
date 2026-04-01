import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateOTP, sendOTPEmail } from "@/lib/email";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, type } = await req.json();

    console.log("OTP request received:", { email, type });

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
      try {
        console.log("Checking if user exists for REGISTER...");
        const existing = await prisma.user.findUnique({ where: { email } });
        console.log("User check result:", existing ? "exists" : "not found");
        if (existing && existing.emailVerified) {
          return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }
      } catch (dbError) {
        console.error("Database error during user check:", dbError);
        return NextResponse.json({ 
          error: "Database connection error. Please try again later." 
        }, { status: 500 });
      }
    }

    // For RESET_PASSWORD: make sure user exists
    if (type === "RESET_PASSWORD") {
      try {
        console.log("Checking if user exists for RESET_PASSWORD...");
        const user = await prisma.user.findUnique({ where: { email } });
        console.log("User check result:", user ? "exists" : "not found");
        if (!user) {
          // Don't reveal if user exists — return success anyway
          return NextResponse.json({ data: { message: "If this email exists, an OTP has been sent" } });
        }
      } catch (dbError) {
        console.error("Database error during user check:", dbError);
        return NextResponse.json({ 
          error: "Database connection error. Please try again later." 
        }, { status: 500 });
      }
    }

    // Delete old OTPs for this email+type
    console.log("Deleting old OTPs...");
    await prisma.otpCode.deleteMany({ where: { email, type } });

    // Generate and save new OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log("Creating new OTP...");
    await prisma.otpCode.create({
      data: { email, code, type, expiresAt },
    });

    // Send email
    try {
      console.log("Sending OTP email...");
      await sendOTPEmail(email, code, type as "REGISTER" | "RESET_PASSWORD");
      console.log("OTP email sent successfully");
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
