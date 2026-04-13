import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppHeader from "@/components/layout/AppHeader";
import { LayoutGrid, ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function WorkspacePage({ params }: Props) {
  const user = await getUser();
  if (!user) redirect("/login");

  const { slug } = await params;

  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: {
      boards: {
        include: {
          lists: {
            include: { _count: { select: { cards: true } } },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!workspace) notFound();

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <AppHeader
        user={user}
        breadcrumbs={[{ label: workspace.name }]}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-medium text-[#1a1a18]">
            {workspace.name}
          </h1>
          {workspace.description && (
            <p className="text-sm text-[#888780] mt-1">
              {workspace.description}
            </p>
          )}
        </div>

        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#888780] mb-3 px-1">
          Boards
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspace.boards.map((board) => {
            const cardCount = board.lists.reduce(
              (sum, l) => sum + l._count.cards,
              0
            );
            const listCount = board.lists.length;

            return (
              <Link
                key={board.id}
                href={`/workspace/${slug}/board/${board.slug}`}
                className="group bg-white rounded-xl border border-[#d3d1c7] hover:border-[#888780] hover:shadow-md transition-all p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#f0f4ff] text-[#3266ad] flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#b4b2a9] group-hover:text-[#1a1a18] group-hover:translate-x-0.5 transition-all" />
                </div>

                <h3 className="text-base font-medium text-[#1a1a18] mb-1">
                  {board.name}
                </h3>
                {board.description && (
                  <p className="text-xs text-[#888780] leading-relaxed mb-3 line-clamp-2">
                    {board.description}
                  </p>
                )}

                <div className="flex gap-4 text-xs text-[#5f5e5a]">
                  <span>
                    <strong className="font-medium">{listCount}</strong> lists
                  </span>
                  <span>
                    <strong className="font-medium">{cardCount}</strong> cards
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
