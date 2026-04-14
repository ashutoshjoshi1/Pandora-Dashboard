"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Trash2,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Layers,
  FileText,
  Clock,
  Hammer,
  Wrench,
  X,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface TrashCard {
  id: string;
  title: string;
  type: string | null;
  deletedAt: string;
  deletedBy: { id: string; fullName: string; username: string } | null;
  workspace: string;
  board: string;
  list: string;
}

interface TrashWorkspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  deletedAt: string;
  deletedBy: { id: string; fullName: string; username: string } | null;
  boardCount: number;
}

interface ConfirmAction {
  type: "restore" | "permanent";
  entityType: "card" | "workspace";
  entityId: string;
  entityName: string;
}

export default function TrashClient() {
  const router = useRouter();
  const [cards, setCards] = useState<TrashCard[]>([]);
  const [workspaces, setWorkspaces] = useState<TrashWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [activeTab, setActiveTab] = useState<"cards" | "workspaces">("cards");

  const fetchTrash = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/trash");
      const data = await res.json();
      if (data.success) {
        setCards(data.data.cards);
        setWorkspaces(data.data.workspaces);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  async function handleRestore(entityType: "card" | "workspace", entityId: string) {
    setActing(true);
    try {
      const res = await fetch("/api/admin/trash/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTrash();
        router.refresh();
      }
    } finally {
      setActing(false);
      setConfirm(null);
    }
  }

  async function handlePermanentDelete(entityType: "card" | "workspace", entityId: string) {
    setActing(true);
    try {
      const res = await fetch("/api/admin/trash/permanent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityType, entityId }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchTrash();
        router.refresh();
      }
    } finally {
      setActing(false);
      setConfirm(null);
    }
  }

  const totalTrash = cards.length + workspaces.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#888780]" />
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#d3d1c7] shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-[#e8e6df]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-[#1a1a18]">Trash</h1>
              <p className="text-sm text-[#888780]">
                {totalTrash === 0
                  ? "Trash is empty"
                  : `${totalTrash} item${totalTrash !== 1 ? "s" : ""} in trash`}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 bg-[#fafaf8] flex gap-1 border-b border-[#e8e6df]">
          <button
            onClick={() => setActiveTab("cards")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === "cards"
                ? "border-[#1a1a18] text-[#1a1a18]"
                : "border-transparent text-[#888780] hover:text-[#5f5e5a]"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Cards
              {cards.length > 0 && (
                <span className="text-[10px] bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 font-semibold">
                  {cards.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("workspaces")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px ${
              activeTab === "workspaces"
                ? "border-[#1a1a18] text-[#1a1a18]"
                : "border-transparent text-[#888780] hover:text-[#5f5e5a]"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              Workspaces
              {workspaces.length > 0 && (
                <span className="text-[10px] bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 font-semibold">
                  {workspaces.length}
                </span>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Cards Tab */}
      {activeTab === "cards" && (
        <div className="space-y-3">
          {cards.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="w-10 h-10 text-[#d3d1c7] mx-auto mb-3" />
              <p className="text-sm text-[#888780]">No deleted cards</p>
            </div>
          ) : (
            cards.map((card) => (
              <div
                key={card.id}
                className="bg-white rounded-xl border border-[#d3d1c7] p-4 flex items-start gap-4 hover:shadow-sm transition"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  card.type === "build"
                    ? "bg-[#f0fff5] text-[#2a7a4a]"
                    : card.type === "repair"
                    ? "bg-[#fef2f2] text-[#dc2626]"
                    : "bg-[#f5f4f0] text-[#888780]"
                }`}>
                  {card.type === "build" ? (
                    <Hammer className="w-4 h-4" />
                  ) : card.type === "repair" ? (
                    <Wrench className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#1a1a18] truncate">
                    {card.title}
                  </h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-[#888780]">
                    <span>{card.workspace} / {card.board} / {card.list}</span>
                    {card.type && (
                      <span className={`font-medium uppercase ${
                        card.type === "build" ? "text-[#2a7a4a]" : "text-[#dc2626]"
                      }`}>
                        {card.type}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-[#b4b2a9]">
                    <Clock className="w-3 h-3" />
                    Deleted {formatDateTime(card.deletedAt)}
                    {card.deletedBy && (
                      <span>by <strong className="text-[#888780]">{card.deletedBy.fullName}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() =>
                      setConfirm({
                        type: "restore",
                        entityType: "card",
                        entityId: card.id,
                        entityName: card.title,
                      })
                    }
                    disabled={acting}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#2a7a4a] bg-[#f0fff5] border border-[#c8e6d0] rounded-lg hover:bg-[#e0f5ea] transition disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </button>
                  <button
                    onClick={() =>
                      setConfirm({
                        type: "permanent",
                        entityType: "card",
                        entityId: card.id,
                        entityName: card.title,
                      })
                    }
                    disabled={acting}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Workspaces Tab */}
      {activeTab === "workspaces" && (
        <div className="space-y-3">
          {workspaces.length === 0 ? (
            <div className="text-center py-12">
              <Trash2 className="w-10 h-10 text-[#d3d1c7] mx-auto mb-3" />
              <p className="text-sm text-[#888780]">No deleted workspaces</p>
            </div>
          ) : (
            workspaces.map((ws) => (
              <div
                key={ws.id}
                className="bg-white rounded-xl border border-[#d3d1c7] p-4 flex items-start gap-4 hover:shadow-sm transition"
              >
                <div className="w-9 h-9 rounded-lg bg-[#f0f4ff] text-[#3266ad] flex items-center justify-center flex-shrink-0">
                  <Layers className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#1a1a18] truncate">
                    {ws.name}
                  </h3>
                  {ws.description && (
                    <p className="text-xs text-[#888780] mt-0.5 line-clamp-1">
                      {ws.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[#b4b2a9]">
                    <span>{ws.boardCount} boards</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Deleted {formatDateTime(ws.deletedAt)}
                    </span>
                    {ws.deletedBy && (
                      <span>by <strong className="text-[#888780]">{ws.deletedBy.fullName}</strong></span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() =>
                      setConfirm({
                        type: "restore",
                        entityType: "workspace",
                        entityId: ws.id,
                        entityName: ws.name,
                      })
                    }
                    disabled={acting}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#2a7a4a] bg-[#f0fff5] border border-[#c8e6d0] rounded-lg hover:bg-[#e0f5ea] transition disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </button>
                  <button
                    onClick={() =>
                      setConfirm({
                        type: "permanent",
                        entityType: "workspace",
                        entityId: ws.id,
                        entityName: ws.name,
                      })
                    }
                    disabled={acting}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirm && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirm(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                confirm.type === "restore"
                  ? "bg-[#f0fff5] text-[#2a7a4a]"
                  : "bg-red-50 text-red-500"
              }`}>
                {confirm.type === "restore" ? (
                  <RotateCcw className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium text-[#1a1a18]">
                  {confirm.type === "restore"
                    ? `Restore ${confirm.entityType}?`
                    : `Permanently delete ${confirm.entityType}?`}
                </h3>
                <p className="text-sm text-[#5f5e5a] mt-1">
                  {confirm.type === "restore" ? (
                    <>
                      <strong>&ldquo;{confirm.entityName}&rdquo;</strong> will be restored and visible to all users again.
                    </>
                  ) : (
                    <>
                      <strong>&ldquo;{confirm.entityName}&rdquo;</strong> will be permanently deleted.{" "}
                      <span className="text-red-600 font-medium">This action cannot be undone.</span>
                    </>
                  )}
                </p>
              </div>
              <button
                onClick={() => setConfirm(null)}
                className="p-1 rounded-lg hover:bg-[#f5f4f0] transition flex-shrink-0"
              >
                <X className="w-4 h-4 text-[#888780]" />
              </button>
            </div>
            <div className="px-6 py-4 bg-[#fafaf8] border-t border-[#e8e6df] flex justify-end gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 text-sm text-[#5f5e5a] hover:text-[#1a1a18] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirm.type === "restore") {
                    handleRestore(confirm.entityType, confirm.entityId);
                  } else {
                    handlePermanentDelete(confirm.entityType, confirm.entityId);
                  }
                }}
                disabled={acting}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition disabled:opacity-50 ${
                  confirm.type === "restore"
                    ? "bg-[#2a7a4a] text-white hover:bg-[#1d5e37]"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {acting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {confirm.type === "restore" ? "Restore" : "Delete Forever"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
