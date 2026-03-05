"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Image from "next/image";

interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  isAdmin: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [nameForm, setNameForm] = useState({ name: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", password: "", confirm: "" });
  const [nameMsg, setNameMsg] = useState({ type: "", text: "" });
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });
  const [avatarMsg, setAvatarMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((r) => r.json())
      .then((d) => {
        setProfile(d);
        setNameForm({ name: d.name ?? "" });
      });
  }, []);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg({ type: "", text: "" });
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameForm.name }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile((p) => p ? { ...p, name: data.name } : p);
      setNameMsg({ type: "success", text: "Name updated!" });
      await updateSession();
    } else {
      const data = await res.json();
      setNameMsg({ type: "danger", text: data.error ?? "Failed to update name" });
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (pwForm.password !== pwForm.confirm) {
      setPwMsg({ type: "danger", text: "Passwords do not match" });
      return;
    }
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwForm.currentPassword, password: pwForm.password }),
    });
    if (res.ok) {
      setPwMsg({ type: "success", text: "Password changed!" });
      setPwForm({ currentPassword: "", password: "", confirm: "" });
    } else {
      const data = await res.json();
      setPwMsg({ type: "danger", text: data.error ?? "Failed to change password" });
    }
  }

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setAvatarMsg({ type: "", text: "" });
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/users/me/avatar", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setProfile((p) => p ? { ...p, image: data.url } : p);
      setAvatarMsg({ type: "success", text: "Avatar updated!" });
      await updateSession();
    } else {
      const data = await res.json();
      setAvatarMsg({ type: "danger", text: data.error ?? "Upload failed" });
    }
    setLoading(false);
  }

  async function removeAvatar() {
    if (!confirm("Remove avatar?")) return;
    const res = await fetch("/api/users/me/avatar", { method: "DELETE" });
    if (res.ok) {
      setProfile((p) => p ? { ...p, image: null } : p);
      setAvatarMsg({ type: "success", text: "Avatar removed." });
      await updateSession();
    }
  }

  return (
    <>
      <Navbar />
      <div className="container py-4" style={{ maxWidth: 640 }}>
        <h1 className="h3 mb-4">Profile</h1>

        {/* Avatar section */}
        <div className="card mb-4">
          <div className="card-header">Profile Picture</div>
          <div className="card-body d-flex align-items-center gap-4">
            {profile?.image ? (
              <Image
                src={profile.image}
                alt="Avatar"
                width={80}
                height={80}
                className="rounded-circle"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <div
                className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                style={{ width: 80, height: 80, fontSize: 32 }}
              >
                {(profile?.name ?? profile?.email ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              {avatarMsg.text && (
                <div className={`alert alert-${avatarMsg.type} py-1 mb-2`}>{avatarMsg.text}</div>
              )}
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  {loading ? "Uploading…" : "Change Avatar"}
                </button>
                {profile?.image && (
                  <button className="btn btn-sm btn-outline-danger" onClick={removeAvatar}>
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="d-none"
                onChange={uploadAvatar}
              />
              <small className="text-muted d-block mt-1">JPEG, PNG, WebP or GIF. Max 5MB.</small>
            </div>
          </div>
        </div>

        {/* Account info */}
        <div className="card mb-4">
          <div className="card-header">Account Info</div>
          <div className="card-body">
            <dl className="row mb-0">
              <dt className="col-sm-4">Email</dt>
              <dd className="col-sm-8">{profile?.email}</dd>
              <dt className="col-sm-4">Role</dt>
              <dd className="col-sm-8">{profile?.isAdmin ? "Admin" : "Volunteer"}</dd>
              <dt className="col-sm-4">Member since</dt>
              <dd className="col-sm-8">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
              </dd>
            </dl>
          </div>
        </div>

        {/* Display name */}
        <div className="card mb-4">
          <div className="card-header">Display Name</div>
          <div className="card-body">
            {nameMsg.text && (
              <div className={`alert alert-${nameMsg.type}`}>{nameMsg.text}</div>
            )}
            <form onSubmit={saveName} className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                value={nameForm.name}
                onChange={(e) => setNameForm({ name: e.target.value })}
                maxLength={100}
                required
              />
              <button type="submit" className="btn btn-primary flex-shrink-0">
                Save
              </button>
            </form>
          </div>
        </div>

        {/* Change password */}
        <div className="card mb-4">
          <div className="card-header">Change Password</div>
          <div className="card-body">
            {pwMsg.text && (
              <div className={`alert alert-${pwMsg.type}`}>{pwMsg.text}</div>
            )}
            <form onSubmit={savePassword}>
              <div className="mb-3">
                <label className="form-label" htmlFor="currentPw">
                  Current Password
                </label>
                <input
                  id="currentPw"
                  type="password"
                  className="form-control"
                  value={pwForm.currentPassword}
                  onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="newPw">
                  New Password
                </label>
                <input
                  id="newPw"
                  type="password"
                  className="form-control"
                  value={pwForm.password}
                  onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="confirmPw">
                  Confirm New Password
                </label>
                <input
                  id="confirmPw"
                  type="password"
                  className="form-control"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>
              <button type="submit" className="btn btn-warning">
                Change Password
              </button>
            </form>
          </div>
        </div>

        {/* Export data */}
        <div className="card">
          <div className="card-header">Export My Data</div>
          <div className="card-body d-flex gap-2">
            <a
              href="/api/export?format=csv"
              className="btn btn-outline-success"
              download
            >
              Export CSV
            </a>
            <a href="/api/export?format=json" className="btn btn-outline-info" download>
              Export JSON
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
