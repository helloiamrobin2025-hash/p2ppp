"use client";

import { useEffect, useMemo, useState } from "react";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { formatDateTime } from "../../lib/format";

type AdminUserRow = {
  user_id: string;
  email: string | null;
  kyc_status: string;
  account_status: string;
  created_at: string;
};

type AdminKycRow = {
  id: string;
  user_id: string;
  full_name: string;
  dob: string;
  pan: string;
  aadhaar: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  occupation: string;
  source_of_funds: string;
  selfie_ref: string;
  status: string;
  review_note: string | null;
  created_at: string;
  updated_at: string;
};

type AdminDepositRow = {
  id: string;
  user_id: string;
  token: string;
  chain: string;
  amount: number;
  status: string;
  locked_until: string;
  created_at: string;
};

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "")
  .split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

export default function AdminPage() {
  const supabase = getSupabaseBrowserClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminStatus, setAdminStatus] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [deposits, setDeposits] = useState<AdminDepositRow[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [kycDetails, setKycDetails] = useState<AdminKycRow | null>(null);
  const [kycStatus, setKycStatus] = useState("pending");
  const [kycNote, setKycNote] = useState("");
  const [accountStatus, setAccountStatus] = useState("active");
  const [balanceToken, setBalanceToken] = useState("USDT");
  const [balanceChain, setBalanceChain] = useState("Ethereum");
  const [balanceAvailable, setBalanceAvailable] = useState("0");
  const [balanceLocked, setBalanceLocked] = useState("0");
  const [actionStatus, setActionStatus] = useState<string | null>(
    supabase ? null : "Supabase is not configured yet.",
  );

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;
    const loadAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email?.toLowerCase() ?? null;
      if (!email) {
        if (!isMounted) return;
        setAdminStatus("Log in with an admin account.");
        return;
      }

      if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(email)) {
        if (!isMounted) return;
        setAdminStatus("This account is not allowed to access admin.");
        return;
      }

      const { data: isAdminResult, error: isAdminError } = await supabase.rpc(
        "admin_is_admin",
      );

      if (!isMounted) return;
      if (isAdminError || !isAdminResult) {
        setAdminStatus(isAdminError?.message ?? "Not authorized as admin.");
        return;
      }

      setIsAdmin(true);
      setAdminStatus(null);

      const [{ data: userRows }, { data: depositRows }] = await Promise.all([
        supabase.rpc("admin_list_users"),
        supabase.rpc("admin_list_deposits"),
      ]);

      setUsers((userRows ?? []) as AdminUserRow[]);
      setDeposits((depositRows ?? []) as AdminDepositRow[]);
    };

    void loadAdmin();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !selectedUserId || !isAdmin) return;
    let isMounted = true;
    const loadKyc = async () => {
      const { data } = await supabase.rpc("admin_get_kyc", {
        target_user_id: selectedUserId,
      });
      if (!isMounted) return;
      const row = (data?.[0] ?? null) as AdminKycRow | null;
      setKycDetails(row);
      setKycStatus(row?.status ?? "pending");
      setKycNote(row?.review_note ?? "");
      const selectedUser = users.find((user) => user.user_id === selectedUserId);
      if (selectedUser) {
        setAccountStatus(selectedUser.account_status);
      }
    };

    void loadKyc();
    return () => {
      isMounted = false;
    };
  }, [supabase, selectedUserId, isAdmin, users]);

  const selectedUser = useMemo(
    () => users.find((user) => user.user_id === selectedUserId) ?? null,
    [users, selectedUserId],
  );

  const handleKycUpdate = async () => {
    if (!supabase || !selectedUserId) return;
    setActionStatus(null);
    const { error } = await supabase.rpc("admin_update_kyc", {
      target_user_id: selectedUserId,
      next_status: kycStatus,
      note: kycNote || null,
    });
    if (error) {
      setActionStatus(error.message);
      return;
    }
    setUsers((prev) =>
      prev.map((user) =>
        user.user_id === selectedUserId
          ? { ...user, kyc_status: kycStatus }
          : user,
      ),
    );
    setActionStatus("KYC status updated.");
  };

  const handleAccountStatus = async () => {
    if (!supabase || !selectedUserId) return;
    setActionStatus(null);
    const { error } = await supabase.rpc("admin_set_account_status", {
      target_user_id: selectedUserId,
      next_status: accountStatus,
    });
    if (error) {
      setActionStatus(error.message);
      return;
    }
    setUsers((prev) =>
      prev.map((user) =>
        user.user_id === selectedUserId
          ? { ...user, account_status: accountStatus }
          : user,
      ),
    );
    setActionStatus("Account status updated.");
  };

  const handleBalanceUpdate = async () => {
    if (!supabase || !selectedUserId) return;
    setActionStatus(null);
    const availableValue = Number.parseFloat(balanceAvailable || "0");
    const lockedValue = Number.parseFloat(balanceLocked || "0");
    if (Number.isNaN(availableValue) || Number.isNaN(lockedValue)) {
      setActionStatus("Enter valid numbers for balances.");
      return;
    }
    const { error } = await supabase.rpc("admin_set_balance", {
      target_user_id: selectedUserId,
      token_symbol: balanceToken,
      chain_name: balanceChain,
      available_amount: availableValue,
      locked_amount: lockedValue,
    });
    if (error) {
      setActionStatus(error.message);
      return;
    }
    setActionStatus("Balance updated.");
  };

  const handleDepositDecision = async (depositId: string, approve: boolean) => {
    if (!supabase) return;
    setActionStatus(null);
    const { error } = await supabase.rpc("admin_verify_deposit", {
      deposit_id: depositId,
      approve,
    });
    if (error) {
      setActionStatus(error.message);
      return;
    }
    setDeposits((prev) =>
      prev.map((deposit) =>
        deposit.id === depositId
          ? { ...deposit, status: approve ? "verified" : "rejected" }
          : deposit,
      ),
    );
    setActionStatus("Deposit updated.");
  };

  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6 pt-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Admin console
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Control KYC, deposits, and wallet balances.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-[var(--muted)]">
            Only approved admins can access this area.
          </p>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          {!isAdmin ? (
            <div className="panel rounded-2xl p-6 text-sm text-[var(--muted)]">
              {adminStatus ?? "Checking admin access..."}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
              <div className="panel rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Users</p>
                    <p className="text-xs text-[var(--muted)]">
                      Select a user to manage
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  {users.length === 0 ? (
                    <div className="rounded-xl border border-[var(--border)] px-3 py-3">
                      No users yet.
                    </div>
                  ) : null}
                  {users.map((user) => (
                    <button
                      key={user.user_id}
                      className={`rounded-xl border px-3 py-3 text-left ${
                        selectedUserId === user.user_id
                          ? "border-[var(--accent)]"
                          : "border-[var(--border)]"
                      }`}
                      type="button"
                      onClick={() => setSelectedUserId(user.user_id)}
                    >
                      <p className="text-sm font-semibold">
                        {user.email ?? "No email"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        KYC {user.kyc_status} · Account {user.account_status}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="panel rounded-2xl p-6">
                  <p className="text-sm font-semibold">KYC review</p>
                  {selectedUser ? (
                    <div className="mt-4 grid gap-3 text-sm">
                      <div className="rounded-xl border border-[var(--border)] px-3 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          Details
                        </p>
                        {kycDetails ? (
                          <div className="mt-2 grid gap-1 text-xs text-[var(--muted)]">
                            <p>Name: {kycDetails.full_name}</p>
                            <p>PAN: {kycDetails.pan}</p>
                            <p>Aadhaar: {kycDetails.aadhaar}</p>
                            <p>Mobile: {kycDetails.mobile}</p>
                            <p>Address: {kycDetails.address}</p>
                            <p>City: {kycDetails.city}</p>
                            <p>State: {kycDetails.state}</p>
                            <p>Postal: {kycDetails.postal_code}</p>
                            <p>Occupation: {kycDetails.occupation}</p>
                            <p>Source: {kycDetails.source_of_funds}</p>
                            <p>Selfie ref: {kycDetails.selfie_ref}</p>
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            No KYC submission yet.
                          </p>
                        )}
                      </div>
                      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        Status
                        <select
                          className="input mt-2"
                          value={kycStatus}
                          onChange={(event) => setKycStatus(event.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </label>
                      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        Review note
                        <input
                          className="input mt-2"
                          value={kycNote}
                          onChange={(event) => setKycNote(event.target.value)}
                          placeholder="Optional note"
                        />
                      </label>
                      <button className="btn btn-primary" onClick={handleKycUpdate}>
                        Update KYC
                      </button>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-[var(--muted)]">
                      Select a user to view KYC.
                    </p>
                  )}
                </div>

                <div className="panel rounded-2xl p-6">
                  <p className="text-sm font-semibold">Account status</p>
                  <div className="mt-4 grid gap-3 text-sm">
                    <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Status
                      <select
                        className="input mt-2"
                        value={accountStatus}
                        onChange={(event) => setAccountStatus(event.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </label>
                    <button className="btn btn-primary" onClick={handleAccountStatus}>
                      Update account
                    </button>
                  </div>
                </div>

                <div className="panel rounded-2xl p-6">
                  <p className="text-sm font-semibold">Wallet balance</p>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        Token
                        <input
                          className="input mt-2"
                          value={balanceToken}
                          onChange={(event) => setBalanceToken(event.target.value)}
                        />
                      </label>
                      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        Chain
                        <input
                          className="input mt-2"
                          value={balanceChain}
                          onChange={(event) => setBalanceChain(event.target.value)}
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        Available
                        <input
                          className="input mt-2"
                          value={balanceAvailable}
                          onChange={(event) => setBalanceAvailable(event.target.value)}
                        />
                      </label>
                      <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                        Locked
                        <input
                          className="input mt-2"
                          value={balanceLocked}
                          onChange={(event) => setBalanceLocked(event.target.value)}
                        />
                      </label>
                    </div>
                    <button className="btn btn-primary" onClick={handleBalanceUpdate}>
                      Set balance
                    </button>
                  </div>
                </div>

                <div className="panel rounded-2xl p-6">
                  <p className="text-sm font-semibold">Pending deposits</p>
                  <div className="mt-4 grid gap-3 text-sm">
                    {deposits.length === 0 ? (
                      <div className="rounded-xl border border-[var(--border)] px-3 py-3">
                        No deposits yet.
                      </div>
                    ) : null}
                    {deposits.map((deposit) => (
                      <div
                        key={deposit.id}
                        className="rounded-xl border border-[var(--border)] px-3 py-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                            {deposit.token} · {deposit.chain}
                          </p>
                          <span className="text-xs text-amber-200">
                            {deposit.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold">
                          {deposit.amount}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          User {deposit.user_id.slice(0, 6)}… · Locked until {formatDateTime(
                            deposit.locked_until,
                          )}
                        </p>
                        {deposit.status === "pending" ? (
                          <div className="mt-3 flex gap-2">
                            <button
                              className="btn btn-primary text-xs"
                              onClick={() => handleDepositDecision(deposit.id, true)}
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-ghost text-xs"
                              onClick={() => handleDepositDecision(deposit.id, false)}
                            >
                              Reject
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {actionStatus ? (
            <p className="mt-4 text-sm text-amber-200">{actionStatus}</p>
          ) : null}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
