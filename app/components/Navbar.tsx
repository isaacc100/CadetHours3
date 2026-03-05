"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" href="/">
          CadetHours3
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMenu"
          aria-controls="navMenu"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navMenu">
          <ul className="navbar-nav me-auto">
            {session && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" href="/dashboard">
                    Dashboard
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" href="/log">
                    Log Hours
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" href="/leaderboard">
                    Leaderboard
                  </Link>
                </li>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(session.user as any)?.isAdmin && (
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      Admin
                    </a>
                    <ul className="dropdown-menu">
                      <li>
                        <Link className="dropdown-item" href="/admin">
                          Dashboard
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" href="/admin/users">
                          Users
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" href="/admin/settings">
                          Settings
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" href="/admin/audit-logs">
                          Audit Logs
                        </Link>
                      </li>
                    </ul>
                  </li>
                )}
              </>
            )}
          </ul>
          <ul className="navbar-nav">
            {session ? (
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {session.user?.name ?? session.user?.email}
                </a>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" href="/profile">
                      Profile
                    </Link>
                  </li>
                  <li>
                    <button
                      className="dropdown-item"
                      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    >
                      Sign Out
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <li className="nav-item">
                <Link className="nav-link" href="/auth/signin">
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
