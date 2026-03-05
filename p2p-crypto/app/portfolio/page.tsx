"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { formatUsd, formatQty, formatDateTime } from "../../lib/format";

const API_BASE = "https://api.binance.com";

type WalletRow = {
  id: string;
  address: string;
  label: string;
  created_at: string;
};

type BalanceRow = {
  id: string;
  token: string;
  chain: string;
  available: number;
  locked: number;
};

type DepositRow = {
  id: string;
  token: string;
  chain: string;
  amount: number;
  status: string;
  locked_until: string;
  created_at: string;
};

type TransferRow = {
  id: string;
  token: string;
  chain: string;
  amount: number;
  created_at: string;
  sender_id: string;
  recipient_id: string;
};

type KycStatus = "not_started" | "pending" | "approved" | "rejected";

const SHARED_DEPOSIT_WALLETS = [
  {
    chain: "Ethereum",
    token: "USDT",
    address: "0x9b1fC8F1c0c7eE1F4C5a0a1d9D7b3A7c9E1F2A9b",
    qrLabel: "USDT-ERC20",
  },
  {
    chain: "BSC",
    token: "USDT",
    address: "0x9b1fC8F1c0c7eE1F4C5a0a1d9D7b3A7c9E1F2A9b",
    qrLabel: "USDT-BEP20",
  },
  {
    chain: "Tron",
    token: "USDT",
    address: "TQzZk2jX4yQZr4QmY8h1GqM1x3q9P2f8zH",
    qrLabel: "USDT-TRC20",
  },
  {
    chain: "Ethereum",
    token: "USDC",
    address: "0x3e2cC6d1c7E0cB3b7f6b1c8f2f8aA0b9d8e6a1B2",
    qrLabel: "USDC-ERC20",
  },
  {
    chain: "BSC",
    token: "USDC",
    address: "0x6f2aC8b1D9E1c6a3B3b7f6b1c8f2f8aA0b9d8e6a",
    qrLabel: "USDC-BEP20",
  },
  {
    chain: "Bitcoin",
    token: "BTC",
    address: "bc1q2n5r3c7p8s4q0h9r2n5r3c7p8s4q0h9r2n5r3",
    qrLabel: "BTC",
  },
  {
    chain: "Ethereum",
    token: "ETH",
    address: "0x4a8fB1c2D3e4F5a6b7C8d9E0f1a2B3c4D5e6F7a8",
    qrLabel: "ETH",
  },
];

const getLockedUntil = () =>
  new Date(Date.now() + 60 * 60 * 1000).toISOString();

export default function PortfolioPage() {
  const supabase = getSupabaseBrowserClient();
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [balances, setBalances] = useState<BalanceRow[]>([]);
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [priceMap, setPriceMap] = useState<Record<string, number>>({
    USDT: 1,
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "ready" | "error" | "unconfigured"
  >(supabase ? "idle" : "unconfigured");
  const [error, setError] = useState<string | null>(null);
  const [depositToken, setDepositToken] = useState(
    SHARED_DEPOSIT_WALLETS[0]?.token ?? "USDT",
  );
  const [depositChain, setDepositChain] = useState(
    SHARED_DEPOSIT_WALLETS[0]?.chain ?? "Ethereum",
  );
  const [depositAmount, setDepositAmount] = useState("100");
  const [depositStatus, setDepositStatus] = useState<string | null>(null);
  const [isDepositing, setIsDepositing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied">("idle");
  const [kycStatus, setKycStatus] = useState<KycStatus>("not_started");
  const [kycMessage, setKycMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activityFilter, setActivityFilter] = useState<
    "all" | "deposits" | "transfers"
  >("all");

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUserId(userData.user?.id ?? null);

      if (!userData.user) {
        setKycStatus("not_started");
        setKycMessage("Log in and complete KYC to add funds.");
        setStatus("ready");
        return;
      }

      const [
        { data: walletData, error: walletError },
        { data: balanceData },
        { data: transferData },
        { data: depositData },
        { data: profileData, error: profileError },
      ] = await Promise.all([
        supabase.from("wallets").select("id,address,label,created_at").order("created_at"),
        supabase
          .from("wallet_balances")
          .select("id,token,chain,available,locked")
          .order("available", { ascending: false }),
        supabase
          .from("p2p_transfers")
          .select("id,token,chain,amount,created_at,sender_id,recipient_id")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("wallet_deposits")
          .select("id,token,chain,amount,status,locked_until,created_at")
          .order("created_at", { ascending: false })
          .limit(6),
        supabase
          .from("user_profiles")
          .select("kyc_status")
          .eq("user_id", userData.user.id)
          .maybeSingle(),
      ]);

      if (!isMounted) return;

      if (walletError) {
        setStatus("error");
        setError(walletError.message);
        return;
      }

      if (profileError) {
        setKycMessage(profileError.message);
      }

      setKycStatus(
        (profileData?.kyc_status as KycStatus | undefined) ?? "not_started",
      );

      setWallets(walletData ?? []);
      setBalances((balanceData ?? []) as BalanceRow[]);
      setTransfers((transferData ?? []) as TransferRow[]);
      setDeposits((depositData ?? []) as DepositRow[]);
      setStatus("ready");
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [supabase, refreshKey]);

  useEffect(() => {
    let isMounted = true;
    const loadPrices = async () => {
      const tokens = Array.from(
        new Set(balances.map((balance) => balance.token)),
      ).filter((token) => token !== "USDT");

      if (tokens.length === 0) {
        setPriceMap({ USDT: 1 });
        return;
      }

      const symbols = tokens.map((token) => `${token}USDT`);
      const response = await fetch(
        `${API_BASE}/api/v3/ticker/price?symbols=${encodeURIComponent(
          JSON.stringify(symbols),
        )}`,
      );
      if (!response.ok) return;
      const data = (await response.json()) as { symbol: string; price: string }[];
      if (!isMounted) return;
      const nextMap: Record<string, number> = { USDT: 1 };
      data.forEach((item) => {
        const token = item.symbol.replace("USDT", "");
        nextMap[token] = Number.parseFloat(item.price);
      });
      setPriceMap(nextMap);
    };

    void loadPrices();
    return () => {
      isMounted = false;
    };
  }, [balances]);

  const totalValue = useMemo(() => {
    return balances.reduce((sum, balance) => {
      const price = priceMap[balance.token] ?? 0;
      return sum + (balance.available + (balance.locked ?? 0)) * price;
    }, 0);
  }, [balances, priceMap]);

  const totalAvailable = useMemo(
    () => balances.reduce((sum, balance) => sum + balance.available, 0),
    [balances],
  );

  const totalLocked = useMemo(
    () => balances.reduce((sum, balance) => sum + (balance.locked ?? 0), 0),
    [balances],
  );

  const pendingDeposits = useMemo(
    () => deposits.filter((deposit) => deposit.status === "pending").length,
    [deposits],
  );

  const allocationRows = useMemo(() => {
    if (balances.length === 0) return [] as Array<{
      key: string;
      label: string;
      value: number;
      share: number;
    }>;
    const rows = balances.map((balance) => {
      const price = priceMap[balance.token] ?? 0;
      const total = balance.available + (balance.locked ?? 0);
      const value = total * price;
      return {
        key: `${balance.token}-${balance.chain}`,
        label: `${balance.token} · ${balance.chain}`,
        value,
        share: totalValue > 0 ? value / totalValue : 0,
      };
    });
    return rows
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [balances, priceMap, totalValue]);

  const walletAddress = wallets[0]?.address;

  const handleDeposit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDepositStatus(null);

    if (!supabase) {
      setDepositStatus("Supabase is not configured yet.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setDepositStatus("Log in to add funds.");
      return;
    }

    if (kycStatus !== "approved") {
      setDepositStatus("Complete KYC before adding funds.");
      return;
    }

    const amountValue = Number.parseFloat(depositAmount || "0");
    if (!amountValue || amountValue <= 0) {
      setDepositStatus("Enter a valid amount.");
      return;
    }

    setIsDepositing(true);
    const lockedUntil = getLockedUntil();

    const { error: depositError } = await supabase
      .from("wallet_deposits")
      .insert({
        user_id: userData.user.id,
        token: depositToken,
        chain: resolvedDepositChain,
        amount: amountValue,
        status: "pending",
        locked_until: lockedUntil,
      })
      .select()
      .single();

    if (depositError) {
      setDepositStatus(depositError.message);
      setIsDepositing(false);
      return;
    }

    const { data: existingBalance, error: balanceError } = await supabase
      .from("wallet_balances")
      .select("id,locked,available")
      .eq("user_id", userData.user.id)
      .eq("token", depositToken)
      .eq("chain", resolvedDepositChain)
      .maybeSingle();

    if (balanceError) {
      setDepositStatus(balanceError.message);
      setIsDepositing(false);
      return;
    }

    if (existingBalance?.id) {
      const nextLocked = Number(existingBalance.locked ?? 0) + amountValue;
      await supabase
        .from("wallet_balances")
        .update({ locked: nextLocked })
        .eq("id", existingBalance.id);
    } else {
      await supabase.from("wallet_balances").insert({
        user_id: userData.user.id,
        token: depositToken,
        chain: resolvedDepositChain,
        available: 0,
        locked: amountValue,
      });
    }

    setDepositStatus(
      "Deposit submitted. Funds are locked for 1 hour while we verify.",
    );
    setIsDepositing(false);
    setRefreshKey((k) => k + 1);
  };

  const availableChains = useMemo(() => {
    return SHARED_DEPOSIT_WALLETS.filter(
      (item) => item.token === depositToken,
    ).map((item) => item.chain);
  }, [depositToken]);

  const resolvedDepositChain = availableChains.includes(depositChain)
    ? depositChain
    : availableChains[0] ?? "Ethereum";

  const selectedWallet = useMemo(
    () =>
      SHARED_DEPOSIT_WALLETS.find(
        (wallet) =>
          wallet.token === depositToken && wallet.chain === resolvedDepositChain,
      ) ?? null,
    [depositToken, resolvedDepositChain],
  );

  const handleCopyAddress = async () => {
    if (!selectedWallet?.address) return;
    try {
      await navigator.clipboard.writeText(selectedWallet.address);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2000);
    } catch {
      setCopyStatus("idle");
    }
  };

  const activityItems = useMemo(() => {
    const transferItems = transfers.map((transfer) => ({
      id: transfer.id,
      type: "transfer" as const,
      time: transfer.created_at,
      token: transfer.token,
      chain: transfer.chain,
      amount: transfer.amount,
      direction:
        userId && transfer.sender_id === userId ? "Sent" : "Received",
      status: "completed" as const,
    }));

    const depositItems = deposits.map((deposit) => ({
      id: deposit.id,
      type: "deposit" as const,
      time: deposit.created_at,
      token: deposit.token,
      chain: deposit.chain,
      amount: deposit.amount,
      direction: "Deposit" as const,
      status: deposit.status,
    }));

    const combined = [...transferItems, ...depositItems].sort((a, b) =>
      b.time.localeCompare(a.time),
    );

    if (activityFilter === "deposits") {
      return combined.filter((item) => item.type === "deposit").slice(0, 8);
    }
    if (activityFilter === "transfers") {
      return combined.filter((item) => item.type === "transfer").slice(0, 8);
    }
    return combined.slice(0, 8);
  }, [activityFilter, deposits, transfers, userId]);

  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6">
        <div className="mx-auto max-w-7xl">
          <div className="surface grid gap-6 rounded-3xl px-6 py-8 lg:grid-cols-[1.35fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Portfolio
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                Wallet balances with real-time settlement visibility.
              </h1>
              <p className="mt-4 max-w-xl text-sm text-[var(--muted)]">
                Review assets, available funds, and pending deposits before
                listing on P2P.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="panel rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    Total value
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {formatUsd(totalValue)}
                  </p>
                  <p className="text-xs text-[var(--muted-2)]">Spot wallet</p>
                </div>
                <div className="panel rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    Assets
                  </p>
                  <p className="mt-2 text-lg font-semibold">
                    {balances.length}
                  </p>
                  <p className="text-xs text-[var(--muted-2)]">
                    Tokens tracked
                  </p>
                </div>
                <div className="panel rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    Wallet
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {walletAddress ? `${walletAddress.slice(0, 10)}…` : "—"}
                  </p>
                  <p className="text-xs text-[var(--muted-2)]">
                    Main address
                  </p>
                </div>
              </div>
            </div>
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold">Wallet highlights</p>
              <div className="mt-4 grid gap-3 text-sm">
                {[
                  "KYC required for deposits",
                  "Pending deposits lock funds",
                  "P2P listings require available balance",
                  "Shared on-chain wallets",
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
                Balances refresh after each deposit submission.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Asset balances</p>
                <p className="text-xs text-[var(--muted)]">
                  Multi-chain wallet overview
                </p>
              </div>
            </div>

            {status === "unconfigured" ? (
              <p className="mt-6 text-sm text-[var(--muted)]">
                Supabase is not configured yet.
              </p>
            ) : null}
            {status === "loading" ? (
              <p className="mt-6 text-sm text-[var(--muted)]">
                Loading balances...
              </p>
            ) : null}
            {status === "error" ? (
              <p className="mt-6 text-sm text-[var(--danger)]">{error}</p>
            ) : null}

            {status === "ready" ? (
              <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--border)] bg-[rgba(15,21,28,0.7)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Available
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatQty(totalAvailable, 6)}
                    </p>
                    <p className="text-xs text-[var(--muted-2)]">All assets</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[rgba(15,21,28,0.7)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Locked
                    </p>
                    <p className="mt-2 text-lg font-semibold text-amber-200">
                      {formatQty(totalLocked, 6)}
                    </p>
                    <p className="text-xs text-[var(--muted-2)]">
                      Pending deposits {pendingDeposits}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[rgba(15,21,28,0.7)] px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Total value
                    </p>
                    <p className="mt-2 text-lg font-semibold">
                      {formatUsd(totalValue)}
                    </p>
                    <p className="text-xs text-[var(--muted-2)]">Spot wallet</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[rgba(15,21,28,0.7)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Allocation
                  </p>
                  {allocationRows.length === 0 ? (
                    <p className="mt-3 text-xs text-[var(--muted)]">
                      No balances yet. Add funds to see allocation.
                    </p>
                  ) : (
                    <div className="mt-3 grid gap-2 text-xs">
                      {allocationRows.map((row) => (
                        <div key={row.key} className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--text)]">
                              {row.label}
                            </span>
                            <span className="text-[var(--muted)]">
                              {formatUsd(row.value)}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-[var(--border)]">
                            <div
                              className="h-2 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--accent-2))]"
                              style={{ width: `${Math.max(row.share * 100, 6)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Add funds</p>
                <p className="text-xs text-[var(--muted)]">
                  Multi-network deposits with shared vaults
                </p>
              </div>
            </div>
            {kycStatus !== "approved" ? (
              <div className="mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                  KYC required
                </p>
                <p className="mt-2">
                  Complete verification before adding funds to your wallet.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <a className="btn btn-primary text-xs" href="/kyc">
                    Start KYC
                  </a>
                  {kycMessage ? (
                    <span className="text-xs text-amber-100">
                      {kycMessage}
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl border border-[var(--border)] bg-[rgba(15,21,28,0.7)] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      Selected deposit address
                    </p>
                    <p className="mt-2 text-sm font-semibold">
                      {depositToken} · {resolvedDepositChain}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost text-xs"
                    onClick={handleCopyAddress}
                  >
                    {copyStatus === "copied" ? "Copied" : "Copy address"}
                  </button>
                </div>
                <p className="mt-3 break-all text-sm font-semibold">
                  {selectedWallet?.address ?? "No address available"}
                </p>
                {selectedWallet ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <Image
                      className="h-16 w-16 rounded-xl border border-[var(--border)]"
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                        selectedWallet.address,
                      )}`}
                      alt={`${selectedWallet.qrLabel} QR`}
                      width={64}
                      height={64}
                      unoptimized
                    />
                    <div className="text-xs text-[var(--muted)]">
                      <p>Send only {depositToken} on {resolvedDepositChain}.</p>
                      <p>Wrong network deposits cannot be recovered.</p>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-[var(--border)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  How it works
                </p>
                <div className="mt-3 grid gap-2 text-xs text-[var(--muted)]">
                  <p>1. Choose token and chain, then copy the address.</p>
                  <p>2. Send funds from your wallet or exchange.</p>
                  <p>3. Enter the amount sent and confirm.</p>
                </div>
              </div>
            </div>

            <form className="mt-5 grid gap-3" onSubmit={handleDeposit}>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Token
                  <select
                    className="input mt-2"
                    value={depositToken}
                    onChange={(event) => setDepositToken(event.target.value)}
                    disabled={kycStatus !== "approved"}
                  >
                    {Array.from(
                      new Set(SHARED_DEPOSIT_WALLETS.map((item) => item.token)),
                    ).map((token) => (
                      <option key={token} value={token}>
                        {token}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Chain
                  <select
                    className="input mt-2"
                    value={resolvedDepositChain}
                    onChange={(event) => setDepositChain(event.target.value)}
                    disabled={kycStatus !== "approved"}
                  >
                    {availableChains.map((chain) => (
                      <option key={chain} value={chain}>
                        {chain}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                Amount
                <input
                  className="input mt-2"
                  value={depositAmount}
                  onChange={(event) => setDepositAmount(event.target.value)}
                  disabled={kycStatus !== "approved"}
                />
              </label>
              <button
                className="btn btn-primary"
                disabled={isDepositing || kycStatus !== "approved"}
              >
                {isDepositing ? "Submitting..." : "Confirm transfer"}
              </button>
              {depositStatus ? (
                <p className="text-xs text-amber-200">{depositStatus}</p>
              ) : null}
            </form>
          </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Recent activity</p>
                <p className="text-xs text-[var(--muted)]">
                  Deposits and P2P settlements
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                {[
                  { key: "all", label: "All" },
                  { key: "deposits", label: "Deposits" },
                  { key: "transfers", label: "Transfers" },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    className={`rounded-full border px-3 py-1 ${
                      activityFilter === filter.key
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--muted)]"
                    }`}
                    onClick={() =>
                      setActivityFilter(filter.key as typeof activityFilter)
                    }
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              {activityItems.length === 0 ? (
                <div className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm">
                  No activity yet.
                </div>
              ) : null}
              {activityItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="rounded-xl border border-[var(--border)] bg-[rgba(15,21,28,0.7)] px-3 py-3"
                >
                  <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                    <span>{formatDateTime(item.time)}</span>
                    <span className="uppercase tracking-[0.2em]">
                      {item.type}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        {item.direction}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {item.token} · {item.chain}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {formatQty(item.amount, 6)}
                      </p>
                      <p
                        className={`text-xs ${
                          item.status === "pending"
                            ? "text-amber-200"
                            : "text-[var(--muted)]"
                        }`}
                      >
                        {item.status}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Pending deposits</p>
                <p className="text-xs text-[var(--muted)]">
                  Locked for 1 hour while we verify
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm">
              {deposits.filter((deposit) => deposit.status === "pending").length ===
              0 ? (
                <div className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm">
                  No pending deposits.
                </div>
              ) : null}
              {deposits
                .filter((deposit) => deposit.status === "pending")
                .map((deposit) => (
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
                      {formatQty(deposit.amount, 6)}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Locked until {formatDateTime(deposit.locked_until)}
                    </p>
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
