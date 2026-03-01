import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, startOfDay, parseISO } from "date-fns";
import type { TimeBlockType, TimeBlockStatus } from "@/types";

// ─────────────────────────────────────────
// TailwindCSS class utility
// ─────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────
// Date utilities
// ─────────────────────────────────────────

/** Normalize a date to midnight UTC for consistent date-only comparisons */
export function normalizeDate(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return startOfDay(d);
}

/** Format a date to YYYY-MM-DD string */
export function toDateString(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd");
}

/** Format display date e.g. "Monday, Mar 2" */
export function formatDisplayDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE, MMM d");
}

/** Format time e.g. "09:30 AM" */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "hh:mm aa");
}

/** Convert minutes to human-readable string. e.g. 90 → "1h 30m" */
export function minutesToDisplay(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/** Calculate duration in minutes between two ISO strings */
export function durationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

// ─────────────────────────────────────────
// Time block utilities
// ─────────────────────────────────────────

export function blockTypeColor(type: TimeBlockType): string {
  const map: Record<TimeBlockType, string> = {
    CLASS:   "bg-blue-500/20 border-blue-500 text-blue-300",
    STUDY:   "bg-violet-500/20 border-violet-500 text-violet-300",
    GYM:     "bg-green-500/20 border-green-500 text-green-300",
    MEETING: "bg-amber-500/20 border-amber-500 text-amber-300",
    FREE:    "bg-slate-500/20 border-slate-500 text-slate-300",
  };
  return map[type] ?? map.FREE;
}

export function blockStatusBadge(status: TimeBlockStatus): string {
  const map: Record<TimeBlockStatus, string> = {
    PENDING:   "bg-slate-700 text-slate-300",
    ACTIVE:    "bg-blue-600 text-white",
    COMPLETED: "bg-green-700 text-green-100",
    MISSED:    "bg-red-700/50 text-red-300",
  };
  return map[status] ?? map.PENDING;
}

// ─────────────────────────────────────────
// Score utilities
// ─────────────────────────────────────────

export function scoreToGrade(score: number): string {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-green-400";
  if (score >= 60) return "text-amber-400";
  return "text-red-400";
}

export function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta.toFixed(1)}`;
  if (delta < 0) return delta.toFixed(1);
  return "±0";
}

// ─────────────────────────────────────────
// Conflict detection
// ─────────────────────────────────────────

export function hasTimeConflict(
  blocks: { startTime: string; endTime: string; id?: string }[],
  newBlock: { startTime: string; endTime: string; id?: string }
): boolean {
  const newStart = new Date(newBlock.startTime).getTime();
  const newEnd = new Date(newBlock.endTime).getTime();
  return blocks.some((b) => {
    if (b.id && b.id === newBlock.id) return false; // skip self
    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();
    return newStart < bEnd && newEnd > bStart;
  });
}

// ─────────────────────────────────────────
// Volume calculation
// ─────────────────────────────────────────

export function calcVolume(sets: number, reps: number, weight: number): number {
  return sets * reps * weight;
}
