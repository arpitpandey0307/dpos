"use client";

import { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { scoreApi } from "@/lib/api-client";
import { TrendingUp, Calendar } from "lucide-react";
import type { DailyScore } from "@/types";

type ViewRange = "7d" | "14d" | "30d" | "90d";

interface ChartPoint {
  date: string;
  label: string;
  score: number;
  execution: number;
  completion: number;
  deepWork: number;
}

const VIEW_OPTIONS: { value: ViewRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "14d", label: "14D" },
  { value: "30d", label: "1M" },
  { value: "90d", label: "3M" },
];

const RANGE_DAYS: Record<ViewRange, number> = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "90d": 90,
};

function formatDate(isoStr: string, range: ViewRange): string {
  const d = new Date(isoStr);
  if (range === "90d") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  if (range === "30d") {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

function computeStats(data: ChartPoint[]) {
  if (data.length === 0) return { avg: 0, best: 0, trend: 0 };
  const scores = data.map((d) => d.score);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const best = Math.max(...scores);
  // Trend: difference between last 3 avg and first 3 avg
  const first3 = scores.slice(0, Math.min(3, scores.length));
  const last3 = scores.slice(Math.max(0, scores.length - 3));
  const first3Avg = first3.reduce((a, b) => a + b, 0) / first3.length;
  const last3Avg = last3.reduce((a, b) => a + b, 0) / last3.length;
  const trend = last3Avg - first3Avg;
  return { avg: Math.round(avg * 10) / 10, best, trend: Math.round(trend * 10) / 10 };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-slate-300 font-medium mb-2">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-400">{entry.name}:</span>
          <span className="text-slate-100 font-semibold">
            {entry.name === "Deep Work" ? `${entry.value}h` : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PerformanceGraph() {
  const [range, setRange] = useState<ViewRange>("7d");
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const days = RANGE_DAYS[range];
      const scores: DailyScore[] = await scoreApi.history(days);
      const points: ChartPoint[] = scores.map((s) => ({
        date: s.date,
        label: formatDate(s.date, range),
        score: s.totalScore,
        execution: Math.round(s.executionAccuracy * 100),
        completion: Math.round(s.blockCompletionRate * 100),
        deepWork: Math.round(s.deepWorkHours * 10) / 10,
      }));
      setData(points);
    } catch (err) {
      console.error("Failed to fetch score history:", err);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Re-fetch when score is recalculated
  useEffect(() => {
    const handler = () => fetchHistory();
    window.addEventListener("score-updated", handler);
    return () => window.removeEventListener("score-updated", handler);
  }, [fetchHistory]);

  const stats = computeStats(data);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-violet-400" />
          <CardTitle>Performance Analytics</CardTitle>
        </div>
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                range === opt.value
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </CardHeader>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-violet-400">{stats.avg}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Avg Score</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p className="text-lg font-bold text-green-400">{stats.best}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Best Score</p>
        </div>
        <div className="bg-slate-800/60 rounded-lg p-3 text-center">
          <p
            className={`text-lg font-bold ${
              stats.trend >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {stats.trend >= 0 ? "+" : ""}
            {stats.trend}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Trend</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[240px] w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-600 text-sm">
            Loading chart…
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
            <Calendar size={24} />
            <p className="text-sm">No score data yet. Complete some blocks to see your chart.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="execGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="label"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={{ stroke: "#334155" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={30}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }}
              />
              <Area
                type="monotone"
                dataKey="score"
                name="Score"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#scoreGrad)"
                dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }}
                activeDot={{ r: 5, fill: "#a78bfa", strokeWidth: 2, stroke: "#8b5cf6" }}
              />
              <Area
                type="monotone"
                dataKey="execution"
                name="Execution %"
                stroke="#06b6d4"
                strokeWidth={1.5}
                fill="url(#execGrad)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="completion"
                name="Completion %"
                stroke="#22c55e"
                strokeWidth={1.5}
                fill="none"
                dot={false}
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
