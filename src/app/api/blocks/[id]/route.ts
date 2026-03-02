import { NextRequest, NextResponse } from "next/server";
import { getAuthFromRequest } from "@/lib/auth";
import { getBlockById, updateBlockStatus, deleteBlock } from "@/services/timeblock.service";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const block = await getBlockById(auth.userId, id);
  if (!block) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: block });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await req.json();
    // Generic field update (title, type, etc.)
    const block = await prisma.timeBlock.findFirst({ where: { id, userId: auth.userId } });
    if (!block) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await prisma.timeBlock.update({
      where: { id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    return NextResponse.json({
      data: {
        ...updated,
        startTime: updated.startTime.toISOString(),
        endTime: updated.endTime.toISOString(),
        date: updated.date.toISOString(),
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthFromRequest(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    await deleteBlock(auth.userId, id);
    return NextResponse.json({ data: null }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 404 });
  }
}
