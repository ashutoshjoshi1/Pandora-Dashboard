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
  Pencil,
  ArrowRightLeft,
  Check,
  Trash2,
  ListChecks,
  Paperclip,
  CalendarDays,
  Flag,
  ExternalLink,
  FileSpreadsheet,
  Presentation,
  FolderOpen,
  Link2,
  AlertCircle,
} from "lucide-react";
import { formatDateTime, getInitials } from "@/lib/utils";

interface BoardListOption {
  id: string;
  name: string;
}

interface LabelOption {
  id: string;
  name: string;
  color: string;
}

interface CardJob {
  id: string;
  name: string;
  completed: boolean;
  completedAt: string | null;
  user: { id: string; fullName: string } | null;
}

interface CardAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: string;
  addedBy: { id: string; fullName: string; username: string };
}

interface CardDetail {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  type: string | null;
  dueDate: string | null;
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
  attachments: CardAttachment[];
  jobs: CardJob[];
  list: {
    id: string;
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
  boardLists?: BoardListOption[];
  onClose: () => void;
  onDeleted?: () => void;
}

export default function CardDetailDrawer({
  cardId,
  userRole,
  boardLists,
  onClose,
  onDeleted,
}: CardDetailDrawerProps) {
  const router = useRouter();
  const [card, setCard] = useState<CardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"comments" | "notes" | "activity" | "documents">(
    "comments"
  );
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [showNewNote, setShowNewNote] = useState(false);
  const [allLabels, setAllLabels] = useState<LabelOption[]>([]);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

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

  useEffect(() => {
    async function fetchLabels() {
      const res = await fetch("/api/labels");
      const data = await res.json();
      if (data.success) setAllLabels(data.data);
    }
    fetchLabels();
  }, []);

  async function handleSaveTitle() {
    if (!card || !titleDraft.trim()) return;
    setSubmitting(true);
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titleDraft.trim() }),
      });
      setEditingTitle(false);
      await fetchCard();
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleLabel(labelId: string, isActive: boolean) {
    if (isActive) {
      await fetch(`/api/cards/${cardId}/labels`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId }),
      });
    } else {
      await fetch(`/api/cards/${cardId}/labels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId }),
      });
    }
    await fetchCard();
    router.refresh();
  }

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

  async function handleMoveToList(newListId: string) {
    if (!card || newListId === card.list.id) return;
    setSubmitting(true);
    try {
      await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: newListId }),
      });
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

  async function handleToggleJob(jobId: string, completed: boolean) {
    await fetch(`/api/cards/${cardId}/jobs`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, completed }),
    });
    await fetchCard();
  }

  async function handleUpdateStatus(status: string) {
    if (!card) return;
    await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchCard();
    router.refresh();
  }

  async function handleUpdatePriority(priority: string) {
    if (!card) return;
    await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority }),
    });
    await fetchCard();
    router.refresh();
  }

  async function handleUpdateDueDate(dateStr: string) {
    if (!card) return;
    await fetch(`/api/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: dateStr || null }),
    });
    await fetchCard();
    router.refresh();
  }

  async function handleAddAttachment() {
    if (!attachmentUrl.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cards/${cardId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: attachmentUrl.trim(),
          name: attachmentName.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAttachmentUrl("");
        setAttachmentName("");
        setShowAttachmentForm(false);
        await fetchCard();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAttachment(attachmentId: string) {
    await fetch(`/api/cards/${cardId}/attachments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachmentId }),
    });
    await fetchCard();
  }

  function getAttachmentIcon(type: string) {
    switch (type) {
      case "google_doc":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "google_sheet":
        return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
      case "google_slide":
        return <Presentation className="w-4 h-4 text-amber-600" />;
      case "google_drive":
        return <FolderOpen className="w-4 h-4 text-yellow-600" />;
      default:
        return <Link2 className="w-4 h-4 text-[#888780]" />;
    }
  }

  function getPriorityColor(priority: string | null) {
    switch (priority) {
      case "urgent":
        return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
      case "high":
        return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" };
      case "medium":
        return { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" };
      case "low":
        return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" };
      default:
        return { bg: "bg-[#f5f4f0]", text: "text-[#888780]", border: "border-[#e8e6df]" };
    }
  }

  function getStatusColor(status: string | null) {
    switch (status) {
      case "done":
        return { bg: "bg-emerald-50", text: "text-emerald-700" };
      case "in_progress":
        return { bg: "bg-blue-50", text: "text-blue-700" };
      case "review":
        return { bg: "bg-purple-50", text: "text-purple-700" };
      case "blocked":
        return { bg: "bg-red-50", text: "text-red-700" };
      default:
        return { bg: "bg-[#f5f4f0]", text: "text-[#888780]" };
    }
  }

  function isDueDateOverdue(dueDate: string | null) {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && card?.status !== "done";
  }

  async function handleDeleteCard() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        onDeleted?.();
        onClose();
        router.refresh();
      }
    } finally {
      setSubmitting(false);
      setConfirmingDelete(false);
    }
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
    <>
    <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white h-full overflow-y-auto shadow-xl animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#e8e6df] z-10">
          <div className="px-6 py-4 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              {/* List badge + Move */}
              <div className="flex items-center gap-2 text-[10px] text-[#888780] mb-1">
                {canEdit && boardLists && boardLists.length > 1 ? (
                  <div className="flex items-center gap-1">
                    <ArrowRightLeft className="w-3 h-3 text-[#b4b2a9]" />
                    <select
                      value={card.list.id}
                      onChange={(e) => handleMoveToList(e.target.value)}
                      className="text-[10px] bg-[#f5f4f0] rounded px-1.5 py-0.5 text-[#5f5e5a] font-medium uppercase border-none focus:outline-none focus:ring-1 focus:ring-[#3266ad]/30 cursor-pointer"
                    >
                      {boardLists.map((bl) => (
                        <option key={bl.id} value={bl.id}>
                          {bl.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="px-1.5 py-0.5 bg-[#f5f4f0] rounded text-[#5f5e5a] font-medium uppercase">
                    {card.list.name}
                  </span>
                )}
              </div>

              {/* Editable Title */}
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveTitle();
                      if (e.key === "Escape") setEditingTitle(false);
                    }}
                    autoFocus
                    className="flex-1 text-lg font-medium text-[#1a1a18] px-2 py-1 rounded border border-[#d3d1c7] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
                  />
                  <button
                    onClick={handleSaveTitle}
                    disabled={submitting || !titleDraft.trim()}
                    className="p-1.5 bg-[#1a1a18] text-white rounded-lg hover:bg-[#2a2a28] disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingTitle(false)}
                    className="p-1.5 rounded-lg hover:bg-[#f5f4f0]"
                  >
                    <X className="w-3.5 h-3.5 text-[#888780]" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/title">
                  <h2 className="text-lg font-medium text-[#1a1a18] truncate">
                    {card.title}
                  </h2>
                  {canEdit && (
                    <button
                      onClick={() => {
                        setEditingTitle(true);
                        setTitleDraft(card.title);
                      }}
                      className="p-1 rounded hover:bg-[#f5f4f0] opacity-0 group-hover/title:opacity-100 transition"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#888780]" />
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {canEdit && (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition group"
                  title="Move to trash"
                >
                  <Trash2 className="w-4 h-4 text-[#b4b2a9] group-hover:text-red-500" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[#f5f4f0] transition"
              >
                <X className="w-5 h-5 text-[#888780]" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Labels */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f5e5a]">
                <Tag className="w-3.5 h-3.5" />
                Labels
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowLabelPicker(!showLabelPicker)}
                  className="text-xs text-[#3266ad] hover:underline"
                >
                  {showLabelPicker ? "Done" : "Edit"}
                </button>
              )}
            </div>

            {/* Current labels */}
            <div className="flex gap-1.5 flex-wrap mb-2">
              {card.labels.length > 0 ? (
                card.labels.map((cl) => (
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
                ))
              ) : (
                <span className="text-xs text-[#b4b2a9] italic">No labels</span>
              )}
            </div>

            {/* Label picker */}
            {showLabelPicker && allLabels.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 p-3 bg-[#fafaf8] rounded-lg border border-[#e8e6df]">
                {allLabels.map((label) => {
                  const isActive = card.labels.some(
                    (cl) => cl.label.id === label.id
                  );
                  return (
                    <button
                      key={label.id}
                      onClick={() => handleToggleLabel(label.id, isActive)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition hover:opacity-80"
                      style={{
                        backgroundColor: label.color + (isActive ? "30" : "10"),
                        color: label.color,
                        border: isActive
                          ? `2px solid ${label.color}`
                          : "2px solid transparent",
                      }}
                    >
                      {isActive && <Check className="w-3 h-3" />}
                      {label.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status · Priority · Due Date row */}
          <div className="grid grid-cols-3 gap-3">
            {/* Status */}
            <div className="bg-[#fafaf8] rounded-lg px-3 py-2.5 border border-[#e8e6df]">
              <div className="text-[10px] text-[#888780] font-medium mb-1.5 uppercase tracking-wider">Status</div>
              {canEdit ? (
                <select
                  value={card.status || ""}
                  onChange={(e) => handleUpdateStatus(e.target.value)}
                  className={`w-full text-xs font-medium bg-transparent border-none p-0 focus:outline-none focus:ring-0 cursor-pointer ${getStatusColor(card.status).text}`}
                >
                  <option value="">Not set</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              ) : (
                <div className={`text-xs font-medium ${getStatusColor(card.status).text}`}>
                  {card.status?.replace("_", " ") || "Not set"}
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="bg-[#fafaf8] rounded-lg px-3 py-2.5 border border-[#e8e6df]">
              <div className="text-[10px] text-[#888780] font-medium mb-1.5 uppercase tracking-wider">Priority</div>
              {canEdit ? (
                <div className="flex items-center gap-1.5">
                  <Flag className={`w-3 h-3 ${getPriorityColor(card.priority).text}`} />
                  <select
                    value={card.priority || ""}
                    onChange={(e) => handleUpdatePriority(e.target.value)}
                    className={`flex-1 text-xs font-medium bg-transparent border-none p-0 focus:outline-none focus:ring-0 cursor-pointer ${getPriorityColor(card.priority).text}`}
                  >
                    <option value="">None</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              ) : (
                <div className={`flex items-center gap-1.5 text-xs font-medium ${getPriorityColor(card.priority).text}`}>
                  <Flag className="w-3 h-3" />
                  {card.priority || "None"}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className={`rounded-lg px-3 py-2.5 border ${isDueDateOverdue(card.dueDate) ? "bg-red-50 border-red-200" : "bg-[#fafaf8] border-[#e8e6df]"}`}>
              <div className="text-[10px] text-[#888780] font-medium mb-1.5 uppercase tracking-wider flex items-center gap-1">
                Due Date
                {isDueDateOverdue(card.dueDate) && <AlertCircle className="w-3 h-3 text-red-500" />}
              </div>
              {canEdit ? (
                <input
                  type="date"
                  value={card.dueDate ? new Date(card.dueDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => handleUpdateDueDate(e.target.value)}
                  className={`w-full text-xs font-medium bg-transparent border-none p-0 focus:outline-none focus:ring-0 cursor-pointer ${isDueDateOverdue(card.dueDate) ? "text-red-700" : "text-[#1a1a18]"}`}
                />
              ) : (
                <div className={`text-xs font-medium ${isDueDateOverdue(card.dueDate) ? "text-red-700" : "text-[#1a1a18]"}`}>
                  {card.dueDate ? new Date(card.dueDate).toLocaleDateString() : "Not set"}
                </div>
              )}
            </div>
          </div>

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

          {/* Custom Fields — always shown */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f5e5a] mb-2">
              <Settings2 className="w-3.5 h-3.5" />
              Custom Fields
            </div>
            {card.customFields.length > 0 ? (
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
                      ) : canEdit && !options ? (
                        <input
                          type="text"
                          value={cf.value || ""}
                          onChange={(e) =>
                            handleUpdateCustomField(cf.field.id, e.target.value)
                          }
                          placeholder="Enter value..."
                          className="w-full text-xs bg-transparent text-[#1a1a18] border-none p-0 focus:outline-none focus:ring-0 placeholder:text-[#b4b2a9]"
                        />
                      ) : (
                        <div className="text-xs text-[#1a1a18] font-medium">
                          {cf.value || (
                            <span className="text-[#b4b2a9]">&mdash;</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-[#b4b2a9] italic bg-[#fafaf8] rounded-lg p-3 border border-[#e8e6df]">
                No custom fields defined
              </div>
            )}
          </div>

          {/* Jobs Checklist */}
          {card.jobs && card.jobs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f5e5a]">
                  <ListChecks className="w-3.5 h-3.5" />
                  Job Checklist
                </div>
                <span className="text-[10px] text-[#888780] font-medium">
                  {card.jobs.filter((j) => j.completed).length}/{card.jobs.length} done
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-[#e8e6df] rounded-full h-1.5 mb-3">
                <div
                  className="h-1.5 rounded-full bg-[#2a7a4a] transition-all duration-300"
                  style={{
                    width: `${card.jobs.length > 0 ? (card.jobs.filter((j) => j.completed).length / card.jobs.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="space-y-1">
                {card.jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => canEdit && handleToggleJob(job.id, !job.completed)}
                    disabled={!canEdit}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition ${
                      job.completed
                        ? "bg-[#f0fff5] border border-[#c8e6d0]"
                        : "bg-[#fafaf8] border border-[#e8e6df] hover:border-[#d3d1c7]"
                    } ${canEdit ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                        job.completed
                          ? "bg-[#2a7a4a] border-[#2a7a4a]"
                          : "border-[#d3d1c7]"
                      }`}
                    >
                      {job.completed && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span
                      className={`flex-1 ${
                        job.completed
                          ? "text-[#888780] line-through"
                          : "text-[#1a1a18]"
                      }`}
                    >
                      {job.name}
                    </span>
                    {job.completed && job.user && (
                      <span className="text-[10px] text-[#b4b2a9]">
                        {job.user.fullName}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Attachments & Documents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#5f5e5a]">
                <Paperclip className="w-3.5 h-3.5" />
                Attachments & Documents
                {card.attachments && card.attachments.length > 0 && (
                  <span className="text-[10px] bg-[#e8e6df] rounded-full px-1.5 text-[#888780]">
                    {card.attachments.length}
                  </span>
                )}
              </div>
              {canEdit && (
                <button
                  onClick={() => setShowAttachmentForm(!showAttachmentForm)}
                  className="flex items-center gap-1 text-xs text-[#3266ad] hover:underline"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              )}
            </div>

            {/* Add Attachment Form */}
            {showAttachmentForm && (
              <div className="mb-3 p-3 bg-[#fafaf8] rounded-lg border border-[#e8e6df] space-y-2">
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="Paste a Google Docs, Sheets, or any URL..."
                  className="w-full px-2.5 py-1.5 rounded border border-[#d3d1c7] text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
                />
                <input
                  type="text"
                  value={attachmentName}
                  onChange={(e) => setAttachmentName(e.target.value)}
                  placeholder="Display name (optional, auto-detected)"
                  className="w-full px-2.5 py-1.5 rounded border border-[#d3d1c7] text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddAttachment}
                    disabled={!attachmentUrl.trim() || submitting}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a18] text-white text-xs rounded-lg hover:bg-[#2a2a28] disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Paperclip className="w-3 h-3" />
                    )}
                    Attach
                  </button>
                  <button
                    onClick={() => {
                      setShowAttachmentForm(false);
                      setAttachmentUrl("");
                      setAttachmentName("");
                    }}
                    className="px-3 py-1.5 text-xs text-[#888780] hover:text-[#1a1a18]"
                  >
                    Cancel
                  </button>
                </div>
                <p className="text-[10px] text-[#b4b2a9]">
                  Supports Google Docs, Sheets, Slides, Drive links, and any URL
                </p>
              </div>
            )}

            {/* Attachment List */}
            {card.attachments && card.attachments.length > 0 ? (
              <div className="space-y-1.5">
                {card.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-[#fafaf8] border border-[#e8e6df] group hover:border-[#d3d1c7] transition"
                  >
                    <div className="flex-shrink-0">{getAttachmentIcon(att.type)}</div>
                    <div className="flex-1 min-w-0">
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#1a1a18] hover:text-[#3266ad] hover:underline truncate block"
                      >
                        {att.name}
                      </a>
                      <div className="flex items-center gap-2 text-[10px] text-[#b4b2a9]">
                        <span className="capitalize">{att.type.replace(/_/g, " ")}</span>
                        <span>&middot;</span>
                        <span>{att.addedBy.fullName}</span>
                        <span>&middot;</span>
                        <span>{formatDateTime(att.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-[#e8e6df] transition"
                        title="Open in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-[#888780]" />
                      </a>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteAttachment(att.id)}
                          className="p-1.5 rounded hover:bg-red-50 transition"
                          title="Remove attachment"
                        >
                          <X className="w-3.5 h-3.5 text-[#b4b2a9] hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : !showAttachmentForm ? (
              <div className="text-xs text-[#b4b2a9] italic bg-[#fafaf8] rounded-lg p-3 border border-[#e8e6df]">
                No attachments — attach Google Docs, Sheets, or any link
              </div>
            ) : null}
          </div>

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
                    key: "documents" as const,
                    icon: FileText,
                    label: "Docs",
                    count: card.attachments?.filter((a) => a.type.startsWith("google_")).length || 0,
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

            {/* Documents Tab — embedded Google Docs viewer */}
            {activeTab === "documents" && (
              <div className="space-y-3">
                {(() => {
                  const googleDocs = card.attachments?.filter((a) =>
                    a.type.startsWith("google_")
                  ) || [];
                  if (googleDocs.length === 0) {
                    return (
                      <p className="text-xs text-[#b4b2a9] text-center py-4 italic">
                        No Google Documents attached — add one from the Attachments section above
                      </p>
                    );
                  }
                  return googleDocs.map((doc) => {
                    const embedUrl = doc.url.includes("/edit")
                      ? doc.url.replace("/edit", "/preview")
                      : doc.url.includes("/view")
                      ? doc.url
                      : doc.url + (doc.url.includes("?") ? "&" : "?") + "embedded=true";
                    return (
                      <div key={doc.id} className="rounded-lg border border-[#e8e6df] overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-[#fafaf8] border-b border-[#e8e6df]">
                          <div className="flex items-center gap-2">
                            {getAttachmentIcon(doc.type)}
                            <span className="text-xs font-medium text-[#1a1a18] truncate">{doc.name}</span>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] text-[#3266ad] hover:underline"
                          >
                            Open in Google
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        <iframe
                          src={embedUrl}
                          className="w-full border-0"
                          style={{ height: "400px" }}
                          title={doc.name}
                          sandbox="allow-scripts allow-same-origin allow-popups"
                        />
                      </div>
                    );
                  });
                })()}
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

    {/* Delete Confirmation Modal */}
    {confirmingDelete && (
      <div
        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
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
                Move to Trash?
              </h3>
              <p className="text-sm text-[#5f5e5a] mt-1">
                <strong>&ldquo;{card.title}&rdquo;</strong> will be moved to the trash.
                An admin can restore it later from the Trash page.
              </p>
            </div>
          </div>
          <div className="px-6 py-4 bg-[#fafaf8] border-t border-[#e8e6df] flex justify-end gap-2">
            <button
              onClick={() => setConfirmingDelete(false)}
              className="px-4 py-2 text-sm text-[#5f5e5a] hover:text-[#1a1a18] transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteCard}
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Move to Trash
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
