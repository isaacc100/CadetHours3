"use client";
import { useEffect, useState } from "react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Link from "next/link";

interface AdminStats {
  userCount: number;
  totalActivityHours: number;
  totalTravelHours: number;
  totalHours: number;
  recentLogs: {
    id: string;
    action: string;
    createdAt: string;
    details?: string | null;
    user?: { email: string; name?: string | null } | null;
  }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats(d);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h1 className="h3 mb-4">Admin Dashboard</h1>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        ) : (
          <>
            <div className="row g-3 mb-4">
              <div className="col-sm-6 col-lg-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <div className="display-6 fw-bold text-primary">{stats?.userCount}</div>
                    <div className="text-muted">Active Users</div>
                  </div>
                </div>
              </div>
              <div className="col-sm-6 col-lg-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <div className="display-6 fw-bold text-success">
                      {stats?.totalHours.toFixed(1)}
                    </div>
                    <div className="text-muted">Total Hours (All)</div>
                  </div>
                </div>
              </div>
              <div className="col-sm-6 col-lg-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <div className="display-6 fw-bold text-info">
                      {stats?.totalActivityHours.toFixed(1)}
                    </div>
                    <div className="text-muted">Activity Hours</div>
                  </div>
                </div>
              </div>
              <div className="col-sm-6 col-lg-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <div className="display-6 fw-bold text-warning">
                      {stats?.totalTravelHours.toFixed(1)}
                    </div>
                    <div className="text-muted">Travel Hours</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <Link href="/admin/users" className="card text-decoration-none h-100">
                  <div className="card-body text-center">
                    <div className="h4 mb-1">👥</div>
                    <strong>Manage Users</strong>
                  </div>
                </Link>
              </div>
              <div className="col-md-3">
                <Link href="/admin/settings" className="card text-decoration-none h-100">
                  <div className="card-body text-center">
                    <div className="h4 mb-1">⚙️</div>
                    <strong>Settings</strong>
                  </div>
                </Link>
              </div>
              <div className="col-md-3">
                <Link href="/admin/audit-logs" className="card text-decoration-none h-100">
                  <div className="card-body text-center">
                    <div className="h4 mb-1">📋</div>
                    <strong>Audit Logs</strong>
                  </div>
                </Link>
              </div>
              <div className="col-md-3">
                <Link href="/leaderboard" className="card text-decoration-none h-100">
                  <div className="card-body text-center">
                    <div className="h4 mb-1">🏆</div>
                    <strong>Leaderboard</strong>
                  </div>
                </Link>
              </div>
            </div>

            <div className="card">
              <div className="card-header">Recent Activity</div>
              <div className="card-body p-0">
                {stats?.recentLogs.length === 0 ? (
                  <div className="text-center text-muted py-4">No activity yet.</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm mb-0">
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>User</th>
                          <th>Action</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.recentLogs.map((log) => (
                          <tr key={log.id}>
                            <td className="text-muted small text-nowrap">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="small">
                              {log.user?.name ?? log.user?.email ?? "—"}
                            </td>
                            <td>
                              <code className="small">{log.action}</code>
                            </td>
                            <td className="text-muted small" style={{ maxWidth: 200 }}>
                              <span className="text-truncate d-block">{log.details ?? "—"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="card-footer">
                <Link href="/admin/audit-logs" className="btn btn-sm btn-outline-secondary">
                  View all logs →
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
