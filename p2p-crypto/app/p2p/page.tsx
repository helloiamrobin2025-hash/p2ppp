"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";
import { formatUsd, formatCompactUsd, formatPct, toNumber } from "../../lib/format";

const API_BASE = "https://api.binance.com";
const PRICE_REFRESH_MS = 15000;

const TOKENS = [
  { symbol: "USDT", label: "Tether" },
  { symbol: "USDC", label: "USD Coin" },
  { symbol: "BTC", label: "Bitcoin" },
  { symbol: "ETH", label: "Ethereum" },
  { symbol: "BNB", label: "BNB" },
  { symbol: "SOL", label: "Solana" },
  { symbol: "XRP", label: "XRP" },
  { symbol: "ADA", label: "Cardano" },
  { symbol: "TRX", label: "Tron" },
  { symbol: "DOGE", label: "Dogecoin" },
  { symbol: "TON", label: "Ton" },
  { symbol: "AVAX", label: "Avalanche" },
  { symbol: "LINK", label: "Chainlink" },
  { symbol: "MATIC", label: "Polygon" },
];

const CHAINS = [
  "Ethereum",
  "BSC",
  "Solana",
  "Tron",
  "Arbitrum",
  "Polygon",
  "Base",
  "Optimism",
];

const PAYMENT_METHODS = [
  "Bank transfer",
  "UPI",
  "SEPA",
  "PIX",
  "PayNow",
  "PayID",
  "Revolut",
  "Wise",
];

const FIAT_CURRENCIES = ["USD", "EUR", "INR", "GBP", "AED", "BRL"];

type Side = "buy" | "sell";
type KycStatus = "not_started" | "pending" | "approved" | "rejected";

type P2POffer = {
  id: string;
  user_id: string;
  side: Side;
  token: string;
  chain: string;
  fiat_currency: string;
  payment_method: string;
  price: number;
  min_amount: number;
  max_amount: number;
  available_amount: number;
  status: string;
};

export default function P2PPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [authStatus, setAuthStatus] = useState<"checking" | "ready">(
    "checking",
  );
  const side: Side = "sell";
  const [token, setToken] = useState("USDT");
  const [chain, setChain] = useState("Ethereum");
  const [payment, setPayment] = useState("Bank transfer");
  const [fiatCurrency, setFiatCurrency] = useState("USD");
  const [amount, setAmount] = useState("1000");
  const [priceMap, setPriceMap] = useState<Record<string, number>>({
    USDT: 1,
  });
  const [changeMap, setChangeMap] = useState<Record<string, number>>({
    USDT: 0,
  });
  const [offers, setOffers] = useState<P2POffer[]>([]);
  const [offersStatus, setOffersStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [offersError, setOffersError] = useState<string | null>(null);

  const offerSide: Side = "sell";
  const [offerToken, setOfferToken] = useState("USDT");
  const [offerChain, setOfferChain] = useState("Ethereum");
  const [offerFiat, setOfferFiat] = useState("USD");
  const [offerPayment, setOfferPayment] = useState("Bank transfer");
  const [offerPrice, setOfferPrice] = useState("1.01");
  const [offerMin, setOfferMin] = useState("100");
  const [offerMax, setOfferMax] = useState("10000");
  const [offerAvailable, setOfferAvailable] = useState("20000");
  const [offerStatus, setOfferStatus] = useState<string | null>(null);
  const [isPostingOffer, setIsPostingOffer] = useState(false);

  const [kycStatus, setKycStatus] = useState<KycStatus>("not_started");
  const [kycNote, setKycNote] = useState<string | null>(null);

  const offerSummary = useMemo(() => {
    const merchantCount = new Set(offers.map((offer) => offer.user_id)).size;
    const totalLiquidity = offers.reduce(
      (sum, offer) => sum + offer.available_amount,
      0,
    );
    const bestPrice = offers.length > 0 ? offers[0].price : null;
    return { merchantCount, totalLiquidity, bestPrice };
  }, [offers]);

  const referencePrice = priceMap[token] ?? 0;
  const priceChange = changeMap[token] ?? 0;
  const offerReferencePrice = priceMap[offerToken] ?? 0;
  const offerPriceChange = changeMap[offerToken] ?? 0;
  const isPriceLoading = token !== "USDT" && !priceMap[token];

  const offerSpread = useMemo(() => {
    const priceValue = toNumber(offerPrice);
    if (!offerReferencePrice) return 0;
    return (priceValue - offerReferencePrice) / offerReferencePrice;
  }, [offerPrice, offerReferencePrice]);

  useEffect(() => {
    if (!supabase) {
      setAuthStatus("ready");
      return;
    }

    let isMounted = true;
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (!data.user) {
        router.replace("/login?redirect=/p2p");
        return;
      }
      setAuthStatus("ready");
    };

    void checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router, supabase]);


  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadPrices = async () => {
      const symbols = TOKENS.filter((item) => item.symbol !== "USDT").map(
        (item) => `${item.symbol}USDT`,
      );

      try {
        const response = await fetch(
          `${API_BASE}/api/v3/ticker/24hr?symbols=${encodeURIComponent(
            JSON.stringify(symbols),
          )}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as Array<{
          symbol: string;
          lastPrice: string;
          priceChangePercent: string;
        }>;

        const nextPriceMap: Record<string, number> = { USDT: 1 };
        const nextChangeMap: Record<string, number> = { USDT: 0 };

        data.forEach((item) => {
          const symbol = item.symbol.replace("USDT", "");
          nextPriceMap[symbol] = toNumber(item.lastPrice);
          nextChangeMap[symbol] = toNumber(item.priceChangePercent);
        });

        if (!isMounted) return;
        setPriceMap(nextPriceMap);
        setChangeMap(nextChangeMap);
      } catch {
        if (!isMounted) return;
      }
    };

    void loadPrices();
    intervalId = setInterval(loadPrices, PRICE_REFRESH_MS);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const loadOffers = async () => {
      setOffersStatus("loading");
      setOffersError(null);
      const { data, error } = await supabase
        .from("p2p_offers")
        .select("*")
        .eq("status", "open")
        .eq("side", side)
        .eq("token", token)
        .eq("chain", chain)
        .eq("fiat_currency", fiatCurrency)
        .eq("payment_method", payment)
        .order("price", { ascending: true });

      if (!isMounted) return;
      if (error) {
        setOffersStatus("error");
        setOffersError(error.message);
        return;
      }

      setOffers(data ?? []);
      setOffersStatus("ready");
    };

    void loadOffers();
    return () => {
      isMounted = false;
    };
  }, [supabase, side, token, chain, fiatCurrency, payment]);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const loadKycStatus = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        if (!isMounted) return;
        setKycStatus("not_started");
        setKycNote("Log in and complete KYC to unlock P2P.");
        return;
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .select("kyc_status")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (!isMounted) return;
      if (error) {
        setKycNote(error.message);
        return;
      }

      setKycStatus((data?.kyc_status as KycStatus | undefined) ?? "not_started");
    };

    void loadKycStatus();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  const filteredOffers = useMemo(() => {
    const amountValue = Number.parseFloat(amount || "0");
    if (!amountValue) return offers;
    return offers.filter(
      (offer) =>
        amountValue >= offer.min_amount && amountValue <= offer.max_amount,
    );
  }, [offers, amount]);

  const handleCreateOffer = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setOfferStatus(null);

    if (kycStatus !== "approved") {
      setOfferStatus("Complete KYC before posting P2P offers.");
      return;
    }

    if (!supabase) {
      setOfferStatus("Supabase is not configured yet.");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setOfferStatus("Log in to create an offer.");
      return;
    }

    const { data: balanceData, error: balanceError } = await supabase
      .from("wallet_balances")
      .select("available")
      .eq("user_id", userData.user.id)
      .eq("token", offerToken)
      .eq("chain", offerChain)
      .maybeSingle();

    if (balanceError) {
      setOfferStatus(balanceError.message);
      return;
    }

    const availableBalance = Number.parseFloat(
      String(balanceData?.available ?? 0),
    );
    const requestedAmount = Number.parseFloat(offerAvailable || "0");
    if (!requestedAmount || requestedAmount <= 0) {
      setOfferStatus("Enter a valid available amount.");
      return;
    }
    if (!availableBalance || availableBalance < requestedAmount) {
      setOfferStatus("First add tokens in your wallet to post this offer.");
      return;
    }

    setIsPostingOffer(true);
    const payload = {
      user_id: userData.user.id,
      side: offerSide,
      token: offerToken,
      chain: offerChain,
      fiat_currency: offerFiat,
      payment_method: offerPayment,
      price: Number.parseFloat(offerPrice),
      min_amount: Number.parseFloat(offerMin),
      max_amount: Number.parseFloat(offerMax),
      available_amount: Number.parseFloat(offerAvailable),
      status: "open",
    };

    const { error } = await supabase.from("p2p_offers").insert(payload);

    if (error) {
      setOfferStatus(error.message);
      setIsPostingOffer(false);
      return;
    }

    setOfferStatus("Offer posted.");
    setIsPostingOffer(false);
  };

  if (authStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center app-bg">
        <p className="text-sm text-[var(--muted)]">Checking session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6">
        <div className="mx-auto max-w-7xl">
          <div className="surface grid gap-6 rounded-3xl px-6 py-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                P2P
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                P2P trades with verified rails and flexible settlement flows.
              </h1>
              <p className="mt-4 max-w-xl text-sm text-[var(--muted)]">
                Match with buyers fast using regional payment rails, KYC gates,
                and transparent on-chain routing across supported networks.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Escrow-ready", value: "Compliance rails" },
                  { label: "Verified sellers", value: "KYC enforced" },
                  { label: "Fast settlement", value: "Internal wallets" },
                ].map((item) => (
                  <div key={item.label} className="panel rounded-2xl p-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Market pulse</p>
                  <p className="text-xs text-[var(--muted)]">
                    Live reference for {token}
                  </p>
                </div>
                <span className="text-xs text-[var(--muted)]">
                  24h {formatPct(priceChange)}
                </span>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-xl border border-[var(--border)] px-3 py-2">
                  <p className="text-xs text-[var(--muted)]">Reference price</p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatUsd(referencePrice)} {fiatCurrency}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] px-3 py-2">
                  <p className="text-xs text-[var(--muted)]">Best seller</p>
                  <p className="mt-1 text-sm font-semibold">
                    {offerSummary.bestPrice
                      ? `${formatUsd(offerSummary.bestPrice)} ${fiatCurrency}`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] px-3 py-2">
                  <p className="text-xs text-[var(--muted)]">Active merchants</p>
                  <p className="mt-1 text-sm font-semibold">
                    {offerSummary.merchantCount}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-[var(--border)] px-3 py-3 text-xs text-[var(--muted)]">
                P2P prices update with the live order book and seller spreads.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="panel rounded-2xl p-6">
              {kycStatus !== "approved" ? (
                <div className="mb-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-200">
                    KYC required for P2P
                  </p>
                  <p className="mt-2">
                    Complete verification to place orders or post offers.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <a className="btn btn-primary text-xs" href="/kyc">
                      Start KYC
                    </a>
                    {kycNote ? (
                      <span className="text-xs text-amber-100">{kycNote}</span>
                    ) : null}
                  </div>
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold">Sell offers</p>
                  <p className="text-xs text-[var(--muted)]">
                    Reference price {formatUsd(referencePrice)} {fiatCurrency}
                    {isPriceLoading ? " · loading" : ""}
                  </p>
                </div>
                <div className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted)]">
                  Selling only
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-5">
                <div className="grid gap-2">
                  <label className="input-label" htmlFor="token">
                    Token
                  </label>
                  <select
                    id="token"
                    className="input"
                    value={token}
                    onChange={(event) => setToken(event.target.value)}
                  >
                    {TOKENS.map((item) => (
                      <option key={item.symbol} value={item.symbol}>
                        {item.symbol} · {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="input-label" htmlFor="chain">
                    Chain
                  </label>
                  <select
                    id="chain"
                    className="input"
                    value={chain}
                    onChange={(event) => setChain(event.target.value)}
                  >
                    {CHAINS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="input-label" htmlFor="payment">
                    Payment
                  </label>
                  <select
                    id="payment"
                    className="input"
                    value={payment}
                    onChange={(event) => setPayment(event.target.value)}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="input-label" htmlFor="fiat">
                    Fiat
                  </label>
                  <select
                    id="fiat"
                    className="input"
                    value={fiatCurrency}
                    onChange={(event) => setFiatCurrency(event.target.value)}
                  >
                    {FIAT_CURRENCIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="input-label" htmlFor="amount">
                    Amount
                  </label>
                  <input
                    id="amount"
                    className="input"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[var(--muted)]">Quick payment:</span>
                {PAYMENT_METHODS.slice(0, 5).map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`rounded-full border px-3 py-1 ${
                      payment === method
                        ? "border-[var(--accent)] text-[var(--accent)]"
                        : "border-[var(--border)] text-[var(--muted)]"
                    }`}
                    onClick={() => setPayment(method)}
                  >
                    {method}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs">
                  <p className="text-[var(--muted)]">Active merchants</p>
                  <p className="mt-1 text-sm font-semibold">
                    {offerSummary.merchantCount}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs">
                  <p className="text-[var(--muted)]">Liquidity</p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatCompactUsd(offerSummary.totalLiquidity)}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--border)] px-3 py-2 text-xs">
                  <p className="text-[var(--muted)]">Best offer</p>
                  <p className="mt-1 text-sm font-semibold">
                    {offerSummary.bestPrice
                      ? `${formatUsd(offerSummary.bestPrice)} ${fiatCurrency}`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <div className="grid min-w-[620px] gap-2 text-xs text-[var(--muted)]">
                  <div className="grid grid-cols-[1.3fr_1fr_1.2fr_1fr] gap-2 px-3">
                    <span>Merchant</span>
                    <span className="text-right">Price</span>
                    <span className="text-right">Available</span>
                    <span className="text-right">Limits</span>
                  </div>

                  {offersStatus === "loading" ? (
                    <div className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm">
                      Loading offers...
                    </div>
                  ) : null}

                  {offersStatus === "error" ? (
                    <div className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm text-[var(--danger)]">
                      {offersError}
                    </div>
                  ) : null}

                  {offersStatus === "ready" && filteredOffers.length === 0 ? (
                    <div className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm">
                      No offers match these filters yet. Try another chain or
                      payment rail.
                    </div>
                  ) : null}

                  {filteredOffers.map((offer) => (
                    <div
                      key={offer.id}
                      className="grid grid-cols-[1.3fr_1fr_1.2fr_1fr] items-center gap-2 rounded-xl border border-[var(--border)] bg-[rgba(15,21,28,0.7)] px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="text-[var(--text)]">
                          {offer.user_id.slice(0, 6)}…
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {offer.payment_method}
                        </p>
                      </div>
                      <span className="text-right">
                        {formatUsd(offer.price)} {offer.fiat_currency}
                      </span>
                      <span className="text-right text-xs text-[var(--muted)]">
                        {formatCompactUsd(offer.available_amount)}
                      </span>
                      <span className="text-right text-xs text-[var(--muted)]">
                        {formatCompactUsd(offer.min_amount)} - {formatCompactUsd(offer.max_amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="panel rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Post an offer</p>
                    <p className="text-xs text-[var(--muted)]">
                      Create a buy or sell listing
                    </p>
                  </div>
                  <div className="text-right text-xs text-[var(--muted)]">
                    24h change {formatPct(offerPriceChange)}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-xs">
                  <div className="rounded-xl border border-[var(--border)] px-3 py-2">
                    <p className="text-[var(--muted)]">Reference price</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatUsd(offerReferencePrice)} {offerFiat}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] px-3 py-2">
                    <p className="text-[var(--muted)]">Your spread</p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatPct(offerSpread)}
                    </p>
                  </div>
                </div>

                <form className="mt-4 grid gap-3" onSubmit={handleCreateOffer}>
                <div className="grid gap-2">
                  <label className="input-label" htmlFor="offer-token">
                    Token
                  </label>
                  <select
                    id="offer-token"
                    className="input"
                    value={offerToken}
                    onChange={(event) => setOfferToken(event.target.value)}
                  >
                    {TOKENS.map((item) => (
                      <option key={item.symbol} value={item.symbol}>
                        {item.symbol}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="input-label" htmlFor="offer-chain">
                    Chain
                  </label>
                  <select
                    id="offer-chain"
                    className="input"
                    value={offerChain}
                    onChange={(event) => setOfferChain(event.target.value)}
                  >
                    {CHAINS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="input-label" htmlFor="offer-payment">
                    Payment
                  </label>
                  <select
                    id="offer-payment"
                    className="input"
                    value={offerPayment}
                    onChange={(event) => setOfferPayment(event.target.value)}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {method}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="input-label" htmlFor="offer-fiat">
                    Fiat
                  </label>
                  <select
                    id="offer-fiat"
                    className="input"
                    value={offerFiat}
                    onChange={(event) => setOfferFiat(event.target.value)}
                  >
                    {FIAT_CURRENCIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="input-label" htmlFor="offer-price">
                    Price
                  </label>
                  <input
                    id="offer-price"
                    className="input"
                    value={offerPrice}
                    onChange={(event) => setOfferPrice(event.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <label className="input-label" htmlFor="offer-min">
                      Min
                    </label>
                    <input
                      id="offer-min"
                      className="input"
                      value={offerMin}
                      onChange={(event) => setOfferMin(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="input-label" htmlFor="offer-max">
                      Max
                    </label>
                    <input
                      id="offer-max"
                      className="input"
                      value={offerMax}
                      onChange={(event) => setOfferMax(event.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <label className="input-label" htmlFor="offer-available">
                    Available
                  </label>
                  <input
                    id="offer-available"
                    className="input"
                    value={offerAvailable}
                    onChange={(event) => setOfferAvailable(event.target.value)}
                  />
                </div>
                {offerStatus ? (
                  <p
                    className={`text-xs ${
                      offerStatus.includes("posted")
                        ? "text-[var(--accent)]"
                        : "text-[var(--danger)]"
                    }`}
                  >
                    {offerStatus}
                  </p>
                ) : null}
                <button
                  className="btn btn-primary"
                  disabled={isPostingOffer || kycStatus !== "approved"}
                >
                  {isPostingOffer ? "Posting..." : "Post offer"}
                </button>
              </form>
            </div>

            <div className="panel rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Seller controls</p>
                  <p className="text-xs text-[var(--muted)]">
                    Manage active listings and limits
                  </p>
                </div>
                <div className="text-right text-xs text-[var(--muted)]">
                  24h change {formatPct(priceChange)}
                </div>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                {[
                  "Pause or resume offers",
                  "Set custom price spreads",
                  "Update payment method availability",
                  "Review open orders",
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
                P2P transfers are seller-driven through posted offers.
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
