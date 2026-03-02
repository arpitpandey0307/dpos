"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { dashboardApi, blocksApi, scoreApi } from "@/lib/api-client";
import { ScoreCard } from "@/components/ScoreCard";
import { TimelineBlock } from "@/components/TimelineBlock";
import { FocusTimer } from "@/components/FocusTimer";
import { GymSessionForm } from "@/components/GymSessionForm";
import { NoteEditor } from "@/components/NoteEditor";
import { AddBlockModal } from "@/components/AddBlockModal";
import { PerformanceGraph } from "@/components/PerformanceGraph";
import { MiniCalendar } from "@/components/MiniCalendar";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDisplayDate, toDateString } from "@/lib/utils";
import { Plus, ChevronLeft, ChevronRight, Dumbbell, Clock, CalendarDays } from "lucide-react";
import type { DashboardData, TimeBlock } from "@/types";

export default function DashboardPage() {
  const { isAuthenticated } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date());

  const [focusBlock, setFocusBlock] = useState<TimeBlock | null>(null);
  const [gymBlock, setGymBlock] = useState<TimeBlock | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [calOpen, setCalOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const d = await dashboardApi.get(toDateString(date));
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    if (isAuthenticated) fetchDashboard();
  }, [isAuthenticated, fetchDashboard]);

  const shiftDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d);
  };

  // Recalculate score and update card + notify graph
  const refreshScore = useCallback(async () => {
    try {
      const dateStr = toDateString(date);
      const newScore = await scoreApi.recalculate(dateStr);
      setData((prev) =>
        prev
          ? {
              ...prev,
              todayScore: newScore,
              scoreDelta: prev.yesterdayScore
                ? newScore.totalScore - prev.yesterdayScore.totalScore
                : 0,
            }
          : prev
      );
      window.dispatchEvent(new Event("score-updated"));
    } catch (err) {
      console.error("Failed to refresh score:", err);
    }
  }, [date]);

  const handleDeleteBlock = async (blockId: string) => {
    // Optimistic UI: remove block from state immediately
    if (data) {
      const removed = data.timeBlocks.find((b) => b.id === blockId);
      setData({
        ...data,
        timeBlocks: data.timeBlocks.filter((b) => b.id !== blockId),
      });
      try {
        await blocksApi.delete(blockId);
        // Refresh score after deletion
        refreshScore();
      } catch {
        // Rollback on error
        if (removed) {
          setData((prev) =>
            prev ? { ...prev, timeBlocks: [...prev.timeBlocks, removed] } : prev
          );
        }
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Did you execute your day properly?</p>
        </div>
        <div className="flex items-center gap-2 relative">
          <button onClick={() => shiftDate(-1)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCalOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <CalendarDays size={14} className="text-violet-400" />
            <span className="text-sm font-medium text-slate-300 min-w-[140px] text-center">
              {formatDisplayDate(date)}
            </span>
          </button>
          <button onClick={() => shiftDate(1)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
            <ChevronRight size={16} />
          </button>
          {calOpen && (
            <MiniCalendar
              selected={date}
              onChange={(d) => setDate(d)}
              onClose={() => setCalOpen(false)}
            />
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-slate-600">
          Loading…
        </div>
      )}

      {!loading && data && (
        <div className="grid grid-cols-3 gap-5">
          {/* LEFT: Timeline */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
              <Card padding="sm">
                <p className="text-xs text-slate-500">Planned</p>
                <p className="text-lg font-semibold text-slate-100 mt-1">
                  {data.plannedHours.toFixed(1)}h
                </p>
              </Card>
              <Card padding="sm">
                <p className="text-xs text-slate-500">Actual</p>
                <p className="text-lg font-semibold text-slate-100 mt-1">
                  {data.actualHours.toFixed(1)}h
                </p>
              </Card>
              <Card padding="sm">
                <p className="text-xs text-slate-500">Gym</p>
                <p className={`text-lg font-semibold mt-1 ${data.gymCompleted ? "text-green-400" : "text-slate-500"}`}>
                  {data.gymCompleted ? "Done" : "Pending"}
                </p>
              </Card>
            </div>

            {/* Timeline */}
            <Card padding="none">
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-500" />
                  <span className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                    Today&apos;s Timeline
                  </span>
                </div>
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus size={13} /> Add Block
                </Button>
              </div>
              <div className="p-4 flex flex-col gap-2">
                {data.timeBlocks.length === 0 && (
                  <p className="text-center text-slate-600 text-sm py-8">
                    No blocks planned. Add one to get started.
                  </p>
                )}
                {data.timeBlocks.map((block) => (
                  <TimelineBlock
                    key={block.id}
                    block={block}
                    isActive={block.status === "ACTIVE"}
                    onStart={(b) =>
                      b.type === "GYM" ? setGymBlock(b) : setFocusBlock(b)
                    }
                    onComplete={(b) => setFocusBlock(b)}
                    onDelete={handleDeleteBlock}
                  />
                ))}
              </div>
            </Card>

            {/* Performance Graph */}
            <PerformanceGraph />

            {/* Daily Note */}
            <NoteEditor
              date={toDateString(date)}
              initialNote={data.dailyNote}
            />
          </div>

          {/* RIGHT: Score + Sticky Notes */}
          <div className="flex flex-col gap-4">
            <ScoreCard
              today={data.todayScore}
              yesterday={data.yesterdayScore}
              delta={data.scoreDelta}
            />

            {/* Sticky Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Notes</CardTitle>
              </CardHeader>
              {data.stickyNotes.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">No sticky notes</p>
              )}
              <div className="flex flex-col gap-2">
                {data.stickyNotes.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-xs text-slate-300"
                  >
                    {n.content.slice(0, 100)}
                    {n.content.length > 100 && "…"}
                  </div>
                ))}
              </div>
            </Card>

            {/* Gym indicator */}
            {data.timeBlocks.some((b) => b.type === "GYM") && (
              <Card padding="sm" className="border-green-500/20">
                <div className="flex items-center gap-2">
                  <Dumbbell size={14} className="text-green-400" />
                  <span className="text-sm text-slate-300">
                    {data.gymCompleted ? "Gym session completed" : "Gym session pending"}
                  </span>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {focusBlock && (
        <FocusTimer
          block={focusBlock}
          open={!!focusBlock}
          onClose={() => setFocusBlock(null)}
          onComplete={() => { setFocusBlock(null); fetchDashboard().then(refreshScore); }}
        />
      )}
      {gymBlock && (
        <GymSessionForm
          block={gymBlock}
          open={!!gymBlock}
          onClose={() => setGymBlock(null)}
          onComplete={() => { setGymBlock(null); fetchDashboard().then(refreshScore); }}
        />
      )}
      <AddBlockModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        date={toDateString(date)}
        onCreated={() => { fetchDashboard().then(refreshScore); }}
      />
    </div>
  );
}
