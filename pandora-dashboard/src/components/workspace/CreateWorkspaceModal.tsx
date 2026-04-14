"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, Palette } from "lucide-react";

const PRESET_COLORS = [
  { value: "#2a7a4a", label: "Forest" },
  { value: "#3266ad", label: "Ocean" },
  { value: "#7c3aed", label: "Violet" },
  { value: "#dc2626", label: "Ruby" },
  { value: "#ea580c", label: "Ember" },
  { value: "#0891b2", label: "Teal" },
  { value: "#4f46e5", label: "Indigo" },
  { value: "#be185d", label: "Rose" },
];

const PRESET_ICONS = [
  { value: "flask", label: "Flask" },
  { value: "satellite", label: "Satellite" },
  { value: "microscope", label: "Microscope" },
  { value: "radio", label: "Radio" },
  { value: "cpu", label: "Circuit" },
  { value: "globe", label: "Globe" },
];

interface CreateWorkspaceModalProps {
  onClose: () => void;
}

export default function CreateWorkspaceModal({ onClose }: CreateWorkspaceModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3266ad");
  const [icon, setIcon] = useState("flask");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color, icon }),
      });
      const data = await res.json();
      if (data.success) {
        onClose();
        router.refresh();
      } else {
        setError(data.error || "Failed to create workspace");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with color preview */}
        <div
          className="px-6 py-5 transition-colors duration-300"
          style={{ backgroundColor: color + "15" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1a1a18]">New Workspace</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition">
              <X className="w-5 h-5 text-[#888780]" />
            </button>
          </div>
          <p className="text-sm text-[#5f5e5a] mt-1">
            Create a new workspace to organize instruments and boards.
          </p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[#5f5e5a] mb-1.5">
              Workspace Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="e.g. SciGlob East Coast"
              autoFocus
              className="w-full px-3 py-2.5 rounded-xl border border-[#d3d1c7] text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad] transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#5f5e5a] mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What instruments or projects will this workspace track?"
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-[#d3d1c7] text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad] transition resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-[#5f5e5a] mb-2">
              <Palette className="w-3.5 h-3.5" />
              Accent Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className="w-8 h-8 rounded-full transition-all hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    boxShadow: color === c.value ? `0 0 0 3px white, 0 0 0 5px ${c.value}` : "none",
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-medium text-[#5f5e5a] mb-2">
              Icon
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_ICONS.map((ic) => (
                <button
                  key={ic.value}
                  onClick={() => setIcon(ic.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                    icon === ic.value
                      ? "border-[#1a1a18] bg-[#1a1a18] text-white"
                      : "border-[#d3d1c7] text-[#5f5e5a] hover:border-[#888780]"
                  }`}
                >
                  {ic.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#fafaf8] border-t border-[#e8e6df] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#5f5e5a] hover:text-[#1a1a18] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || submitting}
            className="px-5 py-2 bg-[#1a1a18] text-white text-sm font-medium rounded-xl hover:bg-[#2a2a28] disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create Workspace
          </button>
        </div>
      </div>
    </div>
  );
}
