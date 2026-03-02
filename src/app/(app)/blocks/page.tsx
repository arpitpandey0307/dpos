"use client";

import { useEffect, useState, useCallback } from "react";
import { blocksApi } from "@/lib/api-client";
import { TimelineBlock } from "@/components/TimelineBlock";
import { FocusTimer } from "@/components/FocusTimer";
import { GymSessionForm } from "@/components/GymSessionForm";
import { AddBlockModal } from "@/components/AddBlockModal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDisplayDate, toDateString, minutesToDisplay } from "@/lib/utils";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import type { TimeBlock } from "@/types";

export default function BlocksPage() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [focusBlock, setFocusBlock] = useState<TimeBlock | null>(null);
  const [gymBlock, setGymBlock] = useState<TimeBlock | null>(null);

  const fetchBlocks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await blocksApi.list(toDateString(date));
      setBlocks(data);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  const shiftDate = (d: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + d);
    setDate(next);
  };

  const totalPlanned = blocks
    .filter((b) => b.type !== "FREE")
    .reduce((s, b) => s + b.plannedDuration, 0);

  const totalCompleted = blocks.filter((b) => b.status === "COMPLETED").length;
  const totalBlocks = blocks.filter((b) => b.type !== "FREE").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Time Blocks</h1>
          <p className="text-sm text-slate-500 mt-0.5">Plan and execute your day</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => shiftDate(-1)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-slate-300 min-w-[150px] text-center">
              {formatDisplayDate(date)}
            </span>
            <button onClick={() => shiftDate(1)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
              <ChevronRight size={16} />
            </button>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={13} /> Add Block
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="sm">
          <p className="text-xs text-slate-500">Total Planned</p>
          <p className="text-lg font-semibold text-slate-100 mt-1">{minutesToDisplay(totalPlanned)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="text-lg font-semibold text-slate-100 mt-1">
            {totalCompleted}/{totalBlocks}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-slate-500">Completion Rate</p>
          <p className="text-lg font-semibold text-slate-100 mt-1">
            {totalBlocks === 0 ? "—" : `${Math.round((totalCompleted / totalBlocks) * 100)}%`}
          </p>
        </Card>
      </div>

      {/* Blocks list */}
      <Card padding="none">
        <div className="p-4 flex flex-col gap-2">
          {loading && (
            <p className="text-center text-slate-600 text-sm py-8">Loading…</p>
          )}
          {!loading && blocks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-sm">No blocks for this day.</p>
              <Button className="mt-4" size="sm" onClick={() => setAddOpen(true)}>
                <Plus size={13} /> Create your first block
              </Button>
            </div>
          )}
          {blocks.map((block) => (
            <TimelineBlock
              key={block.id}
              block={block}
              isActive={block.status === "ACTIVE"}
              onStart={(b) => b.type === "GYM" ? setGymBlock(b) : setFocusBlock(b)}
              onComplete={(b) => setFocusBlock(b)}
              onDelete={async (id) => { await blocksApi.delete(id); fetchBlocks(); }}
            />
          ))}
        </div>
      </Card>

      {focusBlock && (
        <FocusTimer
          block={focusBlock}
          open={!!focusBlock}
          onClose={() => setFocusBlock(null)}
          onComplete={() => { setFocusBlock(null); fetchBlocks(); }}
        />
      )}
      {gymBlock && (
        <GymSessionForm
          block={gymBlock}
          open={!!gymBlock}
          onClose={() => setGymBlock(null)}
          onComplete={() => { setGymBlock(null); fetchBlocks(); }}
        />
      )}
      <AddBlockModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        date={toDateString(date)}
        onCreated={fetchBlocks}
      />
    </div>
  );
}
