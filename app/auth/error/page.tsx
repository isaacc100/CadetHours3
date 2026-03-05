"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const messages: Record<string, string> = {
  Configuration: "Server configuration error.",
  AccessDenied: "Access denied.",
  Verification: "Verification failed.",
  Default: "An authentication error occurred.",
};

function AuthErrorContent() {
  const params = useSearchParams();
  const error = params.get("error") ?? "Default";
  const message = messages[error] ?? messages.Default;

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card p-4 text-center" style={{ maxWidth: 400 }}>
        <h2 className="text-danger mb-3">Authentication Error</h2>
        <p>{message}</p>
        <Link href="/auth/signin" className="btn btn-primary">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}
