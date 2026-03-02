"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useAuthStore } from "@/stores/authStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, clearAuth } = useAuthStore();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // Verify session is actually valid by calling /api/auth/me
    async function verifySession() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          // Token expired or invalid — clear local state and redirect
          clearAuth();
          router.replace("/login");
          return;
        }
        setVerified(true);
      } catch {
        clearAuth();
        router.replace("/login");
      }
    }

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    verifySession();
  }, [isAuthenticated, clearAuth, router]);

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-500 text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-56 min-h-screen bg-slate-950">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
