"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import CreateWorkspaceModal from "./CreateWorkspaceModal";

interface DashboardClientProps {
  isAdmin: boolean;
}

export default function DashboardClient({ isAdmin }: DashboardClientProps) {
  const [showCreate, setShowCreate] = useState(false);

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={() => setShowCreate(true)}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1a1a18] text-white text-xs font-medium rounded-xl hover:bg-[#2a2a28] transition"
      >
        <Plus className="w-3.5 h-3.5" />
        New Workspace
      </button>

      {showCreate && (
        <CreateWorkspaceModal onClose={() => setShowCreate(false)} />
      )}
    </>
  );
}
