/**
 * DPOS Gym Service
 * Handles gym session creation, exercise entry management,
 * PR tracking, and cross-session performance comparison.
 *
 * Gym performance is intentionally SEPARATED from cognitive scoring.
 */

import prisma from "@/lib/prisma";
import { calcVolume } from "@/lib/utils";
import type {
  GymSession,
  ExercisePR,
  GymComparison,
  CreateGymSessionInput,
  WorkoutType,
} from "@/types";

// ─────────────────────────────────────────
// Serializer
// ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeSession(s: any): GymSession {
  return {
    ...s,
    completedAt: s.completedAt instanceof Date ? s.completedAt.toISOString() : s.completedAt,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    exerciseEntries: (s.exerciseEntries ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => ({
        ...e,
        createdAt: e.createdAt instanceof Date ? e.createdAt.toISOString() : e.createdAt,
      })
    ),
  };
}

// ─────────────────────────────────────────
// Queries
// ─────────────────────────────────────────

export async function getGymSessionByBlock(
  userId: string,
  timeBlockId: string
): Promise<GymSession | null> {
  const session = await prisma.gymSession.findFirst({
    where: { userId, timeBlockId },
    include: { exerciseEntries: true },
  });
  return session ? serializeSession(session) : null;
}

export async function getRecentGymSessions(
  userId: string,
  limit = 10
): Promise<GymSession[]> {
  const sessions = await prisma.gymSession.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    take: limit,
    include: { exerciseEntries: true },
  });
  return sessions.map(serializeSession);
}

// ─────────────────────────────────────────
// Command: Create gym session
// ─────────────────────────────────────────

export async function createGymSession(
  userId: string,
  input: CreateGymSessionInput
): Promise<GymSession> {
  // Verify time block exists and belongs to user
  const block = await prisma.timeBlock.findFirst({
    where: { id: input.timeBlockId, userId, type: "GYM" },
  });
  if (!block) throw new Error("GYM time block not found");

  // Prevent duplicate session
  const existing = await prisma.gymSession.findUnique({
    where: { timeBlockId: input.timeBlockId },
  });
  if (existing) throw new Error("Gym session already exists for this block");

  const session = await prisma.gymSession.create({
    data: {
      userId,
      timeBlockId: input.timeBlockId,
      workoutType: input.workoutType,
      perceivedIntensity: input.perceivedIntensity,
      notes: input.notes,
      completedAt: new Date(),
      exerciseEntries: {
        create: input.exerciseEntries.map((e) => ({
          exerciseName: e.exerciseName,
          sets: e.sets,
          reps: e.reps,
          weight: e.weight,
        })),
      },
    },
    include: { exerciseEntries: true },
  });

  // Mark time block completed
  await prisma.timeBlock.update({
    where: { id: input.timeBlockId },
    data: { status: "COMPLETED" },
  });

  return serializeSession(session);
}

// ─────────────────────────────────────────
// PR Tracking
// ─────────────────────────────────────────

export async function getExercisePRs(
  userId: string
): Promise<ExercisePR[]> {
  // Group exercise entries by exercise name, find max weight and volume
  const entries = await prisma.exerciseEntry.findMany({
    where: { gymSession: { userId } },
    include: { gymSession: { select: { completedAt: true } } },
    orderBy: { weight: "desc" },
  });

  const prMap = new Map<string, ExercisePR>();

  for (const entry of entries) {
    const volume = calcVolume(entry.sets, entry.reps, entry.weight);
    const existing = prMap.get(entry.exerciseName);

    if (!existing || entry.weight > existing.maxWeight || volume > existing.maxVolume) {
      prMap.set(entry.exerciseName, {
        exerciseName: entry.exerciseName,
        maxWeight: existing ? Math.max(existing.maxWeight, entry.weight) : entry.weight,
        maxVolume: existing ? Math.max(existing.maxVolume, volume) : volume,
        achievedAt: entry.gymSession.completedAt.toISOString(),
      });
    }
  }

  return Array.from(prMap.values());
}

// ─────────────────────────────────────────
// Session Comparison
// ─────────────────────────────────────────

export async function compareWithPreviousSession(
  userId: string,
  currentSessionId: string
): Promise<GymComparison> {
  const current = await prisma.gymSession.findFirst({
    where: { id: currentSessionId, userId },
    include: { exerciseEntries: true },
  });
  if (!current) throw new Error("Session not found");

  // Find previous session of same workout type
  const previous = await prisma.gymSession.findFirst({
    where: {
      userId,
      workoutType: current.workoutType as WorkoutType,
      id: { not: currentSessionId },
      completedAt: { lt: current.completedAt },
    },
    orderBy: { completedAt: "desc" },
    include: { exerciseEntries: true },
  });

  const currentVolume = current.exerciseEntries.reduce(
    (sum: number, e: { sets: number; reps: number; weight: number }) => sum + calcVolume(e.sets, e.reps, e.weight),
    0
  );

  const previousVolume = previous
    ? previous.exerciseEntries.reduce(
        (sum: number, e: { sets: number; reps: number; weight: number }) => sum + calcVolume(e.sets, e.reps, e.weight),
        0
      )
    : 0;

  // Detect new PRs in current session
  const allPRs = await getExercisePRs(userId);
  const prMap = new Map(allPRs.map((pr) => [pr.exerciseName, pr]));
  const newPRs: ExercisePR[] = [];

  for (const entry of current.exerciseEntries) {
    const pr = prMap.get(entry.exerciseName);
    const volume = calcVolume(entry.sets, entry.reps, entry.weight);
    if (!pr || entry.weight >= pr.maxWeight || volume >= pr.maxVolume) {
      if (pr && (entry.weight > pr.maxWeight || volume > pr.maxVolume)) {
        newPRs.push({
          exerciseName: entry.exerciseName,
          maxWeight: entry.weight,
          maxVolume: volume,
          achievedAt: current.completedAt.toISOString(),
        });
      }
    }
  }

  return {
    current: serializeSession(current),
    previous: previous ? serializeSession(previous) : null,
    volumeDelta: currentVolume - previousVolume,
    intensityDelta: previous
      ? current.perceivedIntensity - previous.perceivedIntensity
      : 0,
    newPRs,
  };
}
