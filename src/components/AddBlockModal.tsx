"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { blocksApi } from "@/lib/api-client";
import type { CreateTimeBlockInput, TimeBlockType } from "@/types";

interface AddBlockModalProps {
  open: boolean;
  onClose: () => void;
  date: string; // YYYY-MM-DD
  onCreated: () => void;
}

export function AddBlockModal({ open, onClose, date, onCreated }: AddBlockModalProps) {
  const [form, setForm] = useState<{
    title: string;
    type: TimeBlockType;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
  }>({
    title: "",
    type: "STUDY",
    startTime: "09:00",
    endTime: "10:00",
    isRecurring: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const startTime = new Date(`${date}T${form.startTime}:00`).toISOString();
      const endTime = new Date(`${date}T${form.endTime}:00`).toISOString();

      const input: CreateTimeBlockInput = {
        title: form.title.trim(),
        type: form.type,
        startTime,
        endTime,
        date: new Date(date).toISOString(),
        isRecurring: form.isRecurring,
      };

      await blocksApi.create(input);
      onCreated();
      onClose();

      // Reset
      setForm({ title: "", type: "STUDY", startTime: "09:00", endTime: "10:00", isRecurring: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create block");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Time Block" size="sm">
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          placeholder="e.g. Data Structures Study"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
        <Select
          label="Type"
          value={form.type}
          onChange={(e) => set("type", e.target.value)}
          options={["CLASS", "STUDY", "GYM", "MEETING", "FREE"].map((t) => ({
            value: t,
            label: t,
          }))}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Start Time"
            type="time"
            value={form.startTime}
            onChange={(e) => set("startTime", e.target.value)}
          />
          <Input
            label="End Time"
            type="time"
            value={form.endTime}
            onChange={(e) => set("endTime", e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isRecurring}
            onChange={(e) => set("isRecurring", e.target.checked)}
            className="accent-violet-500"
          />
          Recurring block
        </label>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <Button loading={submitting} onClick={handleSubmit}>
          Create Block
        </Button>
      </div>
    </Modal>
  );
}
