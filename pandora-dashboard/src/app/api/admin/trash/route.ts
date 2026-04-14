import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser, requireRole } from "@/lib/auth";

export async function GET() {
  const user = await getUser();
  if (!user || !requireRole(user.role, "admin")) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  const [deletedCards, deletedWorkspaces] = await Promise.all([
    prisma.card.findMany({
      where: { deletedAt: { not: null } },
      include: {
        list: {
          include: { board: { include: { workspace: true } } },
        },
        deletedByUser: { select: { id: true, fullName: true, username: true } },
      },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.workspace.findMany({
      where: { deletedAt: { not: null } },
      include: {
        deletedByUser: { select: { id: true, fullName: true, username: true } },
        _count: { select: { boards: true } },
      },
      orderBy: { deletedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      cards: deletedCards.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        deletedAt: c.deletedAt,
        deletedBy: c.deletedByUser,
        workspace: c.list.board.workspace.name,
        board: c.list.board.name,
        list: c.list.name,
      })),
      workspaces: deletedWorkspaces.map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        description: w.description,
        deletedAt: w.deletedAt,
        deletedBy: w.deletedByUser,
        boardCount: w._count.boards,
      })),
    },
  });
}
