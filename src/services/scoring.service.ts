/**
 * DPOS Scoring Service
 *
 * Calculates a daily performance score (0–100) from four components.
 * The algorithm is modular: weights are configurable per user (future SaaS).
 *
 * Default formula:
 *   Score = (execAccuracy × 0.40)
 *         + (blockCompletionRate × 0.30)
 *         + (deepWorkRatio × 0.20)   ← capped at 4h deep work = 1.0
 *         + (streakBonus × 0.10)     ← capped at 7-day streak = 1.0
 */

import prisma from "@/lib/prisma";
import type {
  ScoreComponents,
  ScoreWeights,
  DailyScore,
} from "@/types";

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────

const DEFAULT_WEIGHTS: ScoreWeights = {
  executionAccuracy:   0.40,
  blockCompletionRate: 0.30,
  deepWorkHours:       0.20,
  consistencyStreak:   0.10,
};

const DEEP_WORK_MAX_HOURS = 4;    // hours to consider 1.0 ratio
const STREAK_CAP_DAYS    = 7;     // days to consider 1.0 streak bonus

// ─────────────────────────────────────────
// Core calculation
// ─────────────────────────────────────────

export function calculateScore(
  components: ScoreComponents,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): number {
  const deepWorkRatio     = Math.min(components.deepWorkHours / DEEP_WORK_MAX_HOURS, 1);
  const streakRatio       = Math.min(components.consistencyStreak / STREAK_CAP_DAYS, 1);
  const executionClamped  = Math.min(Math.max(components.executionAccuracy, 0), 1);
  const completionClamped = Math.min(Math.max(components.blockCompletionRate, 0), 1);

  const raw =
    executionClamped  * weights.executionAccuracy   * 100 +
    completionClamped * weights.blockCompletionRate * 100 +
    deepWorkRatio     * weights.deepWorkHours       * 100 +
    streakRatio       * weights.consistencyStreak   * 100;

  return Math.round(Math.min(Math.max(raw, 0), 100) * 10) / 10;
}

// ─────────────────────────────────────────
// Service: compute and persist daily score
// ─────────────────────────────────────────

export async function computeAndSaveDailyScore(
  userId: string,
  date: Date
): Promise<DailyScore> {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  // Fetch all time blocks for this day
  const blocks = await prisma.timeBlock.findMany({
    where: {
      userId,
      date: { gte: dayStart, lte: dayEnd },
      type: { not: "FREE" },
    },
    include: { focusSession: true },
  });

  const scored = blocks.filter((b) => b.type !== "FREE");
  const completed = scored.filter((b) => b.status === "COMPLETED");

  // Block completion rate
  const blockCompletionRate =
    scored.length === 0 ? 0 : completed.length / scored.length;

  // Execution accuracy: avg of (actual / planned) for completed blocks
  let totalAccuracy = 0;
  let sessionCount = 0;
  let deepWorkMinutes = 0;

  for (const block of completed) {
    if (block.focusSession) {
      const accuracy = Math.min(
        block.focusSession.actualDuration / block.plannedDuration,
        1
      );
      totalAccuracy += accuracy;
      sessionCount += 1;

      if (block.type === "STUDY" || block.type === "CLASS") {
        deepWorkMinutes += block.focusSession.actualDuration;
      }
    }
  }

  const executionAccuracy =
    sessionCount === 0 ? 0 : totalAccuracy / sessionCount;
  const deepWorkHours = deepWorkMinutes / 60;

  // Consistency streak
  const consistencyStreak = await getConsistencyStreak(userId, dayStart);

  const components: ScoreComponents = {
    executionAccuracy,
    blockCompletionRate,
    deepWorkHours,
    consistencyStreak,
  };

  const totalScore = calculateScore(components);

  // Upsert score for the day
  const saved = await prisma.dailyScore.upsert({
    where: { userId_date: { userId, date: dayStart } },
    create: {
      userId,
      date: dayStart,
      totalScore,
      executionAccuracy,
      blockCompletionRate,
      deepWorkHours,
      consistencyStreak,
    },
    update: {
      totalScore,
      executionAccuracy,
      blockCompletionRate,
      deepWorkHours,
      consistencyStreak,
      calculatedAt: new Date(),
    },
  });

  return {
    ...saved,
    date: saved.date.toISOString(),
    calculatedAt: saved.calculatedAt.toISOString(),
  } as DailyScore;
}

// ─────────────────────────────────────────
// Streak calculation
// ─────────────────────────────────────────

async function getConsistencyStreak(
  userId: string,
  before: Date
): Promise<number> {
  let streak = 0;
  const cursor = new Date(before);

  for (let i = 0; i < 90; i++) {
    // look back one day
    cursor.setDate(cursor.getDate() - 1);
    const dayStart = new Date(cursor);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(cursor);
    dayEnd.setHours(23, 59, 59, 999);

    const score = await prisma.dailyScore.findFirst({
      where: {
        userId,
        date: { gte: dayStart, lte: dayEnd },
        totalScore: { gt: 0 },
      },
    });

    if (!score) break;
    streak += 1;
  }

  return streak;
}

// ─────────────────────────────────────────
// Fetch scores for dashboard
// ─────────────────────────────────────────

export async function getDailyScores(
  userId: string,
  date: Date
): Promise<{ today: DailyScore | null; yesterday: DailyScore | null; delta: number }> {
  const todayStart = new Date(date);
  todayStart.setHours(0, 0, 0, 0);

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const [today, yesterday] = await Promise.all([
    prisma.dailyScore.findFirst({
      where: { userId, date: { gte: todayStart } },
    }),
    prisma.dailyScore.findFirst({
      where: { userId, date: { gte: yesterdayStart, lt: todayStart } },
    }),
  ]);

  const delta = today && yesterday ? today.totalScore - yesterday.totalScore : 0;

  return {
    today: today
      ? ({ ...today, date: today.date.toISOString(), calculatedAt: today.calculatedAt.toISOString() } as DailyScore)
      : null,
    yesterday: yesterday
      ? ({ ...yesterday, date: yesterday.date.toISOString(), calculatedAt: yesterday.calculatedAt.toISOString() } as DailyScore)
      : null,
    delta,
  };
}
