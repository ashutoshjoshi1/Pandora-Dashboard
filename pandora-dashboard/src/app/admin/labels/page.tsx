"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import {
  Tag,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Save,
  Check,
} from "lucide-react";

interface LabelData {
  id: string;
  name: string;
  color: string;
}

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#78716c",
  "#1a1a18", "#3266ad", "#2a7a4a", "#dc2626", "#9333ea",
];

export default function AdminLabelsPage() {
  const router = useRouter();
  const [labels, setLabels] = useState<LabelData[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
    username: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [userRes, labelsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/labels"),
        ]);
        const userData = await userRes.json();
        const labelsData = await labelsRes.json();

        if (!userData.success || userData.data.role !== "admin") {
          router.push("/dashboard");
          return;
        }

        setCurrentUser(userData.data);
        if (labelsData.success) setLabels(labelsData.data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleCreate() {
    if (!newName.trim() || !newColor.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      const data = await res.json();
      if (data.success) {
        setLabels((prev) => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)));
        setNewName("");
        setNewColor("#3b82f6");
        setShowAdd(false);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return;
    const res = await fetch(`/api/labels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), color: editColor }),
    });
    const data = await res.json();
    if (data.success) {
      setLabels((prev) =>
        prev.map((l) => (l.id === id ? data.data : l)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/labels/${id}`, { method: "DELETE" });
    setLabels((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
  }

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#888780]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <AppHeader
        user={currentUser}
        breadcrumbs={[{ label: "Admin" }, { label: "Labels" }]}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f0f4ff] text-[#3266ad] flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-[#1a1a18]">Labels</h1>
              <p className="text-xs text-[#888780]">
                {labels.length} label{labels.length !== 1 ? "s" : ""} — applied across all cards
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a18] text-white text-sm rounded-lg hover:bg-[#2a2a28] transition"
          >
            <Plus className="w-4 h-4" />
            New Label
          </button>
        </div>

        {/* Create label form */}
        {showAdd && (
          <div className="bg-white rounded-xl border border-[#d3d1c7] p-5 mb-4 space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Label name"
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setShowAdd(false);
              }}
            />
            <div>
              <div className="text-xs text-[#888780] mb-1.5">Color</div>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-7 h-7 rounded-lg border-2 transition flex items-center justify-center"
                    style={{
                      backgroundColor: c,
                      borderColor: newColor === c ? "#1a1a18" : "transparent",
                    }}
                  >
                    {newColor === c && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium"
                style={{ backgroundColor: newColor + "20", color: newColor }}
              >
                <Tag className="w-3 h-3" />
                {newName || "Preview"}
              </div>
              <div className="flex-1" />
              <button
                onClick={() => setShowAdd(false)}
                className="px-3 py-1.5 text-xs text-[#888780] hover:text-[#1a1a18]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || submitting}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1a1a18] text-white text-xs rounded-lg hover:bg-[#2a2a28] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Create
              </button>
            </div>
          </div>
        )}

        {/* Labels list */}
        <div className="bg-white rounded-xl border border-[#d3d1c7] divide-y divide-[#e8e6df]">
          {labels.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-[#b4b2a9]">
              No labels yet — create your first one
            </div>
          ) : (
            labels.map((label) => (
              <div key={label.id} className="px-5 py-3 flex items-center gap-3 group">
                {editingId === label.id ? (
                  <>
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: editColor }}
                    />
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                      className="flex-1 px-2 py-1 rounded border border-[#d3d1c7] text-sm text-[#1a1a18] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate(label.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <div className="flex items-center gap-1">
                      {PRESET_COLORS.slice(0, 8).map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className="w-5 h-5 rounded border transition"
                          style={{
                            backgroundColor: c,
                            borderColor: editColor === c ? "#1a1a18" : "transparent",
                          }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleUpdate(label.id)}
                      className="p-1.5 bg-[#1a1a18] text-white rounded-lg"
                    >
                      <Save className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1.5 rounded-lg hover:bg-[#f5f4f0]"
                    >
                      <X className="w-3 h-3 text-[#888780]" />
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span
                      className="inline-block text-xs font-medium px-2.5 py-1 rounded-md"
                      style={{
                        backgroundColor: label.color + "20",
                        color: label.color,
                      }}
                    >
                      {label.name}
                    </span>
                    <span className="text-[10px] text-[#b4b2a9] font-mono">{label.color}</span>
                    <div className="flex-1" />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={() => {
                          setEditingId(label.id);
                          setEditName(label.name);
                          setEditColor(label.color);
                        }}
                        className="p-1.5 rounded-lg hover:bg-[#f5f4f0]"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#888780]" />
                      </button>
                      <button
                        onClick={() => setDeletingId(label.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#b4b2a9] hover:text-red-500" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Delete Confirmation */}
      {deletingId && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setDeletingId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5">
              <h3 className="text-base font-medium text-[#1a1a18]">Delete Label?</h3>
              <p className="text-sm text-[#5f5e5a] mt-1">
                This label will be removed from all cards. This cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 bg-[#fafaf8] border-t border-[#e8e6df] flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm text-[#5f5e5a] hover:text-[#1a1a18] transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
