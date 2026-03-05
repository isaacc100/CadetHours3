"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn, getProviders } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("error") ?? "");
  const [success, setSuccess] = useState(params.get("registered") === "1");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [providers, setProviders] = useState<Record<string, any>>({});

  useEffect(() => {
    getProviders().then((p) => setProviders(p ?? {}));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  const oauthProviders = Object.values(providers).filter((p) => p.type === "oauth");

  return (
    <div className="container d-flex justify-content-center align-items-center min-vh-100">
      <div className="card p-4 w-100" style={{ maxWidth: 400 }}>
        <h2 className="text-center mb-4">Sign In</h2>

        {success && (
          <div className="alert alert-success">
            Account created! You can now sign in.
          </div>
        )}
        {error && <div className="alert alert-danger">{error}</div>}

        {providers.credentials && (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        )}

        {oauthProviders.length > 0 && providers.credentials && <hr className="my-3" />}

        {oauthProviders.map((provider) => (
          <button
            key={provider.id}
            className="btn btn-outline-secondary w-100 mb-2"
            onClick={() => signIn(provider.id, { callbackUrl: "/dashboard" })}
          >
            Sign in with {provider.name}
          </button>
        ))}

        {oauthProviders.length === 0 && !providers.credentials && (
          <p className="text-muted text-center">SSO unavailable</p>
        )}

        {providers.credentials && (
          <p className="text-center mt-3">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register">Register</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
