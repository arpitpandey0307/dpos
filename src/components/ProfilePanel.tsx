"use client";

import { useState, useEffect, useRef } from "react";
import { profileApi } from "@/lib/api-client";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Input";
import { X, Camera, User as UserIcon, Check } from "lucide-react";
import type { User } from "@/types";

interface ProfilePanelProps {
  open: boolean;
  onClose: () => void;
}

export function ProfilePanel({ open, onClose }: ProfilePanelProps) {
  const { user, setAuth } = useAuthStore();
  const [tab, setTab] = useState<"profile" | "password">("profile");
  const [profile, setProfile] = useState({ name: "", bio: "", profilePicture: "" });
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load profile data
  useEffect(() => {
    if (open && user) {
      setProfile({
        name: user.name || "",
        bio: user.bio || "",
        profilePicture: user.profilePicture || "",
      });
      setTab("profile");
      setMsg(null);
      setPasswords({ current: "", new: "", confirm: "" });
    }
  }, [open, user]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleSaveProfile = async () => {
    setMsg(null);
    if (!profile.name.trim()) { setMsg({ type: "err", text: "Name is required" }); return; }
    setLoading(true);
    try {
      const updated = await profileApi.update({
        name: profile.name.trim(),
        bio: profile.bio.trim(),
        profilePicture: profile.profilePicture,
      });
      // Update local auth store
      if (user) {
        setAuth({ ...user, name: updated.name, bio: updated.bio, profilePicture: updated.profilePicture }, useAuthStore.getState().token!);
      }
      setMsg({ type: "ok", text: "Profile updated!" });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setMsg(null);
    if (!passwords.current) { setMsg({ type: "err", text: "Enter current password" }); return; }
    if (passwords.new.length < 8) { setMsg({ type: "err", text: "Min 8 characters" }); return; }
    if (passwords.new !== passwords.confirm) { setMsg({ type: "err", text: "Passwords don't match" }); return; }
    setLoading(true);
    try {
      await profileApi.changePassword({ currentPassword: passwords.current, newPassword: passwords.new });
      setMsg({ type: "ok", text: "Password changed!" });
      setPasswords({ current: "", new: "", confirm: "" });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      setMsg({ type: "err", text: "Image must be under 500KB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((p) => ({ ...p, profilePicture: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const initials = (user?.name || "U").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-start sm:pl-56">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl sm:ml-4 sm:mb-4 shadow-2xl overflow-hidden animate-slide-up"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100">My Profile</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Avatar + Quick info */}
        <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-800/50">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-violet-600/20 border-2 border-violet-500/40 flex items-center justify-center overflow-hidden">
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-violet-300">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-violet-600 border-2 border-slate-900 flex items-center justify-center hover:bg-violet-500 transition-colors"
            >
              <Camera size={12} className="text-white" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-100 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          {(["profile", "password"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setMsg(null); }}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                tab === t
                  ? "text-violet-400 border-b-2 border-violet-500"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {t === "profile" ? "Edit Profile" : "Change Password"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[300px] overflow-y-auto flex flex-col gap-4">
          {tab === "profile" && (
            <>
              <Input
                label="Name"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
              />
              <Textarea
                label="Bio"
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Tell something about yourself..."
                rows={3}
              />
            </>
          )}
          {tab === "password" && (
            <>
              <PasswordInput
                label="Current Password"
                value={passwords.current}
                onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
                placeholder="Enter current password"
              />
              <PasswordInput
                label="New Password"
                value={passwords.new}
                onChange={(e) => setPasswords((p) => ({ ...p, new: e.target.value }))}
                placeholder="Min 8 characters"
              />
              <PasswordInput
                label="Confirm New Password"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Re-enter new password"
              />
            </>
          )}

          {msg && (
            <p className={`text-xs px-3 py-2 rounded-lg border ${
              msg.type === "ok"
                ? "text-green-400 bg-green-900/20 border-green-500/20"
                : "text-red-400 bg-red-900/20 border-red-500/20"
            }`}>
              {msg.text}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800">
          <Button
            onClick={tab === "profile" ? handleSaveProfile : handleChangePassword}
            loading={loading}
            className="w-full"
          >
            {tab === "profile" ? "Save Changes" : "Update Password"}
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.2s ease-out; }
      `}</style>
    </div>
  );
}
