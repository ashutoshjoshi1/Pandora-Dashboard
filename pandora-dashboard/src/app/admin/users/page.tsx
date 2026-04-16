"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import {
  Users,
  Plus,
  Shield,
  ShieldCheck,
  Eye,
  X,
  Loader2,
  Check,
  Pencil,
  Save,
  Ban,
  CheckCircle2,
} from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";

interface UserData {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
  workspaceAccess: {
    workspace: { name: string; slug: string };
  }[];
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    fullName: string;
    username: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    username: "",
    fullName: "",
    email: "",
    password: "",
    role: "viewer",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    role: "",
    password: "",
  });

  useEffect(() => {
    async function load() {
      const [meRes, usersRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/admin/users"),
      ]);
      const meData = await meRes.json();
      const usersData = await usersRes.json();

      if (!meData.success || meData.data.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setCurrentUser(meData.data);
      if (usersData.success) {
        setUsers(usersData.data);
      }
      setLoading(false);
    }
    load();
  }, [router]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(`User "${form.username}" created successfully`);
        setForm({
          username: "",
          fullName: "",
          email: "",
          password: "",
          role: "viewer",
        });
        setShowAdd(false);
        // Refresh users
        const usersRes = await fetch("/api/admin/users");
        const usersData = await usersRes.json();
        if (usersData.success) setUsers(usersData.data);
      } else {
        setError(data.error || "Failed to create user");
      }
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, string> = {};
      if (editForm.fullName !== editingUser.fullName) body.fullName = editForm.fullName;
      if (editForm.email !== editingUser.email) body.email = editForm.email;
      if (editForm.role !== editingUser.role) body.role = editForm.role;
      if (editForm.password) body.password = editForm.password;

      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setEditingUser(null);
        setSuccess("User updated successfully");
        const usersRes = await fetch("/api/admin/users");
        const usersData = await usersRes.json();
        if (usersData.success) setUsers(usersData.data);
      } else {
        setError(data.error || "Failed to update user");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(userId: string, currentActive: boolean) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !currentActive }),
    });
    const data = await res.json();
    if (data.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, active: !currentActive } : u))
      );
      setSuccess(`User ${!currentActive ? "activated" : "deactivated"} successfully`);
    }
  }

  const roleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <ShieldCheck className="w-3.5 h-3.5 text-[#dc2626]" />;
      case "editor":
        return <Shield className="w-3.5 h-3.5 text-[#3266ad]" />;
      default:
        return <Eye className="w-3.5 h-3.5 text-[#888780]" />;
    }
  };

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
        breadcrumbs={[{ label: "Admin" }, { label: "Users" }]}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#f0f4ff] text-[#3266ad] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-[#1a1a18]">
                User Management
              </h1>
              <p className="text-xs text-[#888780]">
                {users.length} registered users
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a18] text-white text-sm rounded-lg hover:bg-[#2a2a28] transition"
          >
            {showAdd ? (
              <X className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {showAdd ? "Cancel" : "Add User"}
          </button>
        </div>

        {success && (
          <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-2.5 border border-green-200 mb-4 flex items-center gap-2">
            <Check className="w-4 h-4" />
            {success}
          </div>
        )}

        {/* Add User Form */}
        {showAdd && (
          <div className="bg-white rounded-xl border border-[#d3d1c7] p-6 mb-6">
            <h2 className="text-sm font-medium text-[#1a1a18] mb-4">
              Create New User
            </h2>
            <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5f5e5a] mb-1">
                  Username
                </label>
                <input
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f5e5a] mb-1">
                  Full Name
                </label>
                <input
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f5e5a] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f5e5a] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f5e5a] mb-1">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#1a1a18] text-white text-sm rounded-lg hover:bg-[#2a2a28] disabled:opacity-50 transition"
                >
                  {submitting ? "Creating..." : "Create User"}
                </button>
              </div>
              {error && (
                <div className="col-span-2 bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2.5 border border-red-200">
                  {error}
                </div>
              )}
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-xl border border-[#d3d1c7] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e8e6df] bg-[#fafaf8]">
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#888780] px-4 py-3">
                  User
                </th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#888780] px-4 py-3">
                  Role
                </th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#888780] px-4 py-3">
                  Workspaces
                </th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#888780] px-4 py-3">
                  Status
                </th>
                <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-[#888780] px-4 py-3">
                  Created
                </th>
                <th className="text-right text-[10px] font-semibold uppercase tracking-wider text-[#888780] px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-[#f1efe8] last:border-0 hover:bg-[#fafaf8] transition"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#3266ad] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {getInitials(u.fullName)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[#1a1a18]">
                          {u.fullName}
                        </div>
                        <div className="text-[10px] text-[#888780]">
                          {u.username} &middot; {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {roleIcon(u.role)}
                      <span className="text-xs text-[#5f5e5a] capitalize">
                        {u.role}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {u.workspaceAccess.map((wa) => (
                        <span
                          key={wa.workspace.slug}
                          className="text-[10px] bg-[#f0f4ff] text-[#3266ad] px-1.5 py-0.5 rounded font-medium"
                        >
                          {wa.workspace.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        u.active
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {u.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#888780]">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditingUser(u);
                          setEditForm({
                            fullName: u.fullName,
                            email: u.email,
                            role: u.role,
                            password: "",
                          });
                        }}
                        className="p-1.5 rounded-lg hover:bg-[#f5f4f0] transition"
                        title="Edit user"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#888780]" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(u.id, u.active)}
                        className={`p-1.5 rounded-lg transition ${
                          u.active ? "hover:bg-red-50" : "hover:bg-green-50"
                        }`}
                        title={u.active ? "Deactivate user" : "Activate user"}
                      >
                        {u.active ? (
                          <Ban className="w-3.5 h-3.5 text-[#b4b2a9] hover:text-red-500" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#b4b2a9] hover:text-green-600" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-[#f0f4ff] rounded-xl border border-[#B5D4F4] p-4">
          <h3 className="text-xs font-semibold text-[#0C447C] mb-2">
            Adding Users via Config
          </h3>
          <p className="text-xs text-[#5f5e5a] leading-relaxed">
            Users can also be added by editing{" "}
            <code className="bg-white px-1 py-0.5 rounded border border-[#d3d1c7] font-mono text-[10px]">
              src/config/users.ts
            </code>{" "}
            and running{" "}
            <code className="bg-white px-1 py-0.5 rounded border border-[#d3d1c7] font-mono text-[10px]">
              npm run db:seed
            </code>
            . Passwords are hashed with bcrypt during the seed process.
          </p>
        </div>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setEditingUser(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-[#e8e6df] flex items-center justify-between">
              <h3 className="text-base font-medium text-[#1a1a18]">
                Edit {editingUser.fullName}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded hover:bg-[#f5f4f0]"
              >
                <X className="w-4 h-4 text-[#888780]" />
              </button>
            </div>
            <form onSubmit={handleEditUser} className="px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#5f5e5a] mb-1">Full Name</label>
                <input
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f5e5a] mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f5e5a] mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5f5e5a] mb-1">
                  New Password <span className="text-[#b4b2a9] font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
                />
              </div>
              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2 border border-red-200">
                  {error}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm text-[#5f5e5a] hover:text-[#1a1a18]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a18] text-white text-sm rounded-lg hover:bg-[#2a2a28] disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
