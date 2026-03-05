import type { Metadata } from "next";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";

export const metadata: Metadata = {
  title: "Terms of Service | NexaX Exchange",
  description: "Rules for safe and fair trading on NexaX Exchange.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6">
        <div className="mx-auto max-w-5xl">
          <div className="surface rounded-3xl px-6 py-8">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Terms of service
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Clear rules for safe and fair trading.
          </h1>
          <p className="mt-2 text-xs text-[var(--muted)]">Last updated: Mar 1, 2026</p>

          <div className="mt-6 grid gap-5 text-sm text-[var(--muted)]">
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--text)]">Eligibility</p>
              <p className="mt-2">
                Users must meet local regulatory requirements and complete
                identity verification where required.
              </p>
            </div>
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--text)]">
                Trading risks
              </p>
              <p className="mt-2">
                Digital asset prices are volatile. You are responsible for all
                trading decisions and for maintaining appropriate risk limits.
              </p>
            </div>
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--text)]">
                Platform integrity
              </p>
              <p className="mt-2">
                Abuse, market manipulation, or circumvention of controls may
                result in account restrictions or termination.
              </p>
            </div>
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--text)]">
                Fees and settlements
              </p>
              <p className="mt-2">
                Fees are published on the Fees page and may change with notice.
                P2P settlements follow the selected payment method terms.
              </p>
            </div>
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--text)]">Support</p>
              <p className="mt-2">
                For disputes or account issues, use the Support page to open a
                ticket.
              </p>
            </div>
          </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
