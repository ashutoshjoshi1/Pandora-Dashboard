import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ success: true, data: { cards: [], workspaces: [] } });
  }

  const [cards, workspaces] = await Promise.all([
    prisma.card.findMany({
      where: {
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      include: {
        list: {
          include: { board: { include: { workspace: { select: { name: true, slug: true } } } } },
        },
      },
      take: 20,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.workspace.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 10,
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      cards: cards.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        status: c.status,
        workspace: c.list.board.workspace.name,
        workspaceSlug: c.list.board.workspace.slug,
        board: c.list.board.name,
        boardSlug: c.list.board.slug,
        list: c.list.name,
      })),
      workspaces: workspaces.map((w) => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        description: w.description,
      })),
    },
  });
}
