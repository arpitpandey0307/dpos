"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Zap,
  Target,
  BarChart3,
  Clock,
  Dumbbell,
  Brain,
  TrendingUp,
  ChevronRight,
  Star,
  Quote,
} from "lucide-react";

// ─────────────────────────────────────────
// Motivational quotes
// ─────────────────────────────────────────
const QUOTES = [
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements.", author: "John C. Maxwell" },
  { text: "What gets measured gets managed.", author: "Peter Drucker" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
];

// ─────────────────────────────────────────
// Animated score graph (SVG)
// ─────────────────────────────────────────
function AnimatedGraph() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const data = [62, 71, 68, 78, 85, 74, 91];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = 100;
  const w = 500, h = 200, pad = 40;
  const stepX = (w - pad * 2) / (data.length - 1);

  const points = data.map((d, i) => ({
    x: pad + i * stepX,
    y: h - pad - ((d / max) * (h - pad * 2)),
  }));

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaD = pathD + ` L ${points[points.length - 1].x} ${h - pad} L ${points[0].x} ${h - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`w-full transition-opacity duration-1000 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {[25, 50, 75, 100].map((v) => {
        const y = h - pad - ((v / max) * (h - pad * 2));
        return (
          <g key={v}>
            <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#334155" strokeWidth={1} strokeDasharray="4 4" />
            <text x={pad - 8} y={y + 4} textAnchor="end" fill="#64748b" fontSize={10}>{v}</text>
          </g>
        );
      })}
      <path d={areaD} fill="url(#gradient)" opacity={0.3} />
      <path
        d={pathD}
        fill="none"
        stroke="#8b5cf6"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 1000,
          strokeDashoffset: visible ? 0 : 1000,
          transition: "stroke-dashoffset 2s ease-out",
        }}
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle
            cx={p.x}
            cy={p.y}
            r={5}
            fill="#8b5cf6"
            stroke="#0f172a"
            strokeWidth={2}
            style={{ transitionDelay: `${i * 200 + 800}ms`, opacity: visible ? 1 : 0, transition: "opacity 0.5s" }}
          />
          <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#c4b5fd" fontSize={11} fontWeight={600}
            style={{ transitionDelay: `${i * 200 + 800}ms`, opacity: visible ? 1 : 0, transition: "opacity 0.5s" }}
          >
            {data[i]}
          </text>
          <text x={p.x} y={h - pad + 18} textAnchor="middle" fill="#64748b" fontSize={10}>
            {days[i]}
          </text>
        </g>
      ))}
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─────────────────────────────────────────
// Feature card
// ─────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 hover:border-violet-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5">
      <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:bg-violet-500/20 transition-colors">
        <Icon size={22} className="text-violet-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

// ─────────────────────────────────────────
// Stat counter
// ─────────────────────────────────────────
function AnimatedStat({ label, value, suffix = "" }: { label: string; value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40);
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(start);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-violet-400">
        {count}{suffix}
      </p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN HOME PAGE
// ─────────────────────────────────────────
export default function HomePage() {
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx((i) => (i + 1) % QUOTES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const quote = QUOTES[quoteIdx];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={22} className="text-violet-400" />
            <span className="text-lg font-bold tracking-tight">DPOS</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative py-24 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-violet-300 mb-6">
            <Star size={14} /> Daily Performance Operating System
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
            Execute your day.
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Measure everything.
            </span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            DPOS tracks your time blocks, focus sessions, gym performance, and daily scores &mdash;
            giving you a brutally honest picture of how well you execute every single day.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-colors shadow-lg shadow-violet-600/20"
            >
              Start tracking free <ChevronRight size={16} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-7 py-3.5 rounded-xl text-sm transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── MOTIVATIONAL QUOTE BANNER ── */}
      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-gradient-to-br from-violet-900/30 to-slate-900/80 border border-violet-500/20 rounded-2xl p-8 text-center min-h-[140px] flex flex-col items-center justify-center">
            <Quote size={28} className="text-violet-500/40 mb-3" />
            <p className="text-lg md:text-xl font-medium text-slate-200 italic leading-relaxed transition-opacity duration-500">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="mt-3 text-sm text-violet-400 font-medium">&mdash; {quote.author}</p>
            <div className="flex gap-1.5 mt-4">
              {QUOTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setQuoteIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === quoteIdx ? "bg-violet-400" : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PERFORMANCE GRAPH ── */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">Your week at a glance</h2>
            <p className="text-sm text-slate-500 mt-2">Daily performance scores plotted automatically</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">Weekly Average</p>
                <p className="text-2xl font-bold text-violet-400">75.6</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                <TrendingUp size={16} />
                +12% from last week
              </div>
            </div>
            <AnimatedGraph />
          </div>
        </div>
      </section>

      {/* ── STATS ROW ── */}
      <section className="py-12 px-6 border-y border-slate-800/60">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedStat label="Score formula metrics" value={4} />
          <AnimatedStat label="Focus session tracking" value={100} suffix="%" />
          <AnimatedStat label="Gym exercises & PRs" value={50} suffix="+" />
          <AnimatedStat label="Daily insights" value={7} suffix="/week" />
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold">Everything you need to execute</h2>
            <p className="text-sm text-slate-500 mt-2">Six tools working together to measure your daily performance</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard
              icon={Clock}
              title="Time Blocking"
              description="Plan every hour of your day with drag-and-drop blocks. See planned vs actual execution in real time."
            />
            <FeatureCard
              icon={Brain}
              title="Focus Sessions"
              description="Start a Pomodoro-style timer for any block. Track distractions, duration, and rate your focus quality."
            />
            <FeatureCard
              icon={Dumbbell}
              title="Gym Performance"
              description="Log exercises, sets, reps, and weight. Track personal records and compare sessions side-by-side."
            />
            <FeatureCard
              icon={BarChart3}
              title="Daily Scoring"
              description="A 0-100 score computed from execution accuracy, block completion, deep work hours, and consistency streak."
            />
            <FeatureCard
              icon={Target}
              title="Execution Tracking"
              description="See exactly which blocks you completed, missed, or skipped. No more lying to yourself about productivity."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Progress History"
              description="View your score history over time. Spot trends, identify weak days, and build an unstoppable streak."
            />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold">How DPOS works</h2>
            <p className="text-sm text-slate-500 mt-2">Three steps to ruthless self-accountability</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Plan your blocks", desc: "Schedule time blocks for class, study, gym, meetings, and free time. Set start and end times." },
              { step: "02", title: "Execute & track", desc: "Start focus sessions, log gym workouts, mark blocks complete. The system watches everything." },
              { step: "03", title: "See your score", desc: "Get a daily performance score (0-100). Track trends. Build streaks. No hiding from the data." },
            ].map((item) => (
              <div key={item.step} className="relative">
                <span className="text-5xl font-extrabold text-violet-500/10">{item.step}</span>
                <h3 className="text-base font-semibold text-slate-100 mt-2">{item.title}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MORE QUOTES ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold">Fuel for your grind</h2>
            <p className="text-sm text-slate-500 mt-2">Words to keep you executing</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {QUOTES.slice(0, 6).map((q, i) => (
              <div
                key={i}
                className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-violet-500/30 transition-colors"
              >
                <Quote size={18} className="text-violet-500/30 mb-3" />
                <p className="text-sm text-slate-300 italic leading-relaxed">&ldquo;{q.text}&rdquo;</p>
                <p className="mt-3 text-xs text-violet-400 font-medium">&mdash; {q.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SCORE BREAKDOWN ── */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold">The DPOS score formula</h2>
            <p className="text-sm text-slate-500 mt-2">Your daily score is computed from four weighted components</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { pct: "40%", label: "Execution Accuracy", desc: "How close your actual work matches your plan", color: "from-violet-500 to-purple-500" },
              { pct: "30%", label: "Block Completion", desc: "Percentage of scheduled blocks you finished", color: "from-blue-500 to-cyan-500" },
              { pct: "20%", label: "Deep Work Hours", desc: "Focus session time — capped at 4 hours/day", color: "from-emerald-500 to-teal-500" },
              { pct: "10%", label: "Consistency Streak", desc: "Consecutive days with score > 60 — capped at 7", color: "from-amber-500 to-orange-500" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-2xl font-extrabold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>
                    {item.pct}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-100">{item.label}</h3>
                </div>
                <p className="text-sm text-slate-400">{item.desc}</p>
                <div className="mt-3 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                    style={{ width: item.pct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            Stop guessing.
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {" "}Start measuring.
            </span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-lg mx-auto">
            Your potential means nothing without execution. DPOS gives you the data to prove you&apos;re actually doing the work.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-xl text-sm transition-colors shadow-lg shadow-violet-600/20"
            >
              Create free account <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-slate-800/60 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Zap size={16} className="text-violet-500" />
            DPOS &mdash; Built for execution
          </div>
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Daily Performance Operating System
          </p>
        </div>
      </footer>
    </div>
  );
}
