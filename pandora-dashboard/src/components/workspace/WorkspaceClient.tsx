"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Hammer,
  Wrench,
  ArrowRight,
  LayoutGrid,
  Trash2,
  Loader2,
  X,
} from "lucide-react";
import NewEntryWizard from "./NewEntryWizard";
import WorkspaceReport from "./WorkspaceReport";

interface BoardData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  lists: {
    id: string;
    name: string;
    _count: { cards: number };
  }[];
}

interface WorkspaceClientProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string;
  };
  boards: BoardData[];
  userRole: string;
}

export default function WorkspaceClient({
  workspace,
  boards,
  userRole,
}: WorkspaceClientProps) {
  const router = useRouter();
  const [wizardType, setWizardType] = useState<"build" | "repair" | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<"boards" | "report">("boards");

  const canEdit = userRole === "admin" || userRole === "editor";
  const isAdmin = userRole === "admin";

  const boardsForWizard = boards.map((b) => ({
    id: b.id,
    name: b.name,
    lists: b.lists.map((l) => ({ id: l.id, name: l.name })),
  }));

  async function handleDeleteWorkspace() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <>
      <div className="space-y-8">
        {/* Workspace header with actions */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-medium text-[#1a1a18]">
                {workspace.name}
              </h1>
              {isAdmin && (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition group"
                  title="Move to trash"
                >
                  <Trash2 className="w-4 h-4 text-[#b4b2a9] group-hover:text-red-500" />
                </button>
              )}
            </div>
            {workspace.description && (
              <p className="text-sm text-[#888780]">{workspace.description}</p>
            )}
          </div>
        </div>

        {/* New Build / New Repair action cards */}
        {canEdit && boards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* New Build */}
            <button
              onClick={() => setWizardType("build")}
              className="group relative bg-white rounded-2xl border-2 border-[#c8e6d0] hover:border-[#2a7a4a] transition-all hover:shadow-lg text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] pointer-events-none">
                <Hammer className="w-full h-full text-[#2a7a4a]" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[#f0fff5] text-[#2a7a4a] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Hammer className="w-5.5 h-5.5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#c8e6d0] group-hover:text-[#2a7a4a] group-hover:translate-x-0.5 transition-all ml-auto" />
                </div>
                <h3 className="text-base font-semibold text-[#1a1a18] mb-1">
                  New Build
                </h3>
                <p className="text-xs text-[#888780] leading-relaxed">
                  Start a new instrument build with a full job checklist, specs, and tracking from assembly to deployment.
                </p>
              </div>
              <div className="px-5 py-2.5 bg-[#f0fff5]/60 border-t border-[#c8e6d0]/50 text-[10px] font-medium text-[#2a7a4a] uppercase tracking-wider">
                15 default jobs &middot; Full lifecycle
              </div>
            </button>

            {/* New Repair */}
            <button
              onClick={() => setWizardType("repair")}
              className="group relative bg-white rounded-2xl border-2 border-[#fecaca] hover:border-[#dc2626] transition-all hover:shadow-lg text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.04] pointer-events-none">
                <Wrench className="w-full h-full text-[#dc2626]" />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-[#fef2f2] text-[#dc2626] flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Wrench className="w-5.5 h-5.5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#fecaca] group-hover:text-[#dc2626] group-hover:translate-x-0.5 transition-all ml-auto" />
                </div>
                <h3 className="text-base font-semibold text-[#1a1a18] mb-1">
                  New Repair
                </h3>
                <p className="text-xs text-[#888780] leading-relaxed">
                  Log an instrument repair with diagnostics, part tracking, and a step-by-step repair checklist.
                </p>
              </div>
              <div className="px-5 py-2.5 bg-[#fef2f2]/60 border-t border-[#fecaca]/50 text-[10px] font-medium text-[#dc2626] uppercase tracking-wider">
                13 default jobs &middot; Intake to ship
              </div>
            </button>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex items-center gap-1 border-b border-[#e8e6df]">
          <button
            onClick={() => setActiveTab("boards")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === "boards"
                ? "border-[#1a1a18] text-[#1a1a18]"
                : "border-transparent text-[#888780] hover:text-[#5f5e5a]"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" />
              Boards
            </span>
          </button>
          <button
            onClick={() => setActiveTab("report")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === "report"
                ? "border-[#1a1a18] text-[#1a1a18]"
                : "border-transparent text-[#888780] hover:text-[#5f5e5a]"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="8" width="3" height="7" rx="0.5" />
                <rect x="6.5" y="4" width="3" height="11" rx="0.5" />
                <rect x="12" y="1" width="3" height="14" rx="0.5" />
              </svg>
              Overview Report
            </span>
          </button>
        </div>

        {/* Boards tab */}
        {activeTab === "boards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => {
              const cardCount = board.lists.reduce(
                (sum, l) => sum + l._count.cards,
                0
              );
              const listCount = board.lists.length;

              return (
                <a
                  key={board.id}
                  href={`/workspace/${workspace.slug}/board/${board.slug}`}
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
                </a>
              );
            })}
          </div>
        )}

        {/* Report tab */}
        {activeTab === "report" && (
          <WorkspaceReport workspaceId={workspace.id} />
        )}
      </div>

      {/* Wizard modal */}
      {wizardType && (
        <NewEntryWizard
          type={wizardType}
          workspaceId={workspace.id}
          boards={boardsForWizard}
          onClose={() => setWizardType(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmingDelete && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmingDelete(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-[#1a1a18]">
                  Move Workspace to Trash?
                </h3>
                <p className="text-sm text-[#5f5e5a] mt-1">
                  <strong>&ldquo;{workspace.name}&rdquo;</strong> and all its boards will be moved to the trash.
                  An admin can restore it later from the Trash page.
                </p>
              </div>
              <button
                onClick={() => setConfirmingDelete(false)}
                className="p-1 rounded-lg hover:bg-[#f5f4f0] transition flex-shrink-0"
              >
                <X className="w-4 h-4 text-[#888780]" />
              </button>
            </div>
            <div className="px-6 py-4 bg-[#fafaf8] border-t border-[#e8e6df] flex justify-end gap-2">
              <button
                onClick={() => setConfirmingDelete(false)}
                className="px-4 py-2 text-sm text-[#5f5e5a] hover:text-[#1a1a18] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWorkspace}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
