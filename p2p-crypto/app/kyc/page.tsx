"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

type KycStatus = "not_started" | "pending" | "approved" | "rejected";

type KycFormState = {
  fullName: string;
  dob: string;
  pan: string;
  aadhaar: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  occupation: string;
  sourceOfFunds: string;
  selfieFile: File | null;
};

const STATUS_COPY: Record<KycStatus, { title: string; body: string }> = {
  not_started: {
    title: "KYC not started",
    body:
      "Complete your identity verification to unlock P2P trading and higher limits.",
  },
  pending: {
    title: "KYC in review",
    body:
      "Your submission is under review. We will notify you once it is approved.",
  },
  approved: {
    title: "KYC approved",
    body: "You can access P2P and all verified account features.",
  },
  rejected: {
    title: "KYC needs attention",
    body:
      "We could not verify your details. Please review the notes and resubmit.",
  },
};

export default function KycPage() {
  const supabase = getSupabaseBrowserClient();
  const [status, setStatus] = useState<KycStatus>("not_started");
  const [reviewNote, setReviewNote] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<KycFormState>({
    fullName: "",
    dob: "",
    pan: "",
    aadhaar: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    occupation: "",
    sourceOfFunds: "",
    selfieFile: null,
  });

  const loadKyc = useCallback(async () => {
    if (!supabase) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatus("not_started");
      setStatusMessage("Log in to start KYC.");
      return;
    }

    const [profileResult, kycResult] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("kyc_status")
        .eq("user_id", userData.user.id)
        .maybeSingle(),
      supabase
        .from("user_kyc")
        .select("status, review_note")
        .eq("user_id", userData.user.id)
        .maybeSingle(),
    ]);

    if (profileResult.error) {
      setStatusMessage(profileResult.error.message);
      return;
    }

    const resolvedStatus =
      (kycResult.data?.status as KycStatus | undefined) ??
      (profileResult.data?.kyc_status as KycStatus | undefined) ??
      "not_started";

    setStatus(resolvedStatus);
    setReviewNote(kycResult.data?.review_note ?? null);
  }, [supabase]);

  useEffect(() => {
    void loadKyc();
  }, [loadKyc]);

  const statusSummary = useMemo(() => STATUS_COPY[status], [status]);

  const updateField = (key: keyof KycFormState, value: string | File | null) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);

    if (!supabase) {
      setStatusMessage("Supabase is not configured yet.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setStatusMessage("Log in to submit KYC.");
      return;
    }

    if (!form.selfieFile) {
      setStatusMessage("Upload a live photo to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        user_id: userData.user.id,
        full_name: form.fullName,
        dob: form.dob,
        pan: form.pan.toUpperCase(),
        aadhaar: form.aadhaar,
        mobile: form.mobile,
        address: form.address,
        city: form.city,
        state: form.state,
        postal_code: form.postalCode,
        occupation: form.occupation,
        source_of_funds: form.sourceOfFunds,
        selfie_ref: form.selfieFile.name,
        status: "pending",
      };

      const [kycResult, profileResult] = await Promise.all([
        supabase.from("user_kyc").upsert(payload, { onConflict: "user_id" }),
        supabase
          .from("user_profiles")
          .upsert(
            { user_id: userData.user.id, kyc_status: "pending" },
            { onConflict: "user_id" },
          ),
      ]);

      if (kycResult.error) {
        setStatusMessage(kycResult.error.message);
        return;
      }

      if (profileResult.error) {
        setStatusMessage(profileResult.error.message);
        return;
      }

      setStatus("pending");
      setStatusMessage("KYC submitted. Verification is now in progress.");
      await loadKyc();
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : "KYC submission failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6 pt-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Account verification
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Complete your KYC to access P2P and higher limits.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
            We verify PAN, Aadhaar, and a live photo. Passports are not accepted
            for this flow.
          </p>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="panel rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">KYC status</p>
                <p className="mt-2 text-2xl font-semibold">
                  {statusSummary.title}
                </p>
                <p className="mt-3 text-sm text-[var(--muted)]">
                  {statusSummary.body}
                </p>
              </div>
              <div
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-wide ${
                  status === "approved"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : status === "pending"
                      ? "bg-amber-500/15 text-amber-200"
                      : status === "rejected"
                        ? "bg-rose-500/15 text-rose-300"
                        : "bg-slate-500/20 text-slate-200"
                }`}
              >
                {status.replace("_", " ")}
              </div>
            </div>

            {reviewNote ? (
              <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                <p className="text-xs uppercase tracking-[0.2em] text-rose-200">
                  Review note
                </p>
                <p className="mt-2 text-sm">{reviewNote}</p>
              </div>
            ) : null}

            {status !== "approved" ? (
              <div className="mt-4 rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--muted)]">
                <p>
                  P2P trading stays locked until your verification is approved.
                </p>
                <Link
                  className="mt-3 inline-flex text-sm font-semibold text-[var(--accent)]"
                  href="/p2p"
                >
                  Return to P2P
                </Link>
              </div>
            ) : null}

            {statusMessage ? (
              <p className="mt-4 text-sm text-amber-200">{statusMessage}</p>
            ) : null}
          </div>

          <div className="surface rounded-2xl p-6">
            <p className="text-sm font-semibold">Negative scenarios</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-xl border border-[var(--border)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Missing documents
                </p>
                <p className="mt-2 text-[var(--muted)]">
                  PAN or Aadhaar mismatch will pause verification until
                  corrected.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Blurry live photo
                </p>
                <p className="mt-2 text-[var(--muted)]">
                  Rejected selfies require a new upload with proper lighting.
                </p>
              </div>
              <div className="rounded-xl border border-[var(--border)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Name mismatch
                </p>
                <p className="mt-2 text-[var(--muted)]">
                  Ensure your legal name matches PAN and Aadhaar records.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          <div className="panel rounded-2xl p-6">
            <p className="text-sm font-semibold">Submit KYC details</p>
            <p className="mt-2 text-xs text-[var(--muted)]">
              Passports are not accepted for this region. Use PAN, Aadhaar, and
              a live photo.
            </p>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 lg:grid-cols-2">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Full name
                  <input
                    className="input mt-2 w-full"
                    required
                    value={form.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    placeholder="As per PAN/Aadhaar"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Date of birth
                  <input
                    className="input mt-2 w-full"
                    type="date"
                    required
                    value={form.dob}
                    onChange={(event) => updateField("dob", event.target.value)}
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  PAN
                  <input
                    className="input mt-2 w-full"
                    required
                    maxLength={10}
                    value={form.pan}
                    onChange={(event) => updateField("pan", event.target.value)}
                    placeholder="ABCDE1234F"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Aadhaar
                  <input
                    className="input mt-2 w-full"
                    required
                    maxLength={12}
                    value={form.aadhaar}
                    onChange={(event) => updateField("aadhaar", event.target.value)}
                    placeholder="12-digit Aadhaar"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Mobile number
                  <input
                    className="input mt-2 w-full"
                    required
                    value={form.mobile}
                    onChange={(event) => updateField("mobile", event.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Address
                  <input
                    className="input mt-2 w-full"
                    required
                    value={form.address}
                    onChange={(event) => updateField("address", event.target.value)}
                    placeholder="House, street, locality"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  City
                  <input
                    className="input mt-2 w-full"
                    required
                    value={form.city}
                    onChange={(event) => updateField("city", event.target.value)}
                    placeholder="City"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  State
                  <input
                    className="input mt-2 w-full"
                    required
                    value={form.state}
                    onChange={(event) => updateField("state", event.target.value)}
                    placeholder="State"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Postal code
                  <input
                    className="input mt-2 w-full"
                    required
                    value={form.postalCode}
                    onChange={(event) => updateField("postalCode", event.target.value)}
                    placeholder="Postal code"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Occupation
                  <input
                    className="input mt-2 w-full"
                    required
                    value={form.occupation}
                    onChange={(event) => updateField("occupation", event.target.value)}
                    placeholder="Profession"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Source of funds
                  <input
                    className="input mt-2 w-full"
                    required
                    value={form.sourceOfFunds}
                    onChange={(event) =>
                      updateField("sourceOfFunds", event.target.value)
                    }
                    placeholder="Salary, business, savings"
                  />
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Live photo
                  <input
                    className="input mt-2 w-full"
                    type="file"
                    accept="image/*"
                    required
                    onChange={(event) =>
                      updateField("selfieFile", event.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">
                <p>
                  By submitting, you confirm the details are accurate and belong
                  to you.
                </p>
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Submit KYC"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
