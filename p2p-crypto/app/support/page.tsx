import type { Metadata } from "next";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";

export const metadata: Metadata = {
  title: "Support | NexaX Exchange",
  description: "Priority support channels, FAQ, and ticket management for account, trading, and P2P disputes.",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6">
        <div className="mx-auto max-w-7xl">
          <div className="surface grid gap-6 rounded-3xl px-6 py-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Support
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Resolve issues fast with priority help channels.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[var(--muted)]">
              Search FAQs, submit tickets, or escalate a P2P dispute with a
              dedicated resolution flow.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="btn btn-primary" href="/login">
                Open support ticket
              </a>
              <a className="btn btn-ghost" href="/security">
                Security center
              </a>
            </div>
          </div>
          <div className="panel rounded-2xl p-5">
            <p className="text-sm font-semibold">Support options</p>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                "Live chat",
                "Ticket queue",
                "P2P dispute desk",
                "Security incident help",
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

      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="panel rounded-2xl p-6">
            <p className="text-sm font-semibold">Knowledge base</p>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                "Account access and verification",
                "Deposits and withdrawals",
                "Trading rules and fees",
                "P2P disputes and chargebacks",
                "Security and device approvals",
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

          <div className="panel rounded-2xl p-6">
            <p className="text-sm font-semibold">Response SLAs</p>
            <div className="mt-4 grid gap-2 text-xs text-[var(--muted)]">
              {[
                { label: "Security incident", value: "30 min" },
                { label: "P2P dispute", value: "2 hrs" },
                { label: "Account access", value: "4 hrs" },
                { label: "General ticket", value: "12 hrs" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2"
                >
                  <span>{row.label}</span>
                  <span className="text-[var(--text)]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="panel rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Create a support ticket</p>
              <p className="text-xs text-[var(--muted)]">
                Provide details for faster resolution
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="grid gap-2">
              <label className="input-label" htmlFor="support-topic">
                Topic
              </label>
              <input id="support-topic" className="input" placeholder="P2P dispute" />
            </div>
            <div className="grid gap-2">
              <label className="input-label" htmlFor="support-email">
                Email
              </label>
              <input id="support-email" className="input" placeholder="you@domain.com" />
            </div>
            <div className="grid gap-2 lg:col-span-2">
              <label className="input-label" htmlFor="support-message">
                Message
              </label>
              <textarea
                id="support-message"
                className="input min-h-[120px]"
                placeholder="Describe the issue and include relevant order IDs."
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className="btn btn-primary" type="button">
              Submit ticket
            </button>
            <p className="text-xs text-[var(--muted)]">
              Ticket creation requires login.
            </p>
          </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
