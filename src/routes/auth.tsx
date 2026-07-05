import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Entertainme" }, { name: "robots", content: "noindex" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setBusy(true);
    const r = mode === "signin"
      ? await signIn(email, password)
      : await signUp(email, password, name || undefined);
    setBusy(false);
    if (r.error) setErr(r.error);
    else if (mode === "signup") setErr("Check your email to confirm your account, then sign in.");
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <Link to="/" className="eyebrow mb-4">← Back to Entertainme</Link>
      <div className="border-t-4 border-yellow bg-surface p-6">
        <h1 className="display text-3xl font-black uppercase">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Welcome back to Entertainme." : "Join the conversation."}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name"
                   className="w-full border border-border bg-background px-3 py-2 outline-none focus:border-yellow" />
          )}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email"
                 className="w-full border border-border bg-background px-3 py-2 outline-none focus:border-yellow" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
                 className="w-full border border-border bg-background px-3 py-2 outline-none focus:border-yellow" />
          {err && <div className="border border-yellow bg-yellow/10 px-3 py-2 text-xs text-yellow">{err}</div>}
          <button disabled={busy} className="yellow-bar w-full py-2.5 font-black uppercase tracking-widest disabled:opacity-60">
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>
        <button
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setErr(null); }}
          className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-yellow">
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
