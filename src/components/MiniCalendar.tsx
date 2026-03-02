"use client";

import { useState, useRef, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MiniCalendarProps {
  selected: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}

export function MiniCalendar({ selected, onChange, onClose }: MiniCalendarProps) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selected));
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div
      ref={ref}
      className="absolute top-full mt-2 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-xl shadow-black/40 p-3 w-[280px]"
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, -1))}
          className="p-1 rounded-md hover:bg-slate-800 text-slate-400"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold text-slate-200">
          {format(viewMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-1 rounded-md hover:bg-slate-800 text-slate-400"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekDays.map((d) => (
          <div key={d} className="text-[10px] text-slate-600 text-center py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const inMonth = isSameMonth(d, viewMonth);
          const isSelected = isSameDay(d, selected);
          const today = isToday(d);

          return (
            <button
              key={i}
              onClick={() => {
                onChange(d);
                onClose();
              }}
              className={`
                h-8 w-full rounded-md text-xs font-medium transition-all
                ${!inMonth ? "text-slate-700" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}
                ${isSelected ? "!bg-violet-600 !text-white" : ""}
                ${today && !isSelected ? "text-violet-400 font-bold" : ""}
              `}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>

      {/* Today shortcut */}
      <button
        onClick={() => { onChange(new Date()); onClose(); }}
        className="w-full mt-2 py-1.5 rounded-lg text-xs font-medium text-violet-400 hover:bg-violet-500/10 transition-colors"
      >
        Today
      </button>
    </div>
  );
}
