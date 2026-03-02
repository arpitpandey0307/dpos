/**
 * Dashboard Store — aggregates today's view model data.
 * Populated by the /api/dashboard endpoint on page load.
 */

import { create } from "zustand";
import type { DashboardData } from "@/types";

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null; // timestamp

  setData: (data: DashboardData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  invalidate: () => void;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  data: null,
  isLoading: false,
  error: null,
  lastFetched: null,

  setData: (data) => set({ data, lastFetched: Date.now(), error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  invalidate: () => set({ lastFetched: null }),
}));
