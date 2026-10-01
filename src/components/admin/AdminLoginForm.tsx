import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

type Props = {
  redirectTo?: string;
  showBackLink?: boolean;
};

export function AdminLoginForm({ redirectTo = "/admin", showBackLink = true }: Props) {
  const { signIn, user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    navigate({ to: isAdmin ? redirectTo : "/", replace: true });
  }, [user, loading, isAdmin, navigate, redirectTo]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const r = await signIn(email, password, remember);
    setBusy(false);
    if (r.error) setErr(r.error);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      {showBackLink && (
        <Link to="/" className="eyebrow mb-4">
          ← Back to Entertainment Trends
        </Link>
      )}
      <div className="border-t-4 border-yellow bg-surface p-6">
        <h1 className="display text-3xl font-black uppercase">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to access the admin dashboard.</p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Username / Email"
            className="w-full border border-border bg-background px-3 py-2 outline-none focus:border-yellow"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border border-border bg-background px-3 py-2 outline-none focus:border-yellow"
          />
          <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 accent-yellow"
            />
            <span className="text-muted-foreground">Keep me signed in</span>
          </label>
          {err && <div className="border border-yellow bg-yellow/10 px-3 py-2 text-xs text-yellow">{err}</div>}
          <button
            disabled={busy}
            className="yellow-bar w-full py-2.5 font-black uppercase tracking-widest disabled:opacity-60"
          >
            {busy ? "Please wait…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
