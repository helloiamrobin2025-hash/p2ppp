import type { Metadata } from "next";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";

export const metadata: Metadata = {
  title: "Privacy Policy | NexaX Exchange",
  description: "How NexaX Exchange collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6">
        <div className="mx-auto max-w-5xl">
          <div className="surface rounded-3xl px-6 py-8">
          <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
            Privacy policy
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Your data is handled with strict access controls.
          </h1>
          <p className="mt-2 text-xs text-[var(--muted)]">Last updated: Mar 1, 2026</p>

          <div className="mt-6 grid gap-5 text-sm text-[var(--muted)]">
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--text)]">Scope</p>
              <p className="mt-2">
                This policy describes how NexaX Exchange collects, uses, and
                protects personal data when you use the platform and related
                services.
              </p>
            </div>
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--text)]">
                Data we collect
              </p>
              <p className="mt-2">
                Account identifiers, identity verification data where required,
                trading activity, device metadata, and security logs.
              </p>
            </div>
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--text)]">
                How we use data
              </p>
              <p className="mt-2">
                To operate the exchange, secure accounts, comply with legal
                obligations, and improve performance and risk monitoring.
              </p>
            </div>
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--text)]">
                Sharing and retention
              </p>
              <p className="mt-2">
                Data is shared with service providers under strict contracts and
                retained only as long as required for operations and compliance.
              </p>
            </div>
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold text-[var(--text)]">
                Your choices
              </p>
              <p className="mt-2">
                You can access, correct, or delete data where applicable. For
                requests, use the in-app Support page.
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
