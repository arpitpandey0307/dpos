"use client";

/**
 * Animated background for auth pages (login, register, forgot-password).
 * Floating gradient orbs + subtle grid + particles — pure CSS animations, no deps.
 */
export function AuthBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating gradient orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-600/20 blur-[120px] animate-float-slow" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-[100px] animate-float-medium" />
      <div className="absolute -bottom-20 left-1/4 w-72 h-72 rounded-full bg-purple-600/15 blur-[100px] animate-float-fast" />
      <div className="absolute top-1/4 left-1/2 w-48 h-48 rounded-full bg-cyan-500/10 blur-[80px] animate-float-reverse" />

      {/* Radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,rgba(2,6,23,0.8)_70%)]" />

      {/* Animated particles (small glowing dots) */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-violet-400/30 animate-particle"
            style={{
              left: `${5 + (i * 47) % 90}%`,
              top: `${3 + (i * 31) % 94}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${4 + (i % 4) * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Subtle scanline effect */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.3) 2px, rgba(139,92,246,0.3) 4px)",
        }}
      />
    </div>
  );
}
