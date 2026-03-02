"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Zap, ArrowLeft, Check } from "lucide-react";

type Step = "email" | "otp" | "newpass" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) { setError("Email is required"); return; }
    setLoading(true);
    try {
      await authApi.sendOtp({ email, type: "RESET_PASSWORD" });
      setStep("otp");
      setCountdown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
    if (newDigits.every((d) => d !== "") && newDigits.join("").length === 4) {
      handleVerifyOTP(newDigits.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length === 4) {
      setOtpDigits(pasted.split(""));
      inputRefs.current[3]?.focus();
      handleVerifyOTP(pasted);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      await authApi.verifyOtp({ email, code, type: "RESET_PASSWORD" });
      setStep("newpass");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
      setOtpDigits(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, code: otpDigits.join(""), newPassword });
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.sendOtp({ email, type: "RESET_PASSWORD" });
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Zap size={24} className="text-violet-400" />
          <span className="text-xl font-bold text-slate-100 tracking-tight">DPOS</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          {step === "email" && (
            <>
              <h1 className="text-lg font-semibold text-slate-100 mb-1">Reset password</h1>
              <p className="text-sm text-slate-500 mb-6">
                Enter your email to receive a verification code.
              </p>
              <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {error && (
                  <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <Button type="submit" loading={loading} className="mt-2 w-full">
                  Send Verification Code
                </Button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <button
                onClick={() => { setStep("email"); setError(null); }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-4"
              >
                <ArrowLeft size={12} /> Back
              </button>
              <h1 className="text-lg font-semibold text-slate-100 mb-1">Enter verification code</h1>
              <p className="text-sm text-slate-500 mb-6">
                Sent to <span className="text-violet-400">{email}</span>
              </p>

              <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-14 h-14 text-center text-2xl font-bold bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all"
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2 mb-4">
                  {error}
                </p>
              )}
              {loading && <p className="text-xs text-slate-500 text-center mb-4">Verifying...</p>}
              <p className="text-center text-xs text-slate-600">
                Didn&apos;t receive the code?{" "}
                {countdown > 0 ? (
                  <span className="text-slate-500">Resend in {countdown}s</span>
                ) : (
                  <button onClick={handleResend} className="text-violet-400 hover:text-violet-300">
                    Resend
                  </button>
                )}
              </p>
            </>
          )}

          {step === "newpass" && (
            <>
              <h1 className="text-lg font-semibold text-slate-100 mb-1">Set new password</h1>
              <p className="text-sm text-slate-500 mb-6">Choose a strong password.</p>
              <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                {error && (
                  <p className="text-xs text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <Button type="submit" loading={loading} className="mt-2 w-full">
                  Reset Password
                </Button>
              </form>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <Check size={20} className="text-green-400" />
              </div>
              <h1 className="text-lg font-semibold text-slate-100 mb-1">Password reset!</h1>
              <p className="text-sm text-slate-500 mb-6">
                You can now sign in with your new password.
              </p>
              <Link href="/login">
                <Button className="w-full">Sign in</Button>
              </Link>
            </div>
          )}

          {step !== "done" && (
            <p className="text-center text-sm text-slate-600 mt-6">
              Remember your password?{" "}
              <Link href="/login" className="text-violet-400 hover:text-violet-300">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
