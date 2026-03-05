"use client";
import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

interface Role {
  id: string;
  name: string;
}

interface Entry {
  id: string;
  date: string;
  activityHours: number;
  travelHours: number;
  totalHours: number;
  notes?: string;
  primaryRole?: { id: string; name: string } | null;
  secondaryRoles?: { role: { id: string; name: string } }[];
}

const emptyForm = {
  activityHours: "",
  travelHours: "",
  notes: "",
  primaryRoleId: "",
  secondaryRoleIds: [] as string[],
  date: new Date().toISOString().split("T")[0],
};

export default function LogPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/roles")
      .then((r) => r.json())
      .then(setRoles)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function fetchEntries() {
    fetch(`/api/entries?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries ?? []);
        setTotal(d.total ?? 0);
      });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const payload = {
      activityHours: parseFloat(form.activityHours),
      travelHours: parseFloat(form.travelHours || "0"),
      notes: form.notes || undefined,
      primaryRoleId: form.primaryRoleId || undefined,
      secondaryRoleIds: form.secondaryRoleIds,
      date: form.date,
    };

    const url = editingId ? `/api/entries/${editingId}` : "/api/entries";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSuccess(editingId ? "Entry updated!" : "Hours logged!");
      setForm(emptyForm);
      setEditingId(null);
      fetchEntries();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save entry");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    const res = await fetch(`/api/entries/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchEntries();
    }
  }

  function startEdit(entry: Entry) {
    setEditingId(entry.id);
    setForm({
      activityHours: String(entry.activityHours),
      travelHours: String(entry.travelHours),
      notes: entry.notes ?? "",
      primaryRoleId: entry.primaryRole?.id ?? "",
      secondaryRoleIds: entry.secondaryRoles?.map((sr) => sr.role.id) ?? [],
      date: entry.date.split("T")[0],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h1 className="h3 mb-4">{editingId ? "Edit Entry" : "Log Hours"}</h1>

        <div className="card mb-4">
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label" htmlFor="activityHours">
                    Activity Hours <span className="text-danger">*</span>
                  </label>
                  <input
                    id="activityHours"
                    type="number"
                    className="form-control"
                    min="0"
                    max="24"
                    step="0.25"
                    value={form.activityHours}
                    onChange={(e) => setForm({ ...form, activityHours: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="travelHours">
                    Travel Hours
                  </label>
                  <input
                    id="travelHours"
                    type="number"
                    className="form-control"
                    min="0"
                    max="24"
                    step="0.25"
                    value={form.travelHours}
                    onChange={(e) => setForm({ ...form, travelHours: e.target.value })}
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label" htmlFor="date">
                    Date
                  </label>
                  <input
                    id="date"
                    type="date"
                    className="form-control"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                {roles.length > 0 && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="primaryRole">
                        Primary Role
                      </label>
                      <select
                        id="primaryRole"
                        className="form-select"
                        value={form.primaryRoleId}
                        onChange={(e) => setForm({ ...form, primaryRoleId: e.target.value })}
                      >
                        <option value="">— Select —</option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label" htmlFor="secondaryRoles">
                        Secondary Roles
                      </label>
                      <select
                        id="secondaryRoles"
                        className="form-select"
                        multiple
                        value={form.secondaryRoleIds}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            secondaryRoleIds: Array.from(e.target.selectedOptions, (o) => o.value),
                          })
                        }
                        style={{ height: 90 }}
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div className="col-12">
                  <label className="form-label" htmlFor="notes">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    className="form-control"
                    rows={3}
                    maxLength={2000}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
                <div className="col-12 d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Saving…" : editingId ? "Update Entry" : "Log Hours"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingId(null);
                        setForm(emptyForm);
                        setError("");
                        setSuccess("");
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Entries table */}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span>My Entries ({total})</span>
            <a href="/api/export?format=csv" className="btn btn-outline-success btn-sm" download>
              Export CSV
            </a>
          </div>
          <div className="card-body p-0">
            {entries.length === 0 ? (
              <div className="text-center text-muted py-4">No entries yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Activity</th>
                      <th>Travel</th>
                      <th>Total</th>
                      <th>Role</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((e) => (
                      <tr key={e.id}>
                        <td>{new Date(e.date).toLocaleDateString()}</td>
                        <td>{e.activityHours}h</td>
                        <td>{e.travelHours}h</td>
                        <td>
                          <strong>{e.totalHours}h</strong>
                        </td>
                        <td>{e.primaryRole?.name ?? "—"}</td>
                        <td className="text-muted" style={{ maxWidth: 160 }}>
                          <span className="text-truncate d-block">{e.notes ?? "—"}</span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => startEdit(e)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(e.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="card-footer d-flex justify-content-between align-items-center">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <span className="text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
