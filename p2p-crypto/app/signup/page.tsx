"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { sendEmail } from "../../lib/emailjs/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setIsLoading(true);

    if (!supabase) {
      setStatus("Supabase is not configured yet.");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setStatus("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }

    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setStatus("Password must include at least one uppercase letter and one number.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setStatus(error.message);
      setIsLoading(false);
      return;
    }

    await sendEmail({
      templateKey: "welcome",
      templateParams: {
        to_email: email,
        user_email: email,
        action: "Welcome",
        from_name: "NexaX Exchange",
        timestamp: new Date().toISOString(),
      },
    });

    if (data.session) {
      router.push("/portfolio");
      return;
    }

    setStatus("Check your email to confirm the account and sign in.");
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6 pb-10">
        <div className="surface mx-auto grid max-w-5xl gap-6 rounded-3xl px-6 py-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Create account
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Build your trading profile in seconds.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[var(--muted)]">
              Email and password only. After registration, a default wallet is
              provisioned automatically for your account.
            </p>
            <div className="mt-5 grid gap-3 text-sm">
              {[
                "Default wallet address is created on signup.",
                "Transfers require device approval.",
                "Email confirmations keep access secure.",
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
              <p className="text-sm font-semibold">Account includes</p>
              <div className="mt-4 grid gap-3 text-sm">
                {[
                  "Unified spot wallet",
                  "Portfolio tracking",
                  "Risk limits",
                  "Security controls",
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

          <form className="panel rounded-2xl p-6" onSubmit={handleSignUp}>
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
                  autoComplete="new-password"
                  className="input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <p className="text-xs text-[var(--muted-2)]">
                  Min 8 characters, one uppercase letter, one number.
                </p>
              </div>
              {status ? (
                <p
                  className={`text-xs ${
                    status.includes("Check your email")
                      ? "text-[var(--accent)]"
                      : "text-[var(--danger)]"
                  }`}
                >
                  {status}
                </p>
              ) : null}
              <button className="btn btn-primary" type="submit" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </button>
              <div className="rounded-xl border border-[var(--border)] px-3 py-3 text-xs text-[var(--muted)]">
                By creating an account, you agree to our{" "}
                <a className="text-[var(--accent)]" href="/terms-of-service">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a className="text-[var(--accent)]" href="/privacy-policy">
                  Privacy Policy
                </a>.
              </div>
              <p className="text-xs text-[var(--muted)]">
                Already have an account?{" "}
                <a className="text-[var(--accent)]" href="/login">
                  Log in
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
