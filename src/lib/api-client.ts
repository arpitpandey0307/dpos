/**
 * DPOS API Client
 * Typed fetch wrapper that injects the auth token and handles errors.
 * All API calls go through this — no raw fetch() in components.
 */

import { useAuthStore } from "@/stores/authStore";
import type { ApiResponse } from "@/types";

const BASE = "/api";

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok) {
    throw new Error(json.error ?? `Request failed: ${res.status}`);
  }

  return json.data as T;
}

// ─────────────────────────────────────────
// Auth
// ─────────────────────────────────────────
export const authApi = {
  register: (body: { email: string; password: string; name: string; timezone?: string; otpCode: string }) =>
    request<{ user: import("@/types").User; token: string }>("POST", "/auth/register", body),

  login: (body: { email: string; password: string }) =>
    request<{ user: import("@/types").User; token: string }>("POST", "/auth/login", body),

  logout: () =>
    request<null>("POST", "/auth/logout"),

  me: () => request<{ user: import("@/types").User }>("GET", "/auth/me"),

  sendOtp: (body: { email: string; type: "REGISTER" | "RESET_PASSWORD" }) =>
    request<{ message: string }>("POST", "/auth/send-otp", body),

  verifyOtp: (body: { email: string; code: string; type: "REGISTER" | "RESET_PASSWORD" }) =>
    request<{ verified: boolean }>("POST", "/auth/verify-otp", body),

  resetPassword: (body: { email: string; code: string; newPassword: string }) =>
    request<{ message: string }>("POST", "/auth/reset-password", body),
};

// ─────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────
export const dashboardApi = {
  get: (date?: string) =>
    request<import("@/types").DashboardData>("GET", `/dashboard${date ? `?date=${date}` : ""}`),
};

// ─────────────────────────────────────────
// Time Blocks
// ─────────────────────────────────────────
export const blocksApi = {
  list: (date: string) =>
    request<import("@/types").TimeBlock[]>("GET", `/blocks?date=${date}`),

  create: (body: import("@/types").CreateTimeBlockInput) =>
    request<import("@/types").TimeBlock>("POST", "/blocks", body),

  update: (id: string, body: Partial<import("@/types").TimeBlock>) =>
    request<import("@/types").TimeBlock>("PATCH", `/blocks/${id}`, body),

  updateStatus: (id: string, status: import("@/types").TimeBlockStatus) =>
    request<import("@/types").TimeBlock>("PATCH", `/blocks/${id}/status`, { status }),

  reschedule: (id: string, startTime: string, endTime: string) =>
    request<import("@/types").TimeBlock>("PATCH", `/blocks/${id}/reschedule`, { startTime, endTime }),

  delete: (id: string) =>
    request<void>("DELETE", `/blocks/${id}`),
};

// ─────────────────────────────────────────
// Focus Sessions
// ─────────────────────────────────────────
export const focusApi = {
  start: (timeBlockId: string) =>
    request<import("@/types").FocusSession>("POST", "/focus/start", { timeBlockId }),

  complete: (body: import("@/types").CreateFocusSessionInput) =>
    request<import("@/types").FocusSession>("POST", "/focus/complete", body),

  getActive: () =>
    request<import("@/types").FocusSession | null>("GET", "/focus/active"),
};

// ─────────────────────────────────────────
// Gym
// ─────────────────────────────────────────
export const gymApi = {
  create: (body: import("@/types").CreateGymSessionInput) =>
    request<import("@/types").GymSession>("POST", "/gym", body),

  getByBlock: (timeBlockId: string) =>
    request<import("@/types").GymSession>("GET", `/gym/block/${timeBlockId}`),

  recent: () =>
    request<import("@/types").GymSession[]>("GET", "/gym/recent"),

  compare: (sessionId: string) =>
    request<import("@/types").GymComparison>("GET", `/gym/${sessionId}/compare`),

  prs: () =>
    request<import("@/types").ExercisePR[]>("GET", "/gym/prs"),
};

// ─────────────────────────────────────────
// Notes
// ─────────────────────────────────────────
export const notesApi = {
  getDailyNote: (date: string) =>
    request<import("@/types").DailyNote>("GET", `/notes/daily?date=${date}`),

  upsertDailyNote: (body: import("@/types").UpsertDailyNoteInput) =>
    request<import("@/types").DailyNote>("PUT", "/notes/daily", body),

  getStickyNotes: () =>
    request<import("@/types").StickyNote[]>("GET", "/notes/sticky"),

  createStickyNote: (body: import("@/types").CreateStickyNoteInput) =>
    request<import("@/types").StickyNote>("POST", "/notes/sticky", body),

  updateStickyNote: (id: string, body: Partial<import("@/types").StickyNote>) =>
    request<import("@/types").StickyNote>("PATCH", `/notes/sticky/${id}`, body),

  deleteStickyNote: (id: string) =>
    request<void>("DELETE", `/notes/sticky/${id}`),
};

// ─────────────────────────────────────────
// Scores
// ─────────────────────────────────────────
export const scoreApi = {
  recalculate: (date: string) =>
    request<import("@/types").DailyScore>("POST", "/scores/calculate", { date }),

  history: (days?: number) =>
    request<import("@/types").DailyScore[]>("GET", `/scores/history${days ? `?days=${days}` : ""}`),
};

// ─────────────────────────────────────────
// Profile
// ─────────────────────────────────────────
export const profileApi = {
  get: () =>
    request<import("@/types").User>("GET", "/profile"),

  update: (body: { name?: string; bio?: string; profilePicture?: string }) =>
    request<import("@/types").User>("PATCH", "/profile", body),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>("POST", "/profile/password", body),
};
