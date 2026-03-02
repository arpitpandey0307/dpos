import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.stickyNote.findFirst({ where: { id, userId: auth.userId } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { content, pinned } = await req.json();
  const updated = await prisma.stickyNote.update({
    where: { id },
    data: {
      ...(content !== undefined && { content }),
      ...(pinned !== undefined && { pinned }),
    },
  });

  return NextResponse.json({
    data: {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req.headers.get("authorization"));
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const note = await prisma.stickyNote.findFirst({ where: { id, userId: auth.userId } });
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.stickyNote.delete({ where: { id } });
  return NextResponse.json({ data: null });
}
