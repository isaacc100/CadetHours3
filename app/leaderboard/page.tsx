"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import Image from "next/image";

interface LeaderboardEntry {
  rank: number;
  user: { id: string; name?: string | null; email: string; image?: string | null };
  hours: number;
  activityHours: number;
  travelHours: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  myRank: LeaderboardEntry | null;
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [period, setPeriod] = useState("all");
  const [includeTravel, setIncludeTravel] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?period=${period}&includeTravel=${includeTravel}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [period, includeTravel]);

  const medalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <>
      <Navbar />
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h3">Leaderboard</h1>
          <div className="d-flex gap-2 align-items-center flex-wrap">
            <select
              className="form-select form-select-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              style={{ width: "auto" }}
            >
              <option value="all">All Time</option>
              <option value="year">This Year</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
            <div className="form-check mb-0">
              <input
                id="includeTravel"
                className="form-check-input"
                type="checkbox"
                checked={includeTravel}
                onChange={(e) => setIncludeTravel(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="includeTravel">
                Include travel
              </label>
            </div>
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
            {data?.leaderboard.length === 0 ? (
              <div className="text-center text-muted py-5">
                No entries for this period yet.
              </div>
            ) : (
              <div className="card">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Volunteer</th>
                          <th>Hours</th>
                          {includeTravel && <th>Activity / Travel</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {data?.leaderboard.map((entry) => (
                          <tr
                            key={entry.user.id}
                            className={entry.user.id === session?.user?.id ? "table-primary" : ""}
                          >
                            <td>
                              <span className="fw-bold">{medalEmoji(entry.rank)}</span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                {entry.user.image ? (
                                  <Image
                                    src={entry.user.image}
                                    alt=""
                                    width={32}
                                    height={32}
                                    className="rounded-circle"
                                    style={{ objectFit: "cover" }}
                                  />
                                ) : (
                                  <div
                                    className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                                    style={{ width: 32, height: 32, fontSize: 14 }}
                                  >
                                    {(entry.user.name ?? entry.user.email)[0].toUpperCase()}
                                  </div>
                                )}
                                <span>
                                  {entry.user.name ?? entry.user.email}
                                  {entry.user.id === session?.user?.id && (
                                    <span className="badge bg-primary ms-1">You</span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td>
                              <strong>{entry.hours.toFixed(1)}h</strong>
                            </td>
                            {includeTravel && (
                              <td className="text-muted small">
                                {entry.activityHours.toFixed(1)}h /{" "}
                                {entry.travelHours.toFixed(1)}h
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Show current user rank if not in top list */}
            {data?.myRank && (
              <div className="card mt-3 border-primary">
                <div className="card-header bg-primary text-white">Your Rank</div>
                <div className="card-body">
                  <div className="d-flex align-items-center gap-3">
                    <span className="h4 mb-0">#{data.myRank.rank}</span>
                    <div>
                      <strong>{data.myRank.hours.toFixed(1)}h</strong> total •{" "}
                      {data.myRank.activityHours.toFixed(1)}h activity •{" "}
                      {data.myRank.travelHours.toFixed(1)}h travel
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
