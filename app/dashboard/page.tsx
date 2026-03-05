"use client";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface Stats {
  totalActivityHours: number;
  totalTravelHours: number;
  totalHours: number;
  entryCount: number;
  roleBreakdown: { role: string; hours: number }[];
}

interface Entry {
  id: string;
  date: string;
  activityHours: number;
  travelHours: number;
  totalHours: number;
  notes?: string;
  primaryRole?: { name: string } | null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const dashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/entries?limit=5").then((r) => r.json()),
    ]).then(([statsData, entriesData]) => {
      setStats(statsData);
      setEntries(entriesData.entries ?? []);
      setLoading(false);
    });
  }, []);

  async function exportPDF() {
    if (!dashRef.current) return;
    const canvas = await html2canvas(dashRef.current, { scale: 1.5 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("dashboard.pdf");
  }

  const roleChartData = {
    labels: stats?.roleBreakdown.map((r) => r.role) ?? [],
    datasets: [
      {
        data: stats?.roleBreakdown.map((r) => r.hours) ?? [],
        backgroundColor: [
          "#0d6efd", "#6610f2", "#6f42c1", "#d63384", "#dc3545",
          "#fd7e14", "#ffc107", "#198754", "#20c997", "#0dcaf0",
        ],
      },
    ],
  };

  const recentBarData = {
    labels: entries.map((e) => new Date(e.date).toLocaleDateString()),
    datasets: [
      {
        label: "Activity Hours",
        data: entries.map((e) => e.activityHours),
        backgroundColor: "#0d6efd",
      },
      {
        label: "Travel Hours",
        data: entries.map((e) => e.travelHours),
        backgroundColor: "#6c757d",
      },
    ],
  };

  return (
    <>
      <Navbar />
      <div className="container py-4" ref={dashRef}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3">
            Welcome, {session?.user?.name ?? session?.user?.email}
          </h1>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={exportPDF}>
              Export PDF
            </button>
            <a
              href="/api/export?format=csv"
              className="btn btn-outline-success btn-sm"
              download
            >
              Export CSV
            </a>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading…</span>
            </div>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="row g-3 mb-4">
              <div className="col-sm-6 col-lg-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <div className="display-6 fw-bold text-primary">
                      {stats?.totalHours.toFixed(1)}
                    </div>
                    <div className="text-muted">Total Hours</div>
                  </div>
                </div>
              </div>
              <div className="col-sm-6 col-lg-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <div className="display-6 fw-bold text-success">
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
              <div className="col-sm-6 col-lg-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <div className="display-6 fw-bold text-info">
                      {stats?.entryCount}
                    </div>
                    <div className="text-muted">Entries</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="row g-3 mb-4">
              {stats && stats.roleBreakdown.length > 0 && (
                <div className="col-md-5">
                  <div className="card h-100">
                    <div className="card-header">Hours by Role</div>
                    <div className="card-body d-flex align-items-center justify-content-center">
                      <div style={{ maxWidth: 280, width: "100%" }}>
                        <Doughnut data={roleChartData} options={{ plugins: { legend: { position: "bottom" } } }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {entries.length > 0 && (
                <div className="col-md-7">
                  <div className="card h-100">
                    <div className="card-header">Recent Entries</div>
                    <div className="card-body">
                      <div className="chart-container">
                        <Bar
                          data={recentBarData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { position: "bottom" } },
                            scales: { x: { stacked: false }, y: { beginAtZero: true } },
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Recent entries table */}
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span>Recent Entries</span>
                <a href="/log" className="btn btn-primary btn-sm">
                  Log Hours
                </a>
              </div>
              <div className="card-body p-0">
                {entries.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    No entries yet. <a href="/log">Log your first hours!</a>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Activity Hrs</th>
                          <th>Travel Hrs</th>
                          <th>Total</th>
                          <th>Role</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((e) => (
                          <tr key={e.id}>
                            <td>{new Date(e.date).toLocaleDateString()}</td>
                            <td>{e.activityHours}</td>
                            <td>{e.travelHours}</td>
                            <td>
                              <strong>{e.totalHours}</strong>
                            </td>
                            <td>{e.primaryRole?.name ?? "—"}</td>
                            <td className="text-muted" style={{ maxWidth: 200 }}>
                              <span className="text-truncate d-block">{e.notes ?? "—"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
