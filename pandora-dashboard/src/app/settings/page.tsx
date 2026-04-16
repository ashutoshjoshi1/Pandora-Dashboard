"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/layout/AppHeader";
import {
  Settings,
  User,
  Lock,
  Save,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ fullName: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.success) {
          router.push("/login");
          return;
        }
        setUser(data.data);
        setProfileForm({ fullName: data.data.fullName, email: data.data.email });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profileForm.fullName,
          email: profileForm.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg({ type: "success", text: "Profile updated" });
        setUser({ ...user, fullName: profileForm.fullName, email: profileForm.email });
        router.refresh();
      } else {
        setProfileMsg({ type: "error", text: data.error || "Failed to update profile" });
      }
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordMsg({ type: "success", text: "Password changed successfully" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordMsg({ type: "error", text: data.error || "Failed to change password" });
      }
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#888780]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4f0]">
      <AppHeader
        user={user}
        breadcrumbs={[{ label: "Settings" }]}
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#f0f4ff] text-[#3266ad] flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-medium text-[#1a1a18]">Settings</h1>
            <p className="text-xs text-[#888780]">Manage your account</p>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-xl border border-[#d3d1c7] p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#888780]" />
            <h2 className="text-sm font-medium text-[#1a1a18]">Profile</h2>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#5f5e5a] mb-1">Username</label>
              <input
                value={user.username}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-[#e8e6df] text-sm text-[#888780] bg-[#fafaf8] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5f5e5a] mb-1">Full Name</label>
              <input
                value={profileForm.fullName}
                onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5f5e5a] mb-1">Email</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5f5e5a] mb-1">Role</label>
              <input
                value={user.role}
                disabled
                className="w-full px-3 py-2 rounded-lg border border-[#e8e6df] text-sm text-[#888780] bg-[#fafaf8] cursor-not-allowed capitalize"
              />
            </div>
            {profileMsg && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                profileMsg.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {profileMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {profileMsg.text}
              </div>
            )}
            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a18] text-white text-sm rounded-lg hover:bg-[#2a2a28] disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Profile
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-xl border border-[#d3d1c7] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-4 h-4 text-[#888780]" />
            <h2 className="text-sm font-medium text-[#1a1a18]">Change Password</h2>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#5f5e5a] mb-1">Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5f5e5a] mb-1">New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
                minLength={6}
                className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#5f5e5a] mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-[#d3d1c7] text-sm focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad]"
              />
            </div>
            {passwordMsg && (
              <div className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                passwordMsg.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}>
                {passwordMsg.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {passwordMsg.text}
              </div>
            )}
            <button
              type="submit"
              disabled={savingPassword}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a18] text-white text-sm rounded-lg hover:bg-[#2a2a28] disabled:opacity-50"
            >
              {savingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
              Change Password
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
