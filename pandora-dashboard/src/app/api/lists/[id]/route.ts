import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const { name, color } = body;

  const existing = await prisma.boardList.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: "List not found" },
      { status: 404 }
    );
  }

  const data: Record<string, string> = {};
  if (name !== undefined) data.name = name.trim();
  if (color !== undefined) data.color = color;

  const list = await prisma.boardList.update({ where: { id }, data });

  return NextResponse.json({ success: true, data: list });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "admin")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized — admin only" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const existing = await prisma.boardList.findUnique({
    where: { id },
    include: { _count: { select: { cards: true } } },
  });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: "List not found" },
      { status: 404 }
    );
  }

  await prisma.boardList.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
