/**
 * DPOS Focus Session Service
 * Manages focus session lifecycle: start, complete, and metrics calculation.
 * Each TimeBlock (non-FREE) can have exactly one FocusSession.
 */

import prisma from "@/lib/prisma";
import type { FocusSession, CreateFocusSessionInput } from "@/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(s: any): FocusSession {
  const executionAccuracy = s.timeBlock
    ? Math.min(s.actualDuration / s.timeBlock.plannedDuration, 1)
    : undefined;

  return {
    id: s.id,
    userId: s.userId,
    timeBlockId: s.timeBlockId,
    actualDuration: s.actualDuration,
    rating: s.rating,
    distractionCount: s.distractionCount,
    startedAt: s.startedAt instanceof Date ? s.startedAt.toISOString() : s.startedAt,
    completedAt: s.completedAt instanceof Date ? s.completedAt.toISOString() : s.completedAt,
    createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : s.createdAt,
    executionAccuracy,
  };
}

// ─────────────────────────────────────────
// Queries
// ─────────────────────────────────────────

export async function getActiveSession(
  userId: string
): Promise<FocusSession | null> {
  // A session is "active" if its time block is in ACTIVE status
  const block = await prisma.timeBlock.findFirst({
    where: { userId, status: "ACTIVE" },
    include: {
      focusSession: true,
    },
  });

  if (!block?.focusSession) return null;

  const session = await prisma.focusSession.findUnique({
    where: { id: block.focusSession.id },
    include: { timeBlock: { select: { plannedDuration: true } } },
  });

  return session ? serialize(session) : null;
}

export async function getSessionByBlock(
  userId: string,
  timeBlockId: string
): Promise<FocusSession | null> {
  const session = await prisma.focusSession.findFirst({
    where: { userId, timeBlockId },
    include: { timeBlock: { select: { plannedDuration: true } } },
  });
  return session ? serialize(session) : null;
}

// ─────────────────────────────────────────
// Commands
// ─────────────────────────────────────────

export async function startFocusSession(
  userId: string,
  timeBlockId: string
): Promise<FocusSession> {
  const block = await prisma.timeBlock.findFirst({
    where: { id: timeBlockId, userId },
  });
  if (!block) throw new Error("Time block not found");
  if (block.type === "FREE") throw new Error("Cannot start focus session on FREE block");
  if (block.status === "COMPLETED") throw new Error("Block already completed");

  // Ensure no other active block
  const activeBlock = await prisma.timeBlock.findFirst({
    where: { userId, status: "ACTIVE" },
  });
  if (activeBlock && activeBlock.id !== timeBlockId) {
    throw new Error("Another session is already active. Complete it first.");
  }

  // Mark block as active
  await prisma.timeBlock.update({
    where: { id: timeBlockId },
    data: { status: "ACTIVE" },
  });

  // Create focus session stub (will be completed later)
  const session = await prisma.focusSession.create({
    data: {
      userId,
      timeBlockId,
      actualDuration: 0, // updated on completion
      rating: 0,
      distractionCount: 0,
      startedAt: new Date(),
      completedAt: new Date(), // placeholder
    },
    include: { timeBlock: { select: { plannedDuration: true } } },
  });

  return serialize(session as Record<string, unknown>);
}

export async function completeFocusSession(
  userId: string,
  input: CreateFocusSessionInput
): Promise<FocusSession> {
  const block = await prisma.timeBlock.findFirst({
    where: { id: input.timeBlockId, userId },
  });
  if (!block) throw new Error("Time block not found");
  if (block.type === "FREE") throw new Error("Cannot log focus session on FREE block");

  const completedAt = new Date(input.completedAt);
  const startedAt = new Date(input.startedAt);

  // Upsert session (support re-submission)
  const session = await prisma.focusSession.upsert({
    where: { timeBlockId: input.timeBlockId },
    create: {
      userId,
      timeBlockId: input.timeBlockId,
      actualDuration: input.actualDuration,
      rating: input.rating,
      distractionCount: input.distractionCount ?? 0,
      startedAt,
      completedAt,
    },
    update: {
      actualDuration: input.actualDuration,
      rating: input.rating,
      distractionCount: input.distractionCount ?? 0,
      completedAt,
    },
    include: { timeBlock: { select: { plannedDuration: true } } },
  });

  // Mark block as completed
  await prisma.timeBlock.update({
    where: { id: input.timeBlockId },
    data: { status: "COMPLETED" },
  });

  return serialize(session as Record<string, unknown>);
}

// ─────────────────────────────────────────
// Analytics helpers
// ─────────────────────────────────────────

export async function getDeepWorkHoursForDay(
  userId: string,
  date: Date
): Promise<number> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const sessions = await prisma.focusSession.findMany({
    where: {
      userId,
      startedAt: { gte: dayStart, lte: dayEnd },
      timeBlock: { type: { in: ["STUDY", "CLASS"] } },
    },
    select: { actualDuration: true },
  });

  return sessions.reduce((sum: number, s: { actualDuration: number }) => sum + s.actualDuration, 0) / 60;
}
