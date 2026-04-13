"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FlaskConical, LogOut, Settings, Users, ChevronRight } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface AppHeaderProps {
  user: {
    fullName: string;
    username: string;
    role: string;
  };
  breadcrumbs?: { label: string; href?: string }[];
}

export default function AppHeader({ user, breadcrumbs }: AppHeaderProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="bg-white border-b border-[#d3d1c7] sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1a1a18] flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-[#1a1a18] hidden sm:block">
              Pandora
            </span>
          </Link>

          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1">
                  <ChevronRight className="w-3.5 h-3.5 text-[#b4b2a9]" />
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-[#5f5e5a] hover:text-[#1a1a18] transition"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-[#1a1a18] font-medium">
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user.role === "admin" && (
            <Link
              href="/admin/users"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#5f5e5a] hover:bg-[#f5f4f0] transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Users</span>
            </Link>
          )}

          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#5f5e5a] hover:bg-[#f5f4f0] transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </Link>

          <div className="w-px h-6 bg-[#e8e6df] mx-1" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#3266ad] text-white flex items-center justify-center text-[10px] font-bold">
              {getInitials(user.fullName)}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-medium text-[#1a1a18] leading-tight">
                {user.fullName}
              </div>
              <div className="text-[10px] text-[#888780] leading-tight">
                {user.role}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-[#888780] hover:text-[#1a1a18] hover:bg-[#f5f4f0] transition"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
