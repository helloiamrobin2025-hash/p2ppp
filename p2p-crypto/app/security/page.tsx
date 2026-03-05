import type { Metadata } from "next";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";

export const metadata: Metadata = {
  title: "Security | NexaX Exchange",
  description: "Account protection with 2FA, device approvals, withdrawal allowlists, and session monitoring.",
};

const SECURITY_PRACTICES = [
  {
    title: "Two-factor authentication",
    copy: "Require app-based 2FA for all sign-ins and withdrawals.",
  },
  {
    title: "Device approvals",
    copy: "Approve new devices and revoke older sessions instantly.",
  },
  {
    title: "Withdrawal allowlist",
    copy: "Lock withdrawals to trusted addresses or bank accounts.",
  },
  {
    title: "Session monitoring",
    copy: "See active sessions, location history, and risk alerts.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6">
        <div className="mx-auto max-w-7xl">
          <div className="surface grid gap-6 rounded-3xl px-6 py-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Security
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Safe login defaults for every account.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[var(--muted)]">
              Security controls are built into onboarding and active sessions,
              with guardrails for withdrawals and P2P settlements.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="btn btn-primary" href="/login">
                Secure login
              </a>
              <a className="btn btn-ghost" href="/support">
                Report an issue
              </a>
            </div>
          </div>
          <div className="panel rounded-2xl p-5">
            <p className="text-sm font-semibold">Security status</p>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                { label: "Threat monitoring", value: "Active" },
                { label: "Withdrawals", value: "Allowlist enforced" },
                { label: "Session review", value: "Live" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2"
                >
                  <span>{row.label}</span>
                  <span className="text-[var(--accent)]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="panel rounded-2xl p-6">
            <p className="text-sm font-semibold">Account protection</p>
            <div className="mt-4 grid gap-3 text-sm">
              {SECURITY_PRACTICES.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-[var(--border)] px-3 py-3"
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="panel rounded-2xl p-6">
            <p className="text-sm font-semibold">Recommended setup</p>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                "Enable authenticator 2FA",
                "Approve primary device",
                "Set withdrawal allowlist",
                "Review session log weekly",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-[var(--border)] px-3 py-2"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--border)] px-3 py-3 text-xs text-[var(--muted)]">
              Security changes trigger email confirmation and device checks.
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="surface grid gap-6 rounded-3xl px-6 py-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Incident response
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Rapid response for account anomalies.
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Lock accounts, freeze withdrawals, and run device checks within
              minutes of a flagged event.
            </p>
          </div>
          <div className="panel rounded-2xl p-5">
            <p className="text-sm font-semibold">Response flow</p>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                "Auto-freeze on anomalous login",
                "Manual review within 30 minutes",
                "Customer verification check",
                "Secure recovery session",
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
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
