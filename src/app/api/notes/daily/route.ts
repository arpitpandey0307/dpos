import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const date = dateParam ? new Date(dateParam) : new Date();
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const note = await prisma.dailyNote.findFirst({
    where: { userId: auth.userId, date: { gte: dayStart, lte: dayEnd } },
  });

  if (!note) return NextResponse.json({ data: null });

  return NextResponse.json({
    data: {
      ...note,
      date: note.date.toISOString(),
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    },
  });
}

export async function PUT(req: NextRequest) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { date: dateStr, content, timeBlockId } = await req.json();
    if (!dateStr || !content) {
      return NextResponse.json({ error: "date and content required" }, { status: 400 });
    }

    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);

    const note = await prisma.dailyNote.upsert({
      where: { userId_date: { userId: auth.userId, date } },
      create: { userId: auth.userId, date, content, timeBlockId: timeBlockId ?? null },
      update: { content, timeBlockId: timeBlockId ?? null },
    });

    return NextResponse.json({
      data: {
        ...note,
        date: note.date.toISOString(),
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
