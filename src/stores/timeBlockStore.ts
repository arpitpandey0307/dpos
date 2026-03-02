/**
 * TimeBlock Store — manages day's time blocks, active states,
 * and client-side optimistic updates.
 */

import { create } from "zustand";
import type { TimeBlock, TimeBlockStatus } from "@/types";

interface TimeBlockState {
  blocks: TimeBlock[];
  selectedDate: string; // ISO date string YYYY-MM-DD
  isLoading: boolean;
  error: string | null;

  setBlocks: (blocks: TimeBlock[]) => void;
  addBlock: (block: TimeBlock) => void;
  updateBlock: (blockId: string, updates: Partial<TimeBlock>) => void;
  removeBlock: (blockId: string) => void;
  setStatus: (blockId: string, status: TimeBlockStatus) => void;
  setSelectedDate: (date: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  blocks: [],
  selectedDate: new Date().toISOString().split("T")[0],
  isLoading: false,
  error: null,
};

export const useTimeBlockStore = create<TimeBlockState>()((set) => ({
  ...initialState,

  setBlocks: (blocks) => set({ blocks }),

  addBlock: (block) =>
    set((state) => ({
      blocks: [...state.blocks, block].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      ),
    })),

  updateBlock: (blockId, updates) =>
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === blockId ? { ...b, ...updates } : b
      ),
    })),

  removeBlock: (blockId) =>
    set((state) => ({
      blocks: state.blocks.filter((b) => b.id !== blockId),
    })),

  setStatus: (blockId, status) =>
    set((state) => ({
      blocks: state.blocks.map((b) =>
        b.id === blockId ? { ...b, status } : b
      ),
    })),

  setSelectedDate: (date) => set({ selectedDate: date }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
