import { redirect, notFound } from "next/navigation";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppHeader from "@/components/layout/AppHeader";
import WorkspaceClient from "@/components/workspace/WorkspaceClient";

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
            include: {
              _count: {
                select: { cards: { where: { deletedAt: null } } },
              },
            },
            orderBy: { position: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!workspace || workspace.deletedAt) notFound();

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <AppHeader
        user={user}
        breadcrumbs={[{ label: workspace.name }]}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <WorkspaceClient
          workspace={{
            id: workspace.id,
            name: workspace.name,
            slug: workspace.slug,
            description: workspace.description,
            color: workspace.color,
          }}
          boards={workspace.boards.map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            description: b.description,
            lists: b.lists.map((l) => ({
              id: l.id,
              name: l.name,
              _count: l._count,
            })),
          }))}
          userRole={user.role}
        />
      </main>
    </div>
  );
}
