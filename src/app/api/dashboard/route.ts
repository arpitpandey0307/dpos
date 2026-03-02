import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getBlocksForDay, calcPlannedHours } from "@/services/timeblock.service";
import { getActiveSession } from "@/services/focus.service";
import { computeAndSaveDailyScore, getDailyScores } from "@/services/scoring.service";
import prisma from "@/lib/prisma";
import type { DashboardData } from "@/types";

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();

  try {
    // Always recompute today's score so it stays fresh (fixes stale score bug)
    await computeAndSaveDailyScore(auth.userId, date);

    const [blocks, activeSession, scores] = await Promise.all([
      getBlocksForDay(auth.userId, date),
      getActiveSession(auth.userId),
      getDailyScores(auth.userId, date),
    ]);

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const [dailyNote, stickyNotes] = await Promise.all([
      prisma.dailyNote.findFirst({
        where: { userId: auth.userId, date: { gte: dayStart, lte: dayEnd } },
      }),
      prisma.stickyNote.findMany({
        where: { userId: auth.userId },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 10,
      }),
    ]);

    const plannedHours = calcPlannedHours(blocks);
    const actualHours =
      blocks.reduce((sum, b) => {
        if (b.focusSession) return sum + b.focusSession.actualDuration;
        return sum;
      }, 0) / 60;

    const gymCompleted = blocks.some(
      (b) => b.type === "GYM" && b.status === "COMPLETED"
    );

    const dashboard: DashboardData = {
      date: date.toISOString(),
      timeBlocks: blocks,
      activeSession,
      todayScore: scores.today,
      yesterdayScore: scores.yesterday,
      scoreDelta: scores.delta,
      plannedHours,
      actualHours,
      gymCompleted,
      dailyNote: dailyNote
        ? {
            ...dailyNote,
            date: dailyNote.date.toISOString(),
            createdAt: dailyNote.createdAt.toISOString(),
            updatedAt: dailyNote.updatedAt.toISOString(),
          }
        : null,
      stickyNotes: stickyNotes.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
    };

    return NextResponse.json({ data: dashboard });
  } catch (err) {
    console.error("[dashboard]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
