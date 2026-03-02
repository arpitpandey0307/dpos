"use client";

import { useEffect, useState, useCallback } from "react";
import { gymApi } from "@/lib/api-client";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { calcVolume, formatDisplayDate } from "@/lib/utils";
import { Dumbbell, TrendingUp, Trophy } from "lucide-react";
import type { GymSession, ExercisePR } from "@/types";

export default function GymPage() {
  const [sessions, setSessions] = useState<GymSession[]>([]);
  const [prs, setPRs] = useState<ExercisePR[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const fetchGymData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p] = await Promise.all([gymApi.recent(), gymApi.prs()]);
      setSessions(s);
      setPRs(p);
      if (s.length > 0 && !selected) setSelected(s[0].id);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGymData();
  }, [fetchGymData]);

  // Re-fetch when a gym session is completed (dispatched from GymSessionForm)
  useEffect(() => {
    const handler = () => fetchGymData();
    window.addEventListener("gym-session-completed", handler);
    return () => window.removeEventListener("gym-session-completed", handler);
  }, [fetchGymData]);

  // Re-fetch when tab becomes visible (user navigates back)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === "visible") fetchGymData();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [fetchGymData]);

  const selectedSession = sessions.find((s) => s.id === selected);

  const totalVolume = (session: GymSession) =>
    session.exerciseEntries.reduce(
      (sum, e) => sum + calcVolume(e.sets, e.reps, e.weight),
      0
    );

  const workoutTypeColor: Record<string, string> = {
    PUSH: "bg-orange-500/20 border-orange-500 text-orange-300",
    PULL: "bg-blue-500/20 border-blue-500 text-blue-300",
    LEGS: "bg-green-500/20 border-green-500 text-green-300",
    CARDIO: "bg-red-500/20 border-red-500 text-red-300",
    CUSTOM: "bg-slate-500/20 border-slate-500 text-slate-300",
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Dumbbell size={20} className="text-green-400" /> Gym Performance
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Track workout volume and PRs</p>
      </div>

      {loading && (
        <p className="text-slate-600 text-center py-12">Loading sessions…</p>
      )}

      {!loading && (
        <div className="grid grid-cols-3 gap-5">
          {/* Left: session list */}
          <div className="col-span-1 flex flex-col gap-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Recent Sessions
            </p>
            {sessions.length === 0 && (
              <p className="text-xs text-slate-600">No sessions yet. Log a gym block.</p>
            )}
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`w-full text-left rounded-xl p-4 border transition-all ${
                  selected === s.id
                    ? "border-violet-500/50 bg-violet-500/10"
                    : "border-slate-800 bg-slate-900 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Badge
                    label={s.workoutType}
                    className={workoutTypeColor[s.workoutType] ?? ""}
                  />
                  <span className="text-[10px] text-slate-500">
                    RPE {s.perceivedIntensity}/5
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  {formatDisplayDate(s.completedAt)}
                </p>
                <p className="text-sm font-semibold text-slate-100 mt-0.5">
                  {totalVolume(s).toLocaleString()} kg vol
                </p>
              </button>
            ))}
          </div>

          {/* Right: selected session detail + PRs */}
          <div className="col-span-2 flex flex-col gap-4">
            {selectedSession && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={14} /> Session Detail
                  </CardTitle>
                  <span className="text-xs text-slate-500">
                    {formatDisplayDate(selectedSession.completedAt)}
                  </span>
                </CardHeader>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] text-slate-500 border-b border-slate-800">
                        <th className="text-left pb-2">Exercise</th>
                        <th className="text-center pb-2">Sets</th>
                        <th className="text-center pb-2">Reps</th>
                        <th className="text-center pb-2">Weight</th>
                        <th className="text-right pb-2">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSession.exerciseEntries.map((e) => (
                        <tr key={e.id} className="border-b border-slate-800/50">
                          <td className="py-2.5 text-slate-200">{e.exerciseName}</td>
                          <td className="text-center text-slate-400">{e.sets}</td>
                          <td className="text-center text-slate-400">{e.reps}</td>
                          <td className="text-center text-slate-400">{e.weight}kg</td>
                          <td className="text-right text-slate-300">
                            {calcVolume(e.sets, e.reps, e.weight).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="pt-3 text-xs text-slate-500">
                          Total Volume
                        </td>
                        <td className="text-right pt-3 font-semibold text-green-400">
                          {totalVolume(selectedSession).toLocaleString()} kg
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {selectedSession.notes && (
                  <p className="mt-4 text-xs text-slate-500 bg-slate-800/50 rounded-lg p-3">
                    {selectedSession.notes}
                  </p>
                )}
              </Card>
            )}

            {/* PRs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy size={14} className="text-amber-400" /> Personal Records
                </CardTitle>
              </CardHeader>
              {prs.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">
                  Complete sessions to see PRs
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                {prs.slice(0, 8).map((pr) => (
                  <div
                    key={pr.exerciseName}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3"
                  >
                    <p className="text-xs text-slate-400 truncate">{pr.exerciseName}</p>
                    <p className="text-sm font-semibold text-amber-300 mt-0.5">
                      {pr.maxWeight}kg
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {pr.maxVolume.toLocaleString()} vol
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
