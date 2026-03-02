"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { blockTypeColor, blockStatusBadge, formatTime, minutesToDisplay } from "@/lib/utils";
import { Play, CheckCircle, Clock, Dumbbell, Trash2 } from "lucide-react";
import type { TimeBlock } from "@/types";

interface TimelineBlockProps {
  block: TimeBlock;
  onStart?: (block: TimeBlock) => void;
  onComplete?: (block: TimeBlock) => void;
  onDelete?: (blockId: string) => void;
  isActive?: boolean;
}

export function TimelineBlock({
  block,
  onStart,
  onComplete,
  onDelete,
  isActive,
}: TimelineBlockProps) {
  const colorClass = blockTypeColor(block.type);
  const statusClass = blockStatusBadge(block.status);
  const isGym = block.type === "GYM";
  const isFree = block.type === "FREE";

  const execAccuracy = block.focusSession
    ? Math.min(
        (block.focusSession.actualDuration / block.plannedDuration) * 100,
        100
      ).toFixed(0)
    : null;

  return (
    <div
      className={`relative flex gap-3 rounded-xl border p-4 transition-all ${colorClass} ${
        isActive ? "ring-2 ring-violet-400 ring-offset-2 ring-offset-black" : ""
      }`}
    >
      {/* Time column */}
      <div className="flex flex-col items-end min-w-[60px] pt-0.5">
        <span className="text-xs font-mono text-slate-400">{formatTime(block.startTime)}</span>
        <span className="text-[10px] text-slate-600">{formatTime(block.endTime)}</span>
      </div>

      {/* Divider */}
      <div className="w-px bg-current opacity-30 self-stretch" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-100 truncate">{block.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {minutesToDisplay(block.plannedDuration)}
              {execAccuracy && (
                <span className="ml-2 text-green-400">{execAccuracy}% accuracy</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge label={block.type} className={colorClass} />
            <Badge label={block.status} className={statusClass} />
          </div>
        </div>

        {/* Actions */}
        {!isFree && (
          <div className="flex gap-2 mt-3">
            {block.status === "PENDING" && !isGym && (
              <Button size="sm" variant="secondary" onClick={() => onStart?.(block)}>
                <Play size={12} /> Start Session
              </Button>
            )}
            {(block.status === "ACTIVE" || block.status === "PENDING") && !isGym && (
              <Button size="sm" variant="primary" onClick={() => onComplete?.(block)}>
                <CheckCircle size={12} /> Complete
              </Button>
            )}
            {block.status === "PENDING" && isGym && (
              <Button size="sm" variant="secondary" onClick={() => onStart?.(block)}>
                <Dumbbell size={12} /> Log Workout
              </Button>
            )}
            {block.status === "COMPLETED" && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle size={12} /> Done
              </span>
            )}
            <button
              onClick={() => onDelete?.(block.id)}
              className="ml-auto text-slate-600 hover:text-red-400 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Active pulse */}
      {isActive && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      )}
    </div>
  );
}
