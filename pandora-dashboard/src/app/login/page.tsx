"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/config/app";
import { CONTACT_EMAIL } from "@/config/users";
import { Lock, User, ArrowRight, Mail, FlaskConical } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f4f0] px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1a1a18] mb-4">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-medium text-[#1a1a18]">
            {APP_CONFIG.name}
          </h1>
          <p className="text-sm text-[#888780] mt-1">
            {APP_CONFIG.organization}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-[#d3d1c7] shadow-sm overflow-hidden">
          <div className="p-8">
            <h2 className="text-lg font-medium text-[#1a1a18] mb-1">
              Sign in
            </h2>
            <p className="text-sm text-[#888780] mb-6">
              Enter your credentials to access the dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-[#5f5e5a] mb-1.5"
                >
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b4b2a9]" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#d3d1c7] bg-white text-[#1a1a18] text-sm placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad] transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#5f5e5a] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b4b2a9]" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#d3d1c7] bg-white text-[#1a1a18] text-sm placeholder:text-[#b4b2a9] focus:outline-none focus:ring-2 focus:ring-[#3266ad]/20 focus:border-[#3266ad] transition"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-2.5 border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-[#1a1a18] text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-[#2a2a28] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="border-t border-[#e8e6df] bg-[#fafaf8] px-8 py-4">
            <button
              onClick={() => setShowAccessModal(true)}
              className="w-full flex items-center justify-center gap-2 text-sm text-[#5f5e5a] hover:text-[#1a1a18] transition"
            >
              <Mail className="w-4 h-4" />
              Request Access
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#b4b2a9] mt-6">
          Pandora Spectrometer System &middot; {APP_CONFIG.organization}
        </p>
      </div>

      {/* Access Request Modal */}
      {showAccessModal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAccessModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#d3d1c7] shadow-lg max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-[#1a1a18] mb-2">
              Request Access
            </h3>
            <p className="text-sm text-[#5f5e5a] mb-4 leading-relaxed">
              Access to the Pandora Dashboard is managed by your team
              administrator. To request credentials, please contact:
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Pandora Dashboard Access Request`}
              className="flex items-center gap-2 bg-[#f0f4ff] text-[#3266ad] rounded-lg px-4 py-3 text-sm font-medium hover:bg-[#e0e8ff] transition"
            >
              <Mail className="w-4 h-4" />
              {CONTACT_EMAIL}
            </a>
            <button
              onClick={() => setShowAccessModal(false)}
              className="w-full mt-4 text-sm text-[#888780] hover:text-[#1a1a18] transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
