"use client";

import { useState, useEffect } from "react";
import {
  Hammer,
  Wrench,
  TrendingUp,
  ListChecks,
  Loader2,
  BarChart3,
  Clock,
} from "lucide-react";

interface ReportData {
  totalCards: number;
  builds: SummaryData;
  repairs: SummaryData;
  untyped: number;
}

interface SummaryData {
  total: number;
  totalJobs: number;
  completedJobs: number;
  jobProgress: number;
  byList: Record<string, number>;
  recentCount: number;
}

interface WorkspaceReportProps {
  workspaceId: string;
}

function ProgressRing({
  percentage,
  color,
  size = 56,
}: {
  percentage: number;
  color: string;
  size?: number;
}) {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e8e6df"
        strokeWidth={5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

function SummaryCard({
  label,
  icon: Icon,
  color,
  bgColor,
  data,
}: {
  label: string;
  icon: typeof Hammer;
  color: string;
  bgColor: string;
  data: SummaryData;
}) {
  const topLists = Object.entries(data.byList)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  return (
    <div className="bg-white rounded-2xl border border-[#e8e6df] overflow-hidden">
      {/* Header band */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ backgroundColor: bgColor }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: color + "20", color }}
          >
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1a1a18]">{label}</h3>
            <p className="text-[10px] text-[#888780]">
              {data.recentCount > 0
                ? `${data.recentCount} new this week`
                : "No new entries this week"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#1a1a18] leading-none">
            {data.total}
          </div>
          <div className="text-[10px] text-[#888780] mt-0.5">total</div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Job progress */}
        {data.totalJobs > 0 && (
          <div className="flex items-center gap-4">
            <div className="relative flex items-center justify-center">
              <ProgressRing percentage={data.jobProgress} color={color} />
              <span
                className="absolute text-xs font-bold"
                style={{ color }}
              >
                {data.jobProgress}%
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-xs text-[#5f5e5a] mb-1">
                <ListChecks className="w-3.5 h-3.5" style={{ color }} />
                Job Progress
              </div>
              <div className="w-full bg-[#e8e6df] rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${data.jobProgress}%`, backgroundColor: color }}
                />
              </div>
              <div className="text-[10px] text-[#b4b2a9] mt-1">
                {data.completedJobs} of {data.totalJobs} jobs completed
              </div>
            </div>
          </div>
        )}

        {/* Distribution by column */}
        {topLists.length > 0 && (
          <div>
            <div className="text-[10px] font-medium text-[#888780] uppercase tracking-wider mb-2">
              Distribution
            </div>
            <div className="space-y-1.5">
              {topLists.map(([listName, count]) => {
                const pct = data.total > 0 ? (count / data.total) * 100 : 0;
                return (
                  <div key={listName} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-[#5f5e5a] truncate">
                          {listName}
                        </span>
                        <span className="text-xs font-medium text-[#1a1a18] ml-2">
                          {count}
                        </span>
                      </div>
                      <div className="w-full bg-[#f5f4f0] rounded-full h-1">
                        <div
                          className="h-1 rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color + "80",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.total === 0 && data.totalJobs === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-[#b4b2a9] italic">
              No {label.toLowerCase()} entries yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WorkspaceReport({ workspaceId }: WorkspaceReportProps) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/report`);
        const data = await res.json();
        if (data.success) setReport(data.data);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [workspaceId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-[#888780]" />
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="space-y-4">
      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-[#e8e6df] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#f0f4ff] text-[#3266ad] flex items-center justify-center">
            <BarChart3 className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#1a1a18] leading-none">
              {report.totalCards}
            </div>
            <div className="text-[10px] text-[#888780] mt-0.5">Total Instruments</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e8e6df] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#f0fff5] text-[#2a7a4a] flex items-center justify-center">
            <TrendingUp className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#1a1a18] leading-none">
              {report.builds.recentCount + report.repairs.recentCount}
            </div>
            <div className="text-[10px] text-[#888780] mt-0.5">New This Week</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e8e6df] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#fef2f2] text-[#dc2626] flex items-center justify-center">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-lg font-bold text-[#1a1a18] leading-none">
              {report.builds.totalJobs + report.repairs.totalJobs > 0
                ? Math.round(
                    ((report.builds.completedJobs + report.repairs.completedJobs) /
                      (report.builds.totalJobs + report.repairs.totalJobs)) *
                      100
                  )
                : 0}
              %
            </div>
            <div className="text-[10px] text-[#888780] mt-0.5">Jobs Complete</div>
          </div>
        </div>
      </div>

      {/* Build / Repair breakdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard
          label="Builds"
          icon={Hammer}
          color="#2a7a4a"
          bgColor="#f0fff5"
          data={report.builds}
        />
        <SummaryCard
          label="Repairs"
          icon={Wrench}
          color="#dc2626"
          bgColor="#fef2f2"
          data={report.repairs}
        />
      </div>
    </div>
  );
}
