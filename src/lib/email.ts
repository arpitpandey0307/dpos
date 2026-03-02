/**
 * DPOS Email Service
 * Sends OTP codes via Resend (HTTP API — no SMTP ports needed).
 * Set RESEND_API_KEY env var in Railway.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function sendOTPEmail(
  to: string,
  otp: string,
  type: "REGISTER" | "RESET_PASSWORD"
): Promise<void> {
  const subject =
    type === "REGISTER"
      ? "DPOS — Verify your email"
      : "DPOS — Reset your password";

  const html = `
    <div style="font-family: -apple-system, sans-serif; max-width: 400px; margin: 0 auto; padding: 32px;">
      <h2 style="color: #e2e8f0; background: #0f172a; padding: 24px; border-radius: 12px; text-align: center;">
        ⚡ DPOS
      </h2>
      <div style="background: #1e293b; padding: 24px; border-radius: 12px; margin-top: 16px;">
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 16px;">
          ${type === "REGISTER" ? "Your verification code is:" : "Your password reset code is:"}
        </p>
        <div style="background: #0f172a; padding: 20px; border-radius: 8px; text-align: center;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #a78bfa;">
            ${otp}
          </span>
        </div>
        <p style="color: #64748b; font-size: 12px; margin: 16px 0 0;">
          This code expires in 10 minutes. Do not share it with anyone.
        </p>
      </div>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: "DPOS <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(error.message || "Failed to send email");
  }
}
