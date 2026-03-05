"use client";
import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  isAdmin: boolean;
  active: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [newRole, setNewRoleName] = useState("");
  const [roleMsg, setRoleMsg] = useState({ type: "", text: "" });

  function fetchUsers() {
    setLoading(true);
    fetch(`/api/admin/users?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function toggleActive(user: User) {
    setMsg({ type: "", text: "" });
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    if (res.ok) {
      setMsg({ type: "success", text: `User ${user.active ? "deactivated" : "activated"}.` });
      fetchUsers();
    } else {
      setMsg({ type: "danger", text: "Failed to update user." });
    }
  }

  async function toggleAdmin(user: User) {
    setMsg({ type: "", text: "" });
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !user.isAdmin }),
    });
    if (res.ok) {
      setMsg({ type: "success", text: `Admin status updated.` });
      fetchUsers();
    } else {
      setMsg({ type: "danger", text: "Failed to update admin status." });
    }
  }

  async function createRole(e: React.FormEvent) {
    e.preventDefault();
    setRoleMsg({ type: "", text: "" });
    const res = await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRole }),
    });
    if (res.ok) {
      setRoleMsg({ type: "success", text: `Role "${newRole}" created.` });
      setNewRoleName("");
    } else {
      const data = await res.json();
      setRoleMsg({ type: "danger", text: data.error ?? "Failed to create role." });
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h1 className="h3 mb-4">User Management</h1>

        {msg.text && <div className={`alert alert-${msg.type} alert-dismissible`}>{msg.text}</div>}

        <div className="card mb-4">
          <div className="card-header">Create Role</div>
          <div className="card-body">
            {roleMsg.text && (
              <div className={`alert alert-${roleMsg.type}`}>{roleMsg.text}</div>
            )}
            <form onSubmit={createRole} className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Role name"
                value={newRole}
                onChange={(e) => setNewRoleName(e.target.value)}
                required
                maxLength={100}
              />
              <button type="submit" className="btn btn-primary flex-shrink-0">
                Create
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">Users ({total})</div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading…</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Admin</th>
                      <th>Active</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className={!user.active ? "opacity-50" : ""}>
                        <td>{user.email}</td>
                        <td>{user.name ?? "—"}</td>
                        <td>
                          {user.isAdmin ? (
                            <span className="badge bg-danger">Admin</span>
                          ) : (
                            <span className="badge bg-secondary">User</span>
                          )}
                        </td>
                        <td>
                          {user.active ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-warning text-dark">Inactive</span>
                          )}
                        </td>
                        <td className="text-muted small">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${user.active ? "btn-outline-warning" : "btn-outline-success"} me-1`}
                            onClick={() => toggleActive(user)}
                          >
                            {user.active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            className={`btn btn-sm ${user.isAdmin ? "btn-outline-secondary" : "btn-outline-danger"}`}
                            onClick={() => toggleAdmin(user)}
                          >
                            {user.isAdmin ? "Remove Admin" : "Make Admin"}
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
