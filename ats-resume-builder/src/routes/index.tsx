import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const BUILDER_URL = "https://ats-resume-builder-mocha.vercel.app/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ATS Resume Builder — Get past the filters" },
      { name: "description", content: "Create an account and build ATS-friendly resumes that recruiters actually see." },
      { property: "og:title", content: "ATS Resume Builder" },
      { property: "og:description", content: "Create an account and build ATS-friendly resumes that recruiters actually see." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          ATS<span className="text-accent">.</span>Resume
        </span>
        {user && (
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Sign out
          </button>
        )}
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 md:grid-cols-2 md:py-20">
        <div>
          <p className="mb-4 inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-wider text-secondary-foreground">
            Beat the applicant tracking system
          </p>
          <h1 className="text-5xl font-bold leading-tight md:text-6xl">
            Resumes that <em className="text-primary">get read</em>, not filtered.
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Clean, keyword-optimized resumes built for the software recruiters use. Sign up free and start building in minutes.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-card">
          {!ready ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : user ? (
            <Welcome user={user} />
          ) : (
            <AuthForm />
          )}
        </div>
      </section>
    </main>
  );
}

function Welcome({ user }: { user: User }) {
  const name = (user.user_metadata?.["full_name"] as string) || "there";
  return (
    <div>
      <h2 className="text-3xl font-bold">Welcome, {name}!</h2>
      <dl className="mt-6 space-y-3 text-sm">
        <div className="rounded-md bg-muted p-3">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="font-medium">{user.user_metadata?.["full_name"] || "—"}</dd>
        </div>
        <div className="rounded-md bg-muted p-3">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
      </dl>
      <a
        href={BUILDER_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 flex w-full items-center justify-center rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90"
      >
        Build my resume →
      </a>
    </div>
  );
}

function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      if (error) setErr(error.message);
      else if (!data.session) setMsg("Check your email to confirm your account, then log in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErr(error.message);
    }
    setBusy(false);
  }

  const input = "w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring";

  return (
    <form onSubmit={submit} className="space-y-4">
      <h2 className="text-3xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
      {mode === "signup" && (
        <input className={input} placeholder="Full name" required value={name} onChange={(e) => setName(e.target.value)} />
      )}
      <input className={input} type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className={input} type="password" placeholder="Password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
      {err && <p className="text-sm text-destructive">{err}</p>}
      {msg && <p className="text-sm text-primary">{msg}</p>}
      <button disabled={busy} className="w-full rounded-md bg-primary py-3 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
        {busy ? "Please wait…" : mode === "signup" ? "Sign up" : "Log in"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
        <button type="button" className="font-medium text-primary underline" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>
          {mode === "signup" ? "Log in" : "Create one"}
        </button>
      </p>
    </form>
  );
}
