import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !requireRole(user.role, "editor")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { name, boardId, color } = body;

  if (!name?.trim() || !boardId) {
    return NextResponse.json(
      { success: false, error: "name and boardId are required" },
      { status: 400 }
    );
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    return NextResponse.json(
      { success: false, error: "Board not found" },
      { status: 404 }
    );
  }

  const lastList = await prisma.boardList.findFirst({
    where: { boardId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const nextPosition = (lastList?.position ?? -1) + 1;

  const list = await prisma.boardList.create({
    data: {
      name: name.trim(),
      boardId,
      position: nextPosition,
      color: color || null,
    },
  });

  return NextResponse.json({ success: true, data: list }, { status: 201 });
}
