"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { gymApi } from "@/lib/api-client";
import { Plus, Trash2 } from "lucide-react";
import type { TimeBlock, CreateGymSessionInput, WorkoutType } from "@/types";

interface GymSessionFormProps {
  block: TimeBlock;
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface ExerciseRow {
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
}

const emptyExercise = (): ExerciseRow => ({
  exerciseName: "",
  sets: 3,
  reps: 10,
  weight: 0,
});

export function GymSessionForm({ block, open, onClose, onComplete }: GymSessionFormProps) {
  const [workoutType, setWorkoutType] = useState<WorkoutType>("PUSH");
  const [intensity, setIntensity] = useState(3);
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseRow[]>([emptyExercise()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateExercise = (idx: number, field: keyof ExerciseRow, value: string | number) => {
    setExercises((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
    );
  };

  const handleSubmit = async () => {
    const valid = exercises.every((e) => e.exerciseName.trim() !== "");
    if (!valid) {
      setError("All exercises must have a name");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const input: CreateGymSessionInput = {
        timeBlockId: block.id,
        workoutType,
        perceivedIntensity: intensity,
        notes: notes.trim() || undefined,
        exerciseEntries: exercises.map((e) => ({
          exerciseName: e.exerciseName.trim(),
          sets: Number(e.sets),
          reps: Number(e.reps),
          weight: Number(e.weight),
        })),
      };
      await gymApi.create(input);
      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Log Gym Session" size="lg">
      <div className="flex flex-col gap-5">
        {/* Header fields */}
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Workout Type"
            value={workoutType}
            onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
            options={["PUSH", "PULL", "LEGS", "CARDIO", "CUSTOM"].map((t) => ({
              value: t,
              label: t,
            }))}
          />
          <Select
            label="Perceived Intensity (1–5)"
            value={String(intensity)}
            onChange={(e) => setIntensity(Number(e.target.value))}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))}
          />
        </div>

        {/* Exercises table */}
        <div>
          <p className="text-xs font-medium text-slate-400 mb-2">Exercises</p>
          <div className="flex flex-col gap-2">
            {exercises.map((ex, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_60px_60px_80px_32px] gap-2 items-end">
                <Input
                  placeholder="Exercise name"
                  value={ex.exerciseName}
                  onChange={(e) => updateExercise(idx, "exerciseName", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Sets"
                  value={ex.sets}
                  onChange={(e) => updateExercise(idx, "sets", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Reps"
                  value={ex.reps}
                  onChange={(e) => updateExercise(idx, "reps", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="kg"
                  value={ex.weight}
                  onChange={(e) => updateExercise(idx, "weight", e.target.value)}
                />
                <button
                  onClick={() => setExercises((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-slate-600 hover:text-red-400 transition-colors pb-2"
                  disabled={exercises.length === 1}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[1fr_60px_60px_80px_32px] gap-2 mt-1 px-0.5">
            {["Name", "Sets", "Reps", "Weight(kg)", ""].map((h) => (
              <span key={h} className="text-[10px] text-slate-600">{h}</span>
            ))}
          </div>

          <button
            onClick={() => setExercises((prev) => [...prev, emptyExercise()])}
            className="mt-3 flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300"
          >
            <Plus size={12} /> Add exercise
          </button>
        </div>

        {/* Notes */}
        <Textarea
          label="Session Notes (optional)"
          placeholder="How did it go?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <Button loading={submitting} onClick={handleSubmit}>
          Save Workout
        </Button>
      </div>
    </Modal>
  );
}
