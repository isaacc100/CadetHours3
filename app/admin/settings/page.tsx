"use client";
import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

interface Settings {
  leaderboardSize: number;
  footerText: string;
  allowNameChange: boolean;
  allowAvatarChange: boolean;
  allowPasswordChange: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState<Settings>({
    leaderboardSize: 10,
    footerText: "CadetHours3 © 2025",
    allowNameChange: true,
    allowAvatarChange: true,
    allowPasswordChange: true,
  });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d);
        setForm({
          leaderboardSize: d.leaderboardSize ?? 10,
          footerText: d.footerText ?? "CadetHours3 © 2025",
          allowNameChange: d.allowNameChange ?? true,
          allowAvatarChange: d.allowAvatarChange ?? true,
          allowPasswordChange: d.allowPasswordChange ?? true,
        });
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
      setMsg({ type: "success", text: "Settings saved!" });
    } else {
      const data = await res.json();
      setMsg({ type: "danger", text: data.error ?? "Failed to save settings." });
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container py-4 text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container py-4" style={{ maxWidth: 600 }}>
        <h1 className="h3 mb-4">Admin Settings</h1>

        {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

        <form onSubmit={handleSave}>
          <div className="card mb-3">
            <div className="card-header">Leaderboard</div>
            <div className="card-body">
              <label className="form-label" htmlFor="leaderboardSize">
                Leaderboard Size (top N users)
              </label>
              <input
                id="leaderboardSize"
                type="number"
                className="form-control"
                min={1}
                max={100}
                value={form.leaderboardSize}
                onChange={(e) => setForm({ ...form, leaderboardSize: parseInt(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="card mb-3">
            <div className="card-header">Appearance</div>
            <div className="card-body">
              <label className="form-label" htmlFor="footerText">
                Footer Text
              </label>
              <input
                id="footerText"
                type="text"
                className="form-control"
                maxLength={500}
                value={form.footerText}
                onChange={(e) => setForm({ ...form, footerText: e.target.value })}
              />
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">User Permissions</div>
            <div className="card-body">
              {(
                [
                  { key: "allowNameChange", label: "Allow users to change their display name" },
                  { key: "allowAvatarChange", label: "Allow users to change their avatar" },
                  { key: "allowPasswordChange", label: "Allow users to change their password" },
                ] as const
              ).map(({ key, label }) => (
                <div className="form-check mb-2" key={key}>
                  <input
                    id={key}
                    className="form-check-input"
                    type="checkbox"
                    checked={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor={key}>
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Save Settings
          </button>
        </form>

        {settings && (
          <div className="mt-3 text-muted small">
            Last updated: {new Date((settings as any).updatedAt ?? Date.now()).toLocaleString()}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
