"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type KycStatus = "not_started" | "pending" | "approved" | "rejected";

type ProfileRow = {
  kyc_status: KycStatus;
  account_status: string;
};

const STATUS_COPY: Record<KycStatus, string> = {
  not_started: "KYC not started",
  pending: "KYC in review",
  approved: "KYC approved",
  rejected: "KYC needs attention",
};

export default function AccountPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const loadProfile = async () => {
      setStatus("loading");
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setStatus("ready");
        return;
      }
      setEmail(userData.user.email ?? null);
      const { data } = await supabase
        .from("user_profiles")
        .select("kyc_status, account_status")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (!isMounted) return;
      setProfile((data ?? null) as ProfileRow | null);
      setStatus("ready");
    };

    void loadProfile();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const kycLabel = useMemo(() => {
    if (!profile?.kyc_status) return "KYC status unknown";
    return STATUS_COPY[profile.kyc_status] ?? "KYC status unknown";
  }, [profile]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6 pt-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Account center
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Manage profile access and verification.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
            Review KYC status, wallet access, and security actions.
          </p>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="panel rounded-2xl p-6">
            <p className="text-sm font-semibold">Profile snapshot</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-xl border border-[var(--border)] px-3 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Email
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {email ?? "Log in to view"}
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] px-3 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  KYC status
                </p>
                <p className="mt-2 text-sm font-semibold">{kycLabel}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] px-3 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Account state
                </p>
                <p className="mt-2 text-sm font-semibold">
                  {profile?.account_status ?? "Active"}
                </p>
              </div>
            </div>
          </div>

          <div className="surface rounded-2xl p-6">
            <p className="text-sm font-semibold">Quick actions</p>
            <div className="mt-4 grid gap-3 text-sm">
              <a className="btn btn-primary" href="/kyc">
                Continue KYC
              </a>
              <a className="btn btn-ghost" href="/portfolio">
                View wallets
              </a>
              <a className="btn btn-ghost" href="/support">
                Contact support
              </a>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </div>
            {status === "loading" ? (
              <p className="mt-4 text-xs text-[var(--muted)]">
                Loading profile...
              </p>
            ) : null}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
