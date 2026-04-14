"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Loader2,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Layers,
  FileText,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface LogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  detail: string;
  createdAt: string;
  user: { id: string; fullName: string; username: string } | null;
}

const ACTION_CONFIG: Record<string, { icon: typeof Trash2; color: string; bg: string; label: string }> = {
  card_deleted: { icon: Trash2, color: "text-red-500", bg: "bg-red-50", label: "Card Deleted" },
  card_restored: { icon: RotateCcw, color: "text-[#2a7a4a]", bg: "bg-[#f0fff5]", label: "Card Restored" },
  workspace_deleted: { icon: Trash2, color: "text-red-500", bg: "bg-red-50", label: "Workspace Deleted" },
  workspace_restored: { icon: RotateCcw, color: "text-[#2a7a4a]", bg: "bg-[#f0fff5]", label: "Workspace Restored" },
  card_permanently_deleted: { icon: AlertTriangle, color: "text-red-700", bg: "bg-red-100", label: "Card Permanently Deleted" },
  workspace_permanently_deleted: { icon: AlertTriangle, color: "text-red-700", bg: "bg-red-100", label: "Workspace Permanently Deleted" },
};

export default function ActivityLogClient() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/activity-log");
      const data = await res.json();
      if (data.success) setLogs(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

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
        <div className="px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f0f4ff] text-[#3266ad] flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-[#1a1a18]">Activity Log</h1>
              <p className="text-sm text-[#888780]">
                Recent deletion and restoration activity across all workspaces
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Log entries */}
      {logs.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-10 h-10 text-[#d3d1c7] mx-auto mb-3" />
          <p className="text-sm text-[#888780]">No activity recorded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const config = ACTION_CONFIG[log.action] || {
              icon: Activity,
              color: "text-[#888780]",
              bg: "bg-[#f5f4f0]",
              label: log.action,
            };
            const Icon = config.icon;

            return (
              <div
                key={log.id}
                className="bg-white rounded-xl border border-[#e8e6df] px-4 py-3 flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-lg ${config.bg} ${config.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[#b4b2a9]">
                      {log.entityType === "card" ? (
                        <FileText className="w-2.5 h-2.5" />
                      ) : (
                        <Layers className="w-2.5 h-2.5" />
                      )}
                      {log.entityType}
                    </span>
                  </div>
                  <p className="text-sm text-[#5f5e5a] mt-0.5">{log.detail}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[#b4b2a9]">
                    <span>{formatDateTime(log.createdAt)}</span>
                    {log.user && (
                      <>
                        <span>&middot;</span>
                        <span className="font-medium text-[#888780]">{log.user.fullName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
