"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Loader2,
  Hammer,
  Wrench,
  ChevronRight,
  ChevronLeft,
  Check,
  ListChecks,
  Settings2,
  FileText,
} from "lucide-react";
import { BUILD_JOBS, REPAIR_JOBS } from "@/config/job-templates";

interface FieldDefinition {
  id: string;
  name: string;
  type: string;
  options: string | null;
}

interface BoardListOption {
  id: string;
  name: string;
}

interface NewEntryWizardProps {
  type: "build" | "repair";
  workspaceId: string;
  boards: {
    id: string;
    name: string;
    lists: BoardListOption[];
  }[];
  onClose: () => void;
}

export default function NewEntryWizard({
  type,
  workspaceId,
  boards,
  onClose,
}: NewEntryWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fields, setFields] = useState<FieldDefinition[]>([]);

  // Step 0: Basic info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState(boards[0]?.id || "");
  const [selectedListId, setSelectedListId] = useState("");

  // Step 1: Custom fields
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Step 2: Jobs
  const templateJobs = type === "build" ? BUILD_JOBS : REPAIR_JOBS;
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(
    new Set(templateJobs)
  );
  const [customJob, setCustomJob] = useState("");

  const selectedBoard = boards.find((b) => b.id === selectedBoardId);
  const lists = selectedBoard?.lists || [];

  useEffect(() => {
    if (lists.length > 0 && !selectedListId) {
      setSelectedListId(lists[0].id);
    }
  }, [lists, selectedListId]);

  useEffect(() => {
    async function fetchFields() {
      const res = await fetch("/api/labels");
      // Fetch custom field definitions
      const fieldsRes = await fetch("/api/custom-fields");
      const fieldsData = await fieldsRes.json();
      if (fieldsData.success) setFields(fieldsData.data);
    }
    fetchFields();
  }, []);

  const isBuild = type === "build";
  const accent = isBuild ? "#2a7a4a" : "#dc2626";
  const accentBg = isBuild ? "#f0fff5" : "#fef2f2";
  const Icon = isBuild ? Hammer : Wrench;

  const steps = [
    { label: "Details", icon: FileText },
    { label: "Specifications", icon: Settings2 },
    { label: "Job Checklist", icon: ListChecks },
  ];

  function toggleJob(job: string) {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(job)) next.delete(job);
      else next.add(job);
      return next;
    });
  }

  function addCustomJob() {
    if (!customJob.trim()) return;
    setSelectedJobs((prev) => new Set([...prev, customJob.trim()]));
    setCustomJob("");
  }

  async function handleSubmit() {
    if (!title.trim() || !selectedListId || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      // 1. Create the card
      const cardRes = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          listId: selectedListId,
          type,
        }),
      });
      const cardData = await cardRes.json();
      if (!cardData.success) {
        setError(cardData.error || "Failed to create card");
        return;
      }
      const cardId = cardData.data.id;

      // 2. Set custom field values
      const fieldPromises = Object.entries(fieldValues)
        .filter(([, value]) => value)
        .map(([fieldId, value]) =>
          fetch(`/api/cards/${cardId}/custom-fields`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fieldId, value }),
          })
        );

      // 3. Create jobs
      const jobs = Array.from(selectedJobs);
      const jobsRes = await fetch(`/api/cards/${cardId}/jobs/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs }),
      });

      // 4. Add the type label
      const labelName = isBuild ? "New Build" : "Repair";
      const labelsRes = await fetch("/api/labels");
      const labelsData = await labelsRes.json();
      if (labelsData.success) {
        const label = labelsData.data.find(
          (l: { name: string }) => l.name === labelName
        );
        if (label) {
          await fetch(`/api/cards/${cardId}/labels`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ labelId: label.id }),
          });
        }
      }

      await Promise.all(fieldPromises);
      await jobsRes;

      onClose();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-5 border-b transition-colors duration-300"
          style={{ backgroundColor: accentBg, borderColor: accent + "20" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: accent + "20", color: accent }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1a1a18]">
                  New {isBuild ? "Build" : "Repair"}
                </h2>
                <p className="text-xs text-[#888780]">
                  {isBuild
                    ? "Create a new instrument build entry"
                    : "Log a new instrument repair entry"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black/5 transition">
              <X className="w-5 h-5 text-[#888780]" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            {steps.map((s, i) => (
              <button
                key={i}
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  i === step
                    ? "text-white"
                    : i < step
                      ? "text-[#5f5e5a] bg-white/60 hover:bg-white/80"
                      : "text-[#b4b2a9]"
                }`}
                style={i === step ? { backgroundColor: accent } : undefined}
                disabled={i > step}
              >
                {i < step ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <s.icon className="w-3.5 h-3.5" />
                )}
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Step 0: Basic Info */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#5f5e5a] mb-1.5">
                  Instrument Name / ID <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isBuild ? "e.g. 316s1" : "e.g. Pandora 85 — FW repair"}
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-xl border border-[#d3d1c7] text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:border-transparent transition"
                  style={{ ["--tw-ring-color" as string]: accent + "30" }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5f5e5a] mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description, notes, or context for this entry..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#d3d1c7] text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-transparent transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#5f5e5a] mb-1.5">
                    Board
                  </label>
                  <select
                    value={selectedBoardId}
                    onChange={(e) => {
                      setSelectedBoardId(e.target.value);
                      setSelectedListId("");
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#d3d1c7] text-sm text-[#1a1a18] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 transition bg-white"
                  >
                    {boards.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#5f5e5a] mb-1.5">
                    Starting Column
                  </label>
                  <select
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#d3d1c7] text-sm text-[#1a1a18] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 transition bg-white"
                  >
                    {lists.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Custom Fields */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-xs text-[#888780]">
                Set the instrument specifications. You can always update these later from the card detail view.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {fields.map((f) => {
                  const options = f.options ? JSON.parse(f.options) : null;
                  return (
                    <div
                      key={f.id}
                      className="bg-[#fafaf8] rounded-xl px-3 py-2.5 border border-[#e8e6df]"
                    >
                      <label className="block text-[10px] text-[#888780] font-medium mb-1">
                        {f.name}
                      </label>
                      {options ? (
                        <select
                          value={fieldValues[f.id] || ""}
                          onChange={(e) =>
                            setFieldValues((prev) => ({
                              ...prev,
                              [f.id]: e.target.value,
                            }))
                          }
                          className="w-full text-sm bg-white border border-[#d3d1c7] rounded-lg px-2 py-1.5 text-[#1a1a18] focus:outline-none focus:ring-1 focus:ring-[#3266ad]/30"
                        >
                          <option value="">Select...</option>
                          {options.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={fieldValues[f.id] || ""}
                          onChange={(e) =>
                            setFieldValues((prev) => ({
                              ...prev,
                              [f.id]: e.target.value,
                            }))
                          }
                          placeholder="Enter value..."
                          className="w-full text-sm bg-white border border-[#d3d1c7] rounded-lg px-2 py-1.5 text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-1 focus:ring-[#3266ad]/30"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Jobs */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-[#888780]">
                  Select the jobs for this {type}. Uncheck items that don't apply or add custom ones.
                </p>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: accentBg, color: accent }}
                >
                  {selectedJobs.size} jobs
                </span>
              </div>

              <div className="space-y-1.5">
                {templateJobs.map((job, i) => {
                  const active = selectedJobs.has(job);
                  return (
                    <button
                      key={job}
                      onClick={() => toggleJob(job)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition ${
                        active
                          ? "bg-[#fafaf8] border border-[#d3d1c7]"
                          : "bg-white border border-transparent opacity-50 hover:opacity-70"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                          active ? "border-transparent" : "border-[#d3d1c7]"
                        }`}
                        style={active ? { backgroundColor: accent } : undefined}
                      >
                        {active && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="text-[#888780] text-xs font-mono w-5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className={active ? "text-[#1a1a18]" : "text-[#888780] line-through"}>
                        {job}
                      </span>
                    </button>
                  );
                })}

                {/* Custom jobs that aren't in the template */}
                {Array.from(selectedJobs)
                  .filter((j) => !templateJobs.includes(j))
                  .map((job) => (
                    <button
                      key={job}
                      onClick={() => toggleJob(job)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left bg-[#fafaf8] border border-[#d3d1c7] transition"
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: accent }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs font-mono w-5 text-[#888780]">+</span>
                      <span className="text-[#1a1a18]">{job}</span>
                    </button>
                  ))}
              </div>

              {/* Add custom job */}
              <div className="flex gap-2 pt-2 border-t border-[#e8e6df]">
                <input
                  type="text"
                  value={customJob}
                  onChange={(e) => setCustomJob(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomJob()}
                  placeholder="Add a custom job step..."
                  className="flex-1 px-3 py-2 rounded-xl border border-[#d3d1c7] text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 transition"
                />
                <button
                  onClick={addCustomJob}
                  disabled={!customJob.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-xl border border-[#d3d1c7] text-[#5f5e5a] hover:bg-[#f5f4f0] disabled:opacity-30 transition"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#fafaf8] border-t border-[#e8e6df] flex items-center justify-between">
          <button
            onClick={() => (step === 0 ? onClose() : setStep(step - 1))}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-[#5f5e5a] hover:text-[#1a1a18] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 0 ? "Cancel" : "Back"}
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !title.trim()}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ backgroundColor: accent }}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !selectedListId || submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
              style={{ backgroundColor: accent }}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Create {isBuild ? "Build" : "Repair"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
