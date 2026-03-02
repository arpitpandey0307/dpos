"use client";

import { useEffect, useState } from "react";
import { notesApi } from "@/lib/api-client";
import { NoteEditor } from "@/components/NoteEditor";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Input";
import { toDateString, formatDisplayDate } from "@/lib/utils";
import { StickyNote, Pin, Trash2, Plus } from "lucide-react";
import type { DailyNote, StickyNote as StickyNoteType } from "@/types";

export default function NotesPage() {
  const [dailyNote, setDailyNote] = useState<DailyNote | null>(null);
  const [stickies, setStickies] = useState<StickyNoteType[]>([]);
  const [newNote, setNewNote] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const todayStr = toDateString(new Date());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [note, sticky] = await Promise.all([
          notesApi.getDailyNote(todayStr),
          notesApi.getStickyNotes(),
        ]);
        setDailyNote(note);
        setStickies(sticky);
      } catch {
        // daily note may be null (404) — that's fine
      } finally {
        setLoading(false);
      }
    })();
  }, [todayStr]);

  const handleCreateSticky = async () => {
    if (!newNote.trim()) return;
    const note = await notesApi.createStickyNote({ content: newNote.trim() });
    setStickies((prev) => [note, ...prev]);
    setNewNote("");
    setAddOpen(false);
  };

  const handleDeleteSticky = async (id: string) => {
    await notesApi.deleteStickyNote(id);
    setStickies((prev) => prev.filter((n) => n.id !== id));
  };

  const handleTogglePin = async (note: StickyNoteType) => {
    const updated = await notesApi.updateStickyNote(note.id, { pinned: !note.pinned });
    setStickies((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <StickyNote size={20} className="text-violet-400" /> Notes
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Daily note + quick capture</p>
      </div>

      {loading ? (
        <p className="text-slate-600 text-center py-12">Loading…</p>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {/* Daily Note */}
          <div className="col-span-2">
            <NoteEditor
              date={todayStr}
              initialNote={dailyNote}
              onSaved={(n) => setDailyNote(n)}
            />
          </div>

          {/* Sticky Notes */}
          <div className="flex flex-col gap-3">
            <Card>
              <CardHeader>
                <CardTitle>Quick Notes</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => setAddOpen(true)}>
                  <Plus size={13} /> Add
                </Button>
              </CardHeader>

              {stickies.length === 0 && (
                <p className="text-xs text-slate-600 text-center py-4">
                  No quick notes yet
                </p>
              )}

              <div className="flex flex-col gap-2">
                {stickies.map((note) => (
                  <div
                    key={note.id}
                    className={`bg-slate-800/60 border rounded-lg p-3 text-xs text-slate-300 relative group ${
                      note.pinned ? "border-violet-500/40" : "border-slate-700/50"
                    }`}
                  >
                    {note.pinned && (
                      <Pin size={10} className="absolute top-2 right-8 text-violet-400" />
                    )}
                    <p className="leading-relaxed">{note.content}</p>
                    <p className="text-[10px] text-slate-600 mt-2">
                      {formatDisplayDate(note.createdAt)}
                    </p>
                    <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                      <button
                        onClick={() => handleTogglePin(note)}
                        className="text-slate-600 hover:text-violet-400 transition-colors"
                      >
                        <Pin size={11} />
                      </button>
                      <button
                        onClick={() => handleDeleteSticky(note.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Add sticky modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New Quick Note" size="sm">
        <div className="flex flex-col gap-4">
          <Textarea
            placeholder="Capture a thought, task, or reminder…"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={4}
          />
          <Button onClick={handleCreateSticky}>Save Note</Button>
        </div>
      </Modal>
    </div>
  );
}
