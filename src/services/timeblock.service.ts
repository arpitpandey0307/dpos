/**
 * DPOS TimeBlock Service
 * Application layer: handles time block CRUD, conflict detection,
 * status transitions, and recurring block generation.
 */

import prisma from "@/lib/prisma";
import { hasTimeConflict, durationMinutes } from "@/lib/utils";
import type {
  TimeBlock,
  CreateTimeBlockInput,
  TimeBlockStatus,
} from "@/types";

// ─────────────────────────────────────────
// Serializer: Prisma → Domain type
// ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(block: any): TimeBlock {
  return {
    ...block,
    startTime: block.startTime instanceof Date ? block.startTime.toISOString() : block.startTime,
    endTime: block.endTime instanceof Date ? block.endTime.toISOString() : block.endTime,
    date: block.date instanceof Date ? block.date.toISOString() : block.date,
    createdAt: block.createdAt instanceof Date ? block.createdAt.toISOString() : block.createdAt,
    updatedAt: block.updatedAt instanceof Date ? block.updatedAt.toISOString() : block.updatedAt,
    recurringDays: typeof block.recurringDays === "string"
      ? JSON.parse(block.recurringDays)
      : (block.recurringDays ?? []),
  };
}

// ─────────────────────────────────────────
// Queries
// ─────────────────────────────────────────

export async function getBlocksForDay(
  userId: string,
  date: Date
): Promise<TimeBlock[]> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const blocks = await prisma.timeBlock.findMany({
    where: { userId, date: { gte: dayStart, lte: dayEnd } },
    orderBy: { startTime: "asc" },
    include: {
      focusSession: true,
      gymSession: { include: { exerciseEntries: true } },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return blocks.map((b: any) => serialize(b));
}

export async function getBlockById(
  userId: string,
  blockId: string
): Promise<TimeBlock | null> {
  const block = await prisma.timeBlock.findFirst({
    where: { id: blockId, userId },
    include: {
      focusSession: true,
      gymSession: { include: { exerciseEntries: true } },
    },
  });
  return block ? serialize(block as Record<string, unknown>) : null;
}

// ─────────────────────────────────────────
// Commands
// ─────────────────────────────────────────

export async function createTimeBlock(
  userId: string,
  input: CreateTimeBlockInput
): Promise<TimeBlock> {
  const start = new Date(input.startTime);
  const end = new Date(input.endTime);
  const date = new Date(input.date);
  date.setHours(0, 0, 0, 0);

  // Guard: end must be after start
  if (end <= start) {
    throw new Error("End time must be after start time");
  }

  // Conflict check
  const existing = await prisma.timeBlock.findMany({
    where: {
      userId,
      date: { gte: date, lte: new Date(date.getTime() + 86399999) },
    },
    select: { id: true, startTime: true, endTime: true },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedExisting = existing.map((b: any) => ({
    id: b.id,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
  }));

  if (
    hasTimeConflict(serializedExisting, {
      startTime: start.toISOString(),
      endTime: end.toISOString(),
    })
  ) {
    throw new Error("Time conflict detected with existing block");
  }

  const plannedDuration = durationMinutes(start.toISOString(), end.toISOString());

  const block = await prisma.timeBlock.create({
    data: {
      userId,
      title: input.title,
      type: input.type,
      startTime: start,
      endTime: end,
      plannedDuration,
      date,
      isRecurring: input.isRecurring ?? false,
      recurringDays: JSON.stringify(input.recurringDays ?? []),
    },
  });

  return serialize(block as Record<string, unknown>);
}

export async function updateBlockStatus(
  userId: string,
  blockId: string,
  status: TimeBlockStatus
): Promise<TimeBlock> {
  const block = await prisma.timeBlock.findFirst({
    where: { id: blockId, userId },
  });
  if (!block) throw new Error("Block not found");

  const updated = await prisma.timeBlock.update({
    where: { id: blockId },
    data: { status },
  });

  return serialize(updated as Record<string, unknown>);
}

export async function rescheduleBlock(
  userId: string,
  blockId: string,
  newStartTime: string,
  newEndTime: string
): Promise<TimeBlock> {
  const block = await prisma.timeBlock.findFirst({
    where: { id: blockId, userId },
  });
  if (!block) throw new Error("Block not found");

  const start = new Date(newStartTime);
  const end = new Date(newEndTime);
  if (end <= start) throw new Error("End time must be after start time");

  const plannedDuration = durationMinutes(newStartTime, newEndTime);

  const updated = await prisma.timeBlock.update({
    where: { id: blockId },
    data: { startTime: start, endTime: end, plannedDuration },
  });

  return serialize(updated as Record<string, unknown>);
}

export async function deleteBlock(
  userId: string,
  blockId: string
): Promise<void> {
  const block = await prisma.timeBlock.findFirst({
    where: { id: blockId, userId },
  });
  if (!block) throw new Error("Block not found");
  await prisma.timeBlock.delete({ where: { id: blockId } });
}

// ─────────────────────────────────────────
// Summary helpers
// ─────────────────────────────────────────

export function calcPlannedHours(blocks: TimeBlock[]): number {
  return (
    blocks
      .filter((b) => b.type !== "FREE")
      .reduce((sum, b) => sum + b.plannedDuration, 0) / 60
  );
}
