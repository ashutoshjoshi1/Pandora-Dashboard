import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "admin")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, description } = body;

  const board = await prisma.board.findUnique({ where: { id } });
  if (!board) {
    return NextResponse.json({ success: false, error: "Board not found" }, { status: 404 });
  }

  const updated = await prisma.board.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
  });

  return NextResponse.json({ success: true, data: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "admin")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  const board = await prisma.board.findUnique({ where: { id } });
  if (!board) {
    return NextResponse.json({ success: false, error: "Board not found" }, { status: 404 });
  }

  await prisma.board.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
