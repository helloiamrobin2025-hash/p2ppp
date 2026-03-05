"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { sendEmail } from "../../lib/emailjs/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setIsLoading(true);

    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
      setIsLoading(false);
      return;
    }

    await sendEmail({
      templateKey: "login",
      templateParams: {
        to_email: email,
        user_email: email,
        action: "Login alert",
        from_name: "NexaX Exchange",
        timestamp: new Date().toISOString(),
      },
    });

    router.push(searchParams.get("redirect") || "/portfolio");
  };

  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6 pb-10">
        <div className="surface mx-auto grid max-w-5xl gap-6 rounded-3xl px-6 py-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Log in
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Access your trading workspace securely.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[var(--muted)]">
              Use your email and password to sign in. Security controls like
              2FA, device approvals, and withdrawal allowlists are available
              after login.
            </p>
            <div className="mt-5 grid gap-3 text-sm">
              {[
                "Session alerts are sent to your email.",
                "Withdrawals require device verification.",
                "Activity logs are retained for 90 days.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-[var(--border)] px-3 py-2"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="panel mt-6 rounded-2xl p-5">
              <p className="text-sm font-semibold">Security highlights</p>
              <div className="mt-4 grid gap-3 text-sm">
                {[
                  "Authenticator-based 2FA",
                  "New device approvals",
                  "Session risk alerts",
                  "Withdrawal allowlists",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-[var(--border)] px-3 py-2"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <form className="panel rounded-2xl p-6" onSubmit={handleSignIn}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label className="input-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <label className="input-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className="input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              {status ? (
                <p className="text-xs text-[var(--danger)]">{status}</p>
              ) : null}
              <button className="btn btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
              <div className="rounded-xl border border-[var(--border)] px-3 py-3 text-xs text-[var(--muted)]">
                By continuing, you agree to our{" "}
                <a className="text-[var(--accent)]" href="/terms-of-service">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a className="text-[var(--accent)]" href="/privacy-policy">
                  Privacy Policy
                </a>.
              </div>
              <p className="text-xs text-[var(--muted)]">
                New here?{" "}
                <a className="text-[var(--accent)]" href="/signup">
                  Create an account
                </a>
                .
              </p>
            </div>
          </form>
        </div>
      </section>
      <div className="mt-10">
        <SiteFooter />
      </div>
    </div>
  );
}
