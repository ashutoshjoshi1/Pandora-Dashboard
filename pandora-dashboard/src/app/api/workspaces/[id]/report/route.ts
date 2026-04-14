import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { id },
    include: {
      boards: {
        include: {
          lists: {
            include: {
              cards: {
                include: {
                  labels: { include: { label: true } },
                  jobs: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!workspace) {
    return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  // Flatten all cards across all boards/lists
  const allCards = workspace.boards.flatMap((b) =>
    b.lists.flatMap((l) =>
      l.cards.map((c) => ({ ...c, listName: l.name, boardName: b.name }))
    )
  );

  const builds = allCards.filter((c) => c.type === "build");
  const repairs = allCards.filter((c) => c.type === "repair");

  function summarize(cards: typeof allCards) {
    const totalJobs = cards.reduce((sum, c) => sum + c.jobs.length, 0);
    const completedJobs = cards.reduce(
      (sum, c) => sum + c.jobs.filter((j) => j.completed).length,
      0
    );

    // Group by list
    const byList: Record<string, number> = {};
    for (const c of cards) {
      byList[c.listName] = (byList[c.listName] || 0) + 1;
    }

    // Recent cards (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = cards.filter((c) => new Date(c.createdAt) > weekAgo).length;

    return {
      total: cards.length,
      totalJobs,
      completedJobs,
      jobProgress: totalJobs > 0 ? Math.round((completedJobs / totalJobs) * 100) : 0,
      byList,
      recentCount,
    };
  }

  return NextResponse.json({
    success: true,
    data: {
      totalCards: allCards.length,
      builds: summarize(builds),
      repairs: summarize(repairs),
      untyped: allCards.filter((c) => !c.type).length,
    },
  });
}
