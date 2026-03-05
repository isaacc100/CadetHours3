"use client";
import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

interface AuditLog {
  id: string;
  action: string;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  user?: { email: string; name?: string | null } | null;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/audit-logs?page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      });
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h1 className="h3 mb-4">Audit Logs ({total})</h1>

        <div className="card">
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading…</span>
                </div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center text-muted py-4">No logs found.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Details</th>
                      <th>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td className="text-muted small text-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="small">{log.user?.name ?? log.user?.email ?? "—"}</td>
                        <td>
                          <code className="small">{log.action}</code>
                        </td>
                        <td className="text-muted small" style={{ maxWidth: 300 }}>
                          <span className="text-truncate d-block">{log.details ?? "—"}</span>
                        </td>
                        <td className="text-muted small">{log.ipAddress ?? "—"}</td>
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
