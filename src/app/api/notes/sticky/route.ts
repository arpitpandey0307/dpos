import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.stickyNote.findMany({
    where: { userId: auth.userId },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    data: notes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = getAuthUser(req.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { content, timeBlockId, pinned } = await req.json();
    if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });

    const note = await prisma.stickyNote.create({
      data: {
        userId: auth.userId,
        content,
        timeBlockId: timeBlockId ?? null,
        pinned: pinned ?? false,
      },
    });

    return NextResponse.json({
      data: {
        ...note,
        createdAt: note.createdAt.toISOString(),
        updatedAt: note.updatedAt.toISOString(),
      },
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
