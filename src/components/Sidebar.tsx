"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import {
  LayoutDashboard,
  Clock,
  Dumbbell,
  StickyNote,
  LogOut,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Time Blocks", href: "/blocks", icon: Clock },
  { label: "Gym", href: "/gym", icon: Dumbbell },
  { label: "Notes", href: "/notes", icon: StickyNote },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      // Clear HTTP-only cookie via API
      await fetch("/api/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    clearAuth();
    window.location.href = "/login";
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-slate-950 border-r border-slate-800 flex flex-col z-40">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
        <Zap size={18} className="text-violet-400" />
        <span className="text-base font-bold text-slate-100 tracking-tight">DPOS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 pb-4 border-t border-slate-800 pt-3">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-slate-300 truncate">{user?.name}</p>
          <p className="text-[11px] text-slate-600 truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  );
}
