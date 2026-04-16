"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FlaskConical, LogOut, Settings, Users, ChevronRight, Trash2, Activity, Search, X, Loader2, FileText, Building2, Tag } from "lucide-react";
import { getInitials } from "@/lib/utils";

interface SearchResult {
  cards: {
    id: string;
    title: string;
    type: string | null;
    status: string | null;
    workspace: string;
    workspaceSlug: string;
    board: string;
    boardSlug: string;
    list: string;
  }[];
  workspaces: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
  }[];
}

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const canSearch = user.role === "admin" || user.role === "editor";

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data);
      }
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      doSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, doSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

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
          {/* Global Search */}
          {canSearch && (
            <div ref={searchRef} className="relative">
              <button
                onClick={() => {
                  setShowSearch(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#888780] bg-[#f5f4f0] hover:bg-[#eeedea] border border-[#e8e6df] transition w-48 lg:w-64"
              >
                <Search className="w-3.5 h-3.5" />
                <span className="flex-1 text-left">Search...</span>
                <kbd className="hidden sm:inline text-[10px] bg-white border border-[#d3d1c7] rounded px-1 py-0.5 font-mono text-[#b4b2a9]">
                  ⌘K
                </kbd>
              </button>

              {showSearch && (
                <div className="absolute top-0 right-0 w-80 lg:w-96 bg-white rounded-xl shadow-2xl border border-[#e8e6df] z-50 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#e8e6df]">
                    <Search className="w-4 h-4 text-[#888780]" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search cards, workspaces..."
                      className="flex-1 text-sm text-[#1a1a18] placeholder:text-[#b4b2a9] border-none focus:outline-none bg-transparent"
                      autoFocus
                    />
                    {searchLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#888780]" />}
                    <button
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery("");
                        setSearchResults(null);
                      }}
                      className="p-1 rounded hover:bg-[#f5f4f0]"
                    >
                      <X className="w-3.5 h-3.5 text-[#888780]" />
                    </button>
                  </div>

                  {searchResults && (
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.cards.length === 0 && searchResults.workspaces.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-[#b4b2a9]">
                          No results for &ldquo;{searchQuery}&rdquo;
                        </div>
                      ) : (
                        <>
                          {searchResults.workspaces.length > 0 && (
                            <div>
                              <div className="px-3 py-1.5 text-[10px] font-medium text-[#888780] uppercase tracking-wider bg-[#fafaf8]">
                                Workspaces
                              </div>
                              {searchResults.workspaces.map((w) => (
                                <Link
                                  key={w.id}
                                  href={`/workspace/${w.slug}`}
                                  onClick={() => {
                                    setShowSearch(false);
                                    setSearchQuery("");
                                  }}
                                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#f5f4f0] transition"
                                >
                                  <Building2 className="w-4 h-4 text-[#888780]" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-[#1a1a18] truncate">{w.name}</div>
                                    {w.description && (
                                      <div className="text-[10px] text-[#b4b2a9] truncate">{w.description}</div>
                                    )}
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                          {searchResults.cards.length > 0 && (
                            <div>
                              <div className="px-3 py-1.5 text-[10px] font-medium text-[#888780] uppercase tracking-wider bg-[#fafaf8]">
                                Cards
                              </div>
                              {searchResults.cards.map((c) => (
                                <Link
                                  key={c.id}
                                  href={`/workspace/${c.workspaceSlug}/board/${c.boardSlug}`}
                                  onClick={() => {
                                    setShowSearch(false);
                                    setSearchQuery("");
                                  }}
                                  className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#f5f4f0] transition"
                                >
                                  <FileText className="w-4 h-4 text-[#888780]" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-[#1a1a18] truncate">{c.title}</div>
                                    <div className="text-[10px] text-[#b4b2a9] truncate">
                                      {c.workspace} &rsaquo; {c.board} &rsaquo; {c.list}
                                    </div>
                                  </div>
                                  {c.status && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f5f4f0] text-[#888780]">
                                      {c.status.replace("_", " ")}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {!searchResults && searchQuery.length < 2 && (
                    <div className="px-4 py-6 text-center text-xs text-[#b4b2a9]">
                      Type at least 2 characters to search
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {user.role === "admin" && (
            <>
              <Link
                href="/admin/users"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#5f5e5a] hover:bg-[#f5f4f0] transition"
              >
                <Users className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Users</span>
              </Link>
              <Link
                href="/admin/trash"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#5f5e5a] hover:bg-[#f5f4f0] transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trash</span>
              </Link>
              <Link
                href="/admin/labels"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#5f5e5a] hover:bg-[#f5f4f0] transition"
              >
                <Tag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Labels</span>
              </Link>
              <Link
                href="/admin/activity"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#5f5e5a] hover:bg-[#f5f4f0] transition"
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Activity</span>
              </Link>
            </>
          )}

          <Link
            href="/settings"
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
