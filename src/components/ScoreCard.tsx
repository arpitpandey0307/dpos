"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { scoreToGrade, scoreColor, formatDelta } from "@/lib/utils";
import type { DailyScore } from "@/types";

interface ScoreCardProps {
  today: DailyScore | null;
  yesterday: DailyScore | null;
  delta: number;
}

export function ScoreCard({ today, yesterday, delta }: ScoreCardProps) {
  const score = today?.totalScore ?? 0;
  const grade = scoreToGrade(score);
  const color = scoreColor(score);
  const deltaStr = formatDelta(delta);
  const deltaColor = delta >= 0 ? "text-green-400" : "text-red-400";

  const metrics = [
    {
      label: "Execution Accuracy",
      value: today ? `${(today.executionAccuracy * 100).toFixed(0)}%` : "—",
      sub: "actual / planned",
    },
    {
      label: "Block Completion",
      value: today ? `${(today.blockCompletionRate * 100).toFixed(0)}%` : "—",
      sub: "completed blocks",
    },
    {
      label: "Deep Work",
      value: today ? `${today.deepWorkHours.toFixed(1)}h` : "—",
      sub: "study + class",
    },
    {
      label: "Streak",
      value: today ? `${today.consistencyStreak}d` : "—",
      sub: "consistency",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Score</CardTitle>
        {yesterday && (
          <span className="text-xs text-slate-500">
            Yesterday: <span className="text-slate-300">{yesterday.totalScore.toFixed(1)}</span>
          </span>
        )}
      </CardHeader>

      {/* Main score display */}
      <div className="flex items-end gap-4 mb-6">
        <div className="flex items-baseline gap-2">
          <span className={`text-5xl font-bold tabular-nums ${color}`}>
            {score.toFixed(1)}
          </span>
          <span className="text-2xl font-semibold text-slate-600">/100</span>
        </div>
        <div className="flex flex-col gap-0.5 pb-1">
          <span className={`text-2xl font-bold ${color}`}>{grade}</span>
          {yesterday && (
            <span className={`text-xs font-medium ${deltaColor}`}>{deltaStr}</span>
          )}
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-violet-500 rounded-full transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Metric breakdown */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="bg-slate-800/60 rounded-lg p-3">
            <p className="text-lg font-semibold text-slate-100">{m.value}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{m.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
