"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  MessageSquare,
  StickyNote,
  Activity,
  FileText,
  Tag,
  Clock,
  Send,
  Plus,
  Save,
  Loader2,
  Settings2,
} from "lucide-react";
import { formatDateTime, getInitials } from "@/lib/utils";

interface CardDetail {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  createdAt: string;
  updatedAt: string;
  labels: { label: { id: string; name: string; color: string } }[];
  customFields: {
    id: string;
    value: string | null;
    field: { id: string; name: string; type: string; options: string | null };
  }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: { id: string; fullName: string; username: string };
  }[];
  notes: {
    id: string;
    title: string | null;
    content: string;
    createdAt: string;
    updatedAt: string;
  }[];
  activities: {
    id: string;
    type: string;
    detail: string;
    createdAt: string;
    user: { id: string; fullName: string; username: string } | null;
  }[];
  list: {
    name: string;
    board: {
      name: string;
      workspace: { name: string };
    };
  };
}

interface CardDetailDrawerProps {
  cardId: string;
  userRole: string;
  onClose: () => void;
}

export default function CardDetailDrawer({
  cardId,
  userRole,
  onClose,
}: CardDetailDrawerProps) {
  const router = useRouter();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"comments" | "notes" | "activity">(
    "comments"
  );
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [showNewNote, setShowNewNote] = useState(false);

  const canEdit = userRole === "admin" || userRole === "editor";

  const fetchCard = useCallback(async () => {
    try {
      const res = await fetch(`/api/cards/${cardId}`);
      const data = await res.json();
      if (data.success) {
        setCard(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  useEffect(() => {
    fetchCard();
  }, [fetchCard]);

  async function handleAddComment() {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, content: newComment }),
      });
      const data = await res.json();
      if (data.success) {
        setNewComment("");
        await fetchCard();
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDescription() {
    if (!card) return;
    setSubmitting(true);
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: descriptionDraft }),
      });
      setEditingDescription(false);
      await fetchCard();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddNote() {
    if (!newNoteContent.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId,
          title: newNoteTitle || null,
          content: newNoteContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewNoteContent("");
        setNewNoteTitle("");
        setShowNewNote(false);
        await fetchCard();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateCustomField(fieldId: string, value: string) {
    await fetch(`/api/cards/${cardId}/custom-fields`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldId, value }),
    });
    await fetchCard();
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
        <div className="w-full max-w-2xl bg-white h-full flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#888780]" />
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50 flex justify-end">
        <div className="w-full max-w-2xl bg-white h-full flex items-center justify-center">
          <p className="text-sm text-[#888780]">Card not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-xl animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e8e6df] z-10">
          <div className="px-6 py-4 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] text-[#888780] mb-1">
                <span className="px-1.5 py-0.5 bg-[#f5f4f0] rounded text-[#5f5e5a] font-medium uppercase">
                  {card.list.name}
                </span>
              </div>
              <h2 className="text-lg font-medium text-[#1a1a18] truncate">
                {card.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#f5f4f0] transition ml-2 flex-shrink-0"
            >
              <X className="w-5 h-5 text-[#888780]" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Labels */}
          {card.labels.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f5e5a] mb-2">
                <Tag className="w-3.5 h-3.5" />
                Labels
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {card.labels.map((cl) => (
                  <span
                    key={cl.label.id}
                    className="inline-block text-xs font-medium px-2.5 py-1 rounded-md"
                    style={{
                      backgroundColor: cl.label.color + "20",
                      color: cl.label.color,
                    }}
                  >
                    {cl.label.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f5e5a]">
                <FileText className="w-3.5 h-3.5" />
                Description
              </div>
              {canEdit && !editingDescription && (
                <button
                  onClick={() => {
                    setEditingDescription(true);
                    setDescriptionDraft(card.description || "");
                  }}
                  className="text-xs text-[#3266ad] hover:underline"
                >
                  Edit
                </button>
              )}
            </div>

            {editingDescription ? (
              <div className="space-y-2">
                <textarea
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  rows={4}
                  className="w-full p-3 rounded-lg border border-[#d3d1c7] text-sm text-[#1a1a18] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad] resize-y"
                  placeholder="Add a description..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDescription}
                    disabled={submitting}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a18] text-white text-xs rounded-lg hover:bg-[#2a2a28] disabled:opacity-50"
                  >
                    <Save className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => setEditingDescription(false)}
                    className="px-3 py-1.5 text-xs text-[#888780] hover:text-[#1a1a18]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-[#5f5e5a] leading-relaxed whitespace-pre-wrap bg-[#fafaf8] rounded-lg p-3 border border-[#e8e6df] min-h-[3rem]">
                {card.description || (
                  <span className="text-[#b4b2a9] italic">No description</span>
                )}
              </div>
            )}
          </div>

          {/* Custom Fields */}
          {card.customFields.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f5e5a] mb-2">
                <Settings2 className="w-3.5 h-3.5" />
                Custom Fields
              </div>
              <div className="grid grid-cols-2 gap-2">
                {card.customFields.map((cf) => {
                  const options = cf.field.options
                    ? JSON.parse(cf.field.options)
                    : null;

                  return (
                    <div
                      key={cf.id}
                      className="bg-[#fafaf8] rounded-lg px-3 py-2 border border-[#e8e6df]"
                    >
                      <div className="text-[10px] text-[#888780] font-medium mb-0.5">
                        {cf.field.name}
                      </div>
                      {canEdit && options ? (
                        <select
                          value={cf.value || ""}
                          onChange={(e) =>
                            handleUpdateCustomField(cf.field.id, e.target.value)
                          }
                          className="w-full text-xs bg-transparent text-[#1a1a18] border-none p-0 focus:outline-none focus:ring-0"
                        >
                          <option value="">Select...</option>
                          {options.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-xs text-[#1a1a18] font-medium">
                          {cf.value || (
                            <span className="text-[#b4b2a9]">—</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex gap-4 text-[10px] text-[#b4b2a9]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Created {formatDateTime(card.createdAt)}
            </span>
            <span>Updated {formatDateTime(card.updatedAt)}</span>
          </div>

          {/* Tabs */}
          <div className="border-t border-[#e8e6df] pt-4">
            <div className="flex gap-1 mb-4">
              {(
                [
                  {
                    key: "comments" as const,
                    icon: MessageSquare,
                    label: "Comments",
                    count: card.comments.length,
                  },
                  {
                    key: "notes" as const,
                    icon: StickyNote,
                    label: "Notes",
                    count: card.notes.length,
                  },
                  {
                    key: "activity" as const,
                    icon: Activity,
                    label: "Activity",
                    count: card.activities.length,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    activeTab === tab.key
                      ? "bg-[#1a1a18] text-white"
                      : "text-[#888780] hover:bg-[#f5f4f0] hover:text-[#1a1a18]"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`text-[10px] rounded-full px-1.5 ${
                        activeTab === tab.key
                          ? "bg-white/20"
                          : "bg-[#e8e6df]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Comments Tab */}
            {activeTab === "comments" && (
              <div className="space-y-3">
                {/* Add Comment */}
                <div className="flex gap-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={2}
                    className="flex-1 p-2.5 rounded-lg border border-[#d3d1c7] text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad] resize-none"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || submitting}
                    className="self-end p-2.5 bg-[#1a1a18] text-white rounded-lg hover:bg-[#2a2a28] disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Comments List */}
                {card.comments.length === 0 ? (
                  <p className="text-xs text-[#b4b2a9] text-center py-4 italic">
                    No comments yet
                  </p>
                ) : (
                  card.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-3 p-3 rounded-lg bg-[#fafaf8] border border-[#e8e6df]"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#3266ad] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {getInitials(comment.author.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-[#1a1a18]">
                            {comment.author.fullName}
                          </span>
                          <span className="text-[10px] text-[#b4b2a9]">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-[#5f5e5a] whitespace-pre-wrap leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div className="space-y-3">
                {canEdit && (
                  <div>
                    {showNewNote ? (
                      <div className="space-y-2 bg-[#fafaf8] rounded-lg border border-[#e8e6df] p-3">
                        <input
                          value={newNoteTitle}
                          onChange={(e) => setNewNoteTitle(e.target.value)}
                          placeholder="Note title (optional)"
                          className="w-full px-2.5 py-1.5 rounded border border-[#d3d1c7] text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20"
                        />
                        <textarea
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder="Note content..."
                          rows={3}
                          className="w-full px-2.5 py-1.5 rounded border border-[#d3d1c7] text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleAddNote}
                            disabled={!newNoteContent.trim() || submitting}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a18] text-white text-xs rounded-lg hover:bg-[#2a2a28] disabled:opacity-50"
                          >
                            <Save className="w-3 h-3" />
                            Save Note
                          </button>
                          <button
                            onClick={() => setShowNewNote(false)}
                            className="px-3 py-1.5 text-xs text-[#888780]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowNewNote(true)}
                        className="flex items-center gap-1.5 text-xs text-[#3266ad] hover:underline"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Note
                      </button>
                    )}
                  </div>
                )}

                {card.notes.length === 0 && !showNewNote ? (
                  <p className="text-xs text-[#b4b2a9] text-center py-4 italic">
                    No notes yet
                  </p>
                ) : (
                  card.notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-[#fffde6] border border-[#f0e9a0]"
                    >
                      {note.title && (
                        <h4 className="text-xs font-medium text-[#1a1a18] mb-1">
                          {note.title}
                        </h4>
                      )}
                      <p className="text-sm text-[#5f5e5a] whitespace-pre-wrap leading-relaxed">
                        {note.content}
                      </p>
                      <div className="text-[10px] text-[#b4b2a9] mt-2">
                        {formatDateTime(note.updatedAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="space-y-2">
                {card.activities.length === 0 ? (
                  <p className="text-xs text-[#b4b2a9] text-center py-4 italic">
                    No activity recorded
                  </p>
                ) : (
                  card.activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start gap-2 py-2 border-b border-[#f1efe8] last:border-0"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d3d1c7] mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-[#5f5e5a]">
                          {act.user && (
                            <span className="font-medium text-[#1a1a18]">
                              {act.user.fullName}
                            </span>
                          )}{" "}
                          {act.detail}
                        </p>
                        <span className="text-[10px] text-[#b4b2a9]">
                          {formatDateTime(act.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
