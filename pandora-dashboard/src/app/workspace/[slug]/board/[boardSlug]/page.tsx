import { redirect, notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppHeader from "@/components/layout/AppHeader";
import BoardView from "@/components/board/BoardView";

interface Props {
  params: Promise<{ slug: string; boardSlug: string }>;
}

export default async function BoardPage({ params }: Props) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { slug, boardSlug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
  });
  if (!workspace) notFound();

  const board = await prisma.board.findUnique({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: boardSlug } },
    include: {
      lists: {
        orderBy: { position: "asc" },
        include: {
          cards: {
            orderBy: { position: "asc" },
            include: {
              labels: { include: { label: true } },
              customFields: { include: { field: true } },
              _count: { select: { comments: true, notes: true } },
            },
          },
        },
      },
    },
  });

  if (!board) notFound();

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex flex-col">
      <AppHeader
        user={user}
        breadcrumbs={[
          { label: workspace.name, href: `/workspace/${slug}` },
          { label: board.name },
        ]}
      />

      <main className="flex-1 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-[#e8e6df] bg-white/60 backdrop-blur">
          <div>
            <h1 className="text-lg font-medium text-[#1a1a18]">
              {board.name}
            </h1>
            {board.description && (
              <p className="text-xs text-[#888780]">{board.description}</p>
            )}
          </div>
          <div className="text-xs text-[#888780]">
            {board.lists.length} lists &middot;{" "}
            {board.lists.reduce((s, l) => s + l.cards.length, 0)} cards
          </div>
        </div>

        <BoardView board={board} userRole={user.role} />
      </main>
    </div>
  );
}
