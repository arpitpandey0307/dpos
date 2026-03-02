"use client";

import { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { focusApi } from "@/lib/api-client";
import { minutesToDisplay } from "@/lib/utils";
import type { TimeBlock, CreateFocusSessionInput } from "@/types";

interface FocusTimerProps {
  block: TimeBlock;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function FocusTimer({ block, open, onClose, onComplete }: FocusTimerProps) {
  const [elapsed, setElapsed] = useState(0); // seconds
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [rating, setRating] = useState(3);
  const [distractions, setDistractions] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<"ready" | "running" | "review">("ready");

  const plannedSeconds = block.plannedDuration * 60;
  const progress = Math.min((elapsed / plannedSeconds) * 100, 100);

  // Timer tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const handleStart = useCallback(async () => {
    const now = new Date().toISOString();
    setStartedAt(now);
    setRunning(true);
    setPhase("running");
    try {
      await focusApi.start(block.id);
    } catch {
      // session may already exist — continue timer regardless
    }
  }, [block.id]);

  const handleStop = () => {
    setRunning(false);
    setPhase("review");
  };

  const handleSubmit = async () => {
    if (!startedAt) return;
    setSubmitting(true);
    try {
      const input: CreateFocusSessionInput = {
        timeBlockId: block.id,
        actualDuration: Math.round(elapsed / 60),
        rating,
        distractionCount: distractions,
        startedAt,
        completedAt: new Date().toISOString(),
      };
      await focusApi.complete(input);
      onComplete();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <Modal open={open} onClose={onClose} title={`Focus: ${block.title}`} size="sm">
      <div className="flex flex-col items-center gap-6">
        {/* Timer display */}
        <div className="relative flex items-center justify-center">
          <svg className="w-36 h-36 -rotate-90">
            <circle cx="72" cy="72" r="60" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="72"
              cy="72"
              r="60"
              fill="none"
              stroke="#7c3aed"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 60}`}
              strokeDashoffset={`${2 * Math.PI * 60 * (1 - progress / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-mono font-bold text-slate-100">
              {formatElapsed(elapsed)}
            </span>
            <span className="text-xs text-slate-500">
              / {minutesToDisplay(block.plannedDuration)}
            </span>
          </div>
        </div>

        {/* Phase: ready */}
        {phase === "ready" && (
          <Button onClick={handleStart} size="lg">
            Start Timer
          </Button>
        )}

        {/* Phase: running */}
        {phase === "running" && (
          <div className="flex gap-3 w-full">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDistractions((d) => d + 1)}
            >
              +1 Distraction ({distractions})
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleStop}>
              Done
            </Button>
          </div>
        )}

        {/* Phase: review */}
        {phase === "review" && (
          <div className="w-full flex flex-col gap-4">
            <p className="text-sm text-slate-400 text-center">
              Actual: <strong className="text-slate-100">{minutesToDisplay(Math.round(elapsed / 60))}</strong>
              {" · "}Distractions: <strong className="text-slate-100">{distractions}</strong>
            </p>
            <Select
              label="Session Rating (1–5)"
              value={String(rating)}
              onChange={(e) => setRating(Number(e.target.value))}
              options={[
                { value: "1", label: "1 — Poor" },
                { value: "2", label: "2 — Below average" },
                { value: "3", label: "3 — Average" },
                { value: "4", label: "4 — Good" },
                { value: "5", label: "5 — Excellent" },
              ]}
            />
            <Button loading={submitting} onClick={handleSubmit}>
              Save Session
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
