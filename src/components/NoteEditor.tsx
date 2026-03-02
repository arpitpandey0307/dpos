"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { notesApi } from "@/lib/api-client";
import { Save, FileText } from "lucide-react";
import type { DailyNote } from "@/types";

interface NoteEditorProps {
  date: string;  // YYYY-MM-DD ISO
  initialNote?: DailyNote | null;
  onSaved?: (note: DailyNote) => void;
}

export function NoteEditor({ date, initialNote, onSaved }: NoteEditorProps) {
  const [content, setContent] = useState(initialNote?.content ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setContent(initialNote?.content ?? "");
  }, [initialNote]);

  // Autosave after 1.5s of inactivity
  useEffect(() => {
    if (!content.trim()) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => handleSave(content), 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const handleSave = async (text: string) => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const note = await notesApi.upsertDailyNote({ date, content: text });
      setSaved(true);
      onSaved?.(note);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText size={14} /> Daily Note
        </CardTitle>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-green-400">Saved</span>}
          {saving && <span className="text-xs text-slate-500">Saving…</span>}
          <Button
            size="sm"
            variant="ghost"
            loading={saving}
            onClick={() => handleSave(content)}
          >
            <Save size={13} /> Save
          </Button>
        </div>
      </CardHeader>

      <textarea
        className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-sm text-slate-200
          placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none
          font-mono leading-relaxed"
        rows={8}
        placeholder="Markdown supported. Write about your day, tasks, reflections…"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <p className="mt-2 text-[11px] text-slate-600">Autosaved · Markdown supported</p>
    </Card>
  );
}
