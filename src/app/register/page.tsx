"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Input, PasswordInput, Select } from "@/components/ui/Input";
import { AuthBackground } from "@/components/AuthBackground";
import { Zap, ArrowLeft } from "lucide-react";

const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/London", "Europe/Paris", "Europe/Berlin",
  "Asia/Kolkata", "Asia/Tokyo", "Asia/Shanghai", "Australia/Sydney",
];

type Step = "form" | "otp";

export default function RegisterPage() {
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState({
    name: "", email: "", password: "", timezone: "UTC",
  });
  const [otpDigits, setOtpDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await authApi.sendOtp({ email: form.email, type: "REGISTER" });
      setStep("otp");
      setCountdown(60);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 4 digits entered
    if (newDigits.every((d) => d !== "") && newDigits.join("").length === 4) {
      handleVerifyAndRegister(newDigits.join(""));
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
      const newDigits = pasted.split("");
      setOtpDigits(newDigits);
      inputRefs.current[3]?.focus();
      handleVerifyAndRegister(pasted);
    }
  };

  const handleVerifyAndRegister = async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      // Step 1: Verify OTP
      await authApi.verifyOtp({ email: form.email, code, type: "REGISTER" });
      // Step 2: Register with verified OTP code
      const { user, token } = await authApi.register({ ...form, otpCode: code });
      setAuth(user, token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setOtpDigits(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError(null);
    try {
      await authApi.sendOtp({ email: form.email, type: "REGISTER" });
      setCountdown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <AuthBackground />

      <div className="w-full max-w-sm relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Zap size={24} className="text-violet-400" />
          <span className="text-xl font-bold text-slate-100 tracking-tight">DPOS</span>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-8 shadow-2xl shadow-violet-900/10">
          {step === "form" ? (
            <>
              <h1 className="text-lg font-semibold text-slate-100 mb-1">Create account</h1>
              <p className="text-sm text-slate-500 mb-6">Start measuring your execution.</p>

              <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
                <Input
                  label="Name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                />
                <PasswordInput
                  label="Password"
                  placeholder="Min 8 characters"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                />
                <Select
                  label="Timezone"
                  value={form.timezone}
                  onChange={(e) => set("timezone", e.target.value)}
                  options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
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
          ) : (
            <>
              <button
                onClick={() => { setStep("form"); setError(null); }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-4"
              >
                <ArrowLeft size={12} /> Back
              </button>
              <h1 className="text-lg font-semibold text-slate-100 mb-1">Verify your email</h1>
              <p className="text-sm text-slate-500 mb-6">
                Enter the 4-digit code sent to <span className="text-violet-400">{form.email}</span>
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

              {loading && (
                <p className="text-xs text-slate-500 text-center mb-4">Verifying...</p>
              )}

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

          <p className="text-center text-sm text-slate-600 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
