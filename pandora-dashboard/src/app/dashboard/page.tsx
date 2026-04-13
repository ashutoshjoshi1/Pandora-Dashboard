import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AppHeader from "@/components/layout/AppHeader";
import { FlaskConical, Satellite, ArrowRight, BarChart3, Clock, Layers } from "lucide-react";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const workspaces = await prisma.workspace.findMany({
    include: {
      boards: {
        include: {
          lists: {
            include: { _count: { select: { cards: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const totalCards = workspaces.reduce(
    (sum, ws) =>
      sum +
      ws.boards.reduce(
        (bs, b) => bs + b.lists.reduce((ls, l) => ls + l._count.cards, 0),
        0
      ),
    0
  );

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <AppHeader user={user} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section — inspired by PIC Scope HTML structure */}
        <div className="bg-white rounded-2xl border border-[#d3d1c7] shadow-sm overflow-hidden mb-8">
          <div className="px-6 sm:px-8 py-6 border-b border-[#e8e6df]">
            <div className="text-xs text-[#888780] mb-1">
              SciGlob Instruments & Services, LLC &middot; Pandora Spectrometer System
            </div>
            <h1 className="text-xl font-medium text-[#1a1a18]">
              Pandora Dashboard &mdash; Instrument Lifecycle
            </h1>
            <p className="text-sm text-[#5f5e5a] mt-1.5 leading-relaxed">
              A full overview of the production, repair, calibration, and deployment tracking for all Pandora instruments across workspaces.
            </p>
            <p className="text-xs text-[#888780] mt-1">
              From intake through final shipment to the end user.
            </p>
          </div>

          {/* Summary counters */}
          <div className="px-6 sm:px-8 py-4 bg-[#fafaf8] flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#3266ad]" />
              <span className="text-sm text-[#5f5e5a]">
                <strong className="text-[#1a1a18] font-medium">{workspaces.length}</strong>{" "}
                workspaces
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#2a7a4a]" />
              <span className="text-sm text-[#5f5e5a]">
                <strong className="text-[#1a1a18] font-medium">{totalCards}</strong>{" "}
                instruments tracked
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#b47a00]" />
              <span className="text-sm text-[#5f5e5a]">
                Updated April 2026
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Selection Cards */}
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#888780] mb-4 px-1">
          Select Workspace
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workspaces.map((ws) => {
            const icon =
              ws.slug === "sciglob" ? (
                <FlaskConical className="w-6 h-6" />
              ) : (
                <Satellite className="w-6 h-6" />
              );

            const boardCount = ws.boards.length;
            const cardCount = ws.boards.reduce(
              (bs, b) =>
                bs + b.lists.reduce((ls, l) => ls + l._count.cards, 0),
              0
            );

            const colorMap: Record<string, string> = {
              sciglob: "#2a7a4a",
              "nasa-gsfc": "#3266ad",
            };
            const bgMap: Record<string, string> = {
              sciglob: "#f0fff5",
              "nasa-gsfc": "#f0f4ff",
            };
            const borderMap: Record<string, string> = {
              sciglob: "#9FE1CB",
              "nasa-gsfc": "#B5D4F4",
            };

            return (
              <Link
                key={ws.id}
                href={`/workspace/${ws.slug}`}
                className="group bg-white rounded-xl border-2 transition-all hover:shadow-md"
                style={{
                  borderColor: borderMap[ws.slug] || "#d3d1c7",
                }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        backgroundColor: bgMap[ws.slug] || "#f5f4f0",
                        color: colorMap[ws.slug] || "#1a1a18",
                      }}
                    >
                      {icon}
                    </div>
                    <ArrowRight className="w-5 h-5 text-[#b4b2a9] group-hover:text-[#1a1a18] group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <h3 className="text-lg font-medium text-[#1a1a18] mb-1">
                    {ws.name}
                  </h3>
                  <p className="text-sm text-[#888780] leading-relaxed mb-4">
                    {ws.description}
                  </p>

                  <div className="flex gap-4 text-xs text-[#5f5e5a]">
                    <span>
                      <strong className="font-medium">{boardCount}</strong>{" "}
                      {boardCount === 1 ? "board" : "boards"}
                    </span>
                    <span>
                      <strong className="font-medium">{cardCount}</strong>{" "}
                      instruments
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#e8e6df] flex justify-between items-center text-xs text-[#b4b2a9]">
          <span>
            SciGlob Instruments & Services, LLC &middot; Based on 45+ instruments
          </span>
          <span>Pandora Program</span>
        </div>
      </main>
    </div>
  );
}
