// DPOS — Shared TypeScript Types
// These mirror Prisma models but are used in the application layer
// to maintain separation between DB types and domain types.

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────

export type TimeBlockType = "CLASS" | "STUDY" | "GYM" | "MEETING" | "FREE";
export type TimeBlockStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "MISSED";
export type WorkoutType = "PUSH" | "PULL" | "LEGS" | "CARDIO" | "CUSTOM";

// ─────────────────────────────────────────
// DOMAIN TYPES
// ─────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  timezone: string;
  createdAt: string;
}

export interface TimeBlock {
  id: string;
  userId: string;
  title: string;
  type: TimeBlockType;
  status: TimeBlockStatus;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  plannedDuration: number; // minutes
  date: string;      // ISO string (midnight UTC)
  isRecurring: boolean;
  recurringDays: number[];
  parentBlockId?: string;
  createdAt: string;
  updatedAt: string;
  // relations (populated selectively)
  focusSession?: FocusSession;
  gymSession?: GymSession;
}

export interface FocusSession {
  id: string;
  userId: string;
  timeBlockId: string;
  actualDuration: number; // minutes
  rating: number;         // 1–5
  distractionCount: number;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  // computed
  executionAccuracy?: number; // 0–1
}

export interface GymSession {
  id: string;
  userId: string;
  timeBlockId: string;
  workoutType: WorkoutType;
  perceivedIntensity: number; // 1–5
  notes?: string;
  completedAt: string;
  createdAt: string;
  exerciseEntries: ExerciseEntry[];
}

export interface ExerciseEntry {
  id: string;
  gymSessionId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number; // kg
  createdAt: string;
}

export interface DailyScore {
  id: string;
  userId: string;
  date: string;
  totalScore: number;         // 0–100
  executionAccuracy: number;  // 0–1
  blockCompletionRate: number; // 0–1
  deepWorkHours: number;
  consistencyStreak: number;
  calculatedAt: string;
}

export interface DailyNote {
  id: string;
  userId: string;
  date: string;
  content: string; // Markdown
  timeBlockId?: string;
  updatedAt: string;
  createdAt: string;
}

export interface StickyNote {
  id: string;
  userId: string;
  content: string; // Markdown
  timeBlockId?: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────
// SCORING
// ─────────────────────────────────────────

export interface ScoreComponents {
  executionAccuracy: number;  // 0–1
  blockCompletionRate: number; // 0–1
  deepWorkHours: number;
  consistencyStreak: number;
}

export interface ScoreWeights {
  executionAccuracy: number;    // default 0.40
  blockCompletionRate: number;  // default 0.30
  deepWorkHours: number;        // default 0.20
  consistencyStreak: number;    // default 0.10
}

// ─────────────────────────────────────────
// GYM COMPARISON
// ─────────────────────────────────────────

export interface ExercisePR {
  exerciseName: string;
  maxWeight: number;
  maxVolume: number; // sets * reps * weight
  achievedAt: string;
}

export interface GymComparison {
  current: GymSession;
  previous: GymSession | null;
  volumeDelta: number;       // kg difference
  intensityDelta: number;    // perceived intensity difference
  newPRs: ExercisePR[];
}

// ─────────────────────────────────────────
// API RESPONSE
// ─────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────

export interface AuthPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  timezone?: string;
}

// ─────────────────────────────────────────
// FORMS / INPUT TYPES
// ─────────────────────────────────────────

export interface CreateTimeBlockInput {
  title: string;
  type: TimeBlockType;
  startTime: string;
  endTime: string;
  date: string;
  isRecurring?: boolean;
  recurringDays?: number[];
}

export interface CreateFocusSessionInput {
  timeBlockId: string;
  actualDuration: number;
  rating: number;
  distractionCount?: number;
  startedAt: string;
  completedAt: string;
}

export interface CreateGymSessionInput {
  timeBlockId: string;
  workoutType: WorkoutType;
  perceivedIntensity: number;
  notes?: string;
  exerciseEntries: Omit<ExerciseEntry, "id" | "gymSessionId" | "createdAt">[];
}

export interface UpsertDailyNoteInput {
  date: string;
  content: string;
  timeBlockId?: string;
}

export interface CreateStickyNoteInput {
  content: string;
  timeBlockId?: string;
  pinned?: boolean;
}

// ─────────────────────────────────────────
// DASHBOARD VIEW MODEL
// ─────────────────────────────────────────

export interface DashboardData {
  date: string;
  timeBlocks: TimeBlock[];
  activeSession: FocusSession | null;
  todayScore: DailyScore | null;
  yesterdayScore: DailyScore | null;
  scoreDelta: number;
  plannedHours: number;
  actualHours: number;
  gymCompleted: boolean;
  dailyNote: DailyNote | null;
  stickyNotes: StickyNote[];
}
