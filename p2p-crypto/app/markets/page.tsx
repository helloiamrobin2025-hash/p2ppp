"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from "recharts";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";
import { formatUsd, formatCompactUsd, formatPct, toNumber, symbolLabel } from "../../lib/format";

const API_BASE = "https://api.binance.com";
const SPARKLINE_COUNT = 12;
const KLINE_INTERVAL = "15m";
const KLINE_LIMIT = 20;

type Ticker24h = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
};

type Kline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

type SortKey = "symbol" | "price" | "change" | "range" | "volume";
type SortDirection = "asc" | "desc";

const isUsdtPair = (symbol: string) => symbol.endsWith("USDT");

const removeLeveraged = (symbol: string) =>
  !symbol.includes("UPUSDT") && !symbol.includes("DOWNUSDT");

const sortRows = (
  rows: Ticker24h[],
  sortKey: SortKey,
  sortDirection: SortDirection,
) => {
  const direction = sortDirection === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sortKey === "symbol") {
      return direction * a.symbol.localeCompare(b.symbol);
    }
    if (sortKey === "price") {
      return direction * (toNumber(a.lastPrice) - toNumber(b.lastPrice));
    }
    if (sortKey === "change") {
      return (
        direction *
        (toNumber(a.priceChangePercent) - toNumber(b.priceChangePercent))
      );
    }
    if (sortKey === "range") {
      const rangeA = toNumber(a.highPrice) - toNumber(a.lowPrice);
      const rangeB = toNumber(b.highPrice) - toNumber(b.lowPrice);
      return direction * (rangeA - rangeB);
    }
    return direction * (toNumber(a.quoteVolume) - toNumber(b.quoteVolume));
  });
};

const useMarketsData = () => {
  const [tickers, setTickers] = useState<Ticker24h[]>([]);
  const [sparklines, setSparklines] = useState<Record<string, number[]>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/api/v3/ticker/24hr`);
        if (!response.ok) {
          throw new Error(`Binance request failed: ${response.status}`);
        }
        const data = (await response.json()) as Ticker24h[];
        const usdt = data.filter(
          (ticker) => isUsdtPair(ticker.symbol) && removeLeveraged(ticker.symbol),
        );
        if (!isMounted) return;
        setTickers(usdt);

        const topSymbols = [...usdt]
          .sort((a, b) => toNumber(b.quoteVolume) - toNumber(a.quoteVolume))
          .slice(0, SPARKLINE_COUNT)
          .map((ticker) => ticker.symbol);

        const sparklineResults = await Promise.all(
          topSymbols.map(async (symbol) => {
            const klineResponse = await fetch(
              `${API_BASE}/api/v3/klines?symbol=${symbol}&interval=${KLINE_INTERVAL}&limit=${KLINE_LIMIT}`,
            );
            if (!klineResponse.ok) {
              return [symbol, []] as const;
            }
            const klineData = (await klineResponse.json()) as Kline[];
            const closes = klineData.map((kline) => toNumber(kline[4]));
            return [symbol, closes] as const;
          }),
        );

        if (!isMounted) return;
        setSparklines(Object.fromEntries(sparklineResults));
        setStatus("ready");
      } catch (caught) {
        if (!isMounted) return;
        const message =
          caught instanceof Error
            ? caught.message
            : "Unable to load Binance data.";
        setError(message);
        setStatus("error");
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { tickers, sparklines, status, error };
};

const Sparkline = ({ data, isUp }: { data?: number[]; isUp: boolean }) => {
  if (!data || data.length === 0) {
    return <div className="h-10 w-full" />;
  }

  const chartData = data.map((value, index) => ({ value, index }));
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Tooltip
            contentStyle={{
              background: "#0b0f13",
              border: "1px solid #1f2a36",
              borderRadius: "10px",
              fontSize: "12px",
            }}
            formatter={(value) => (typeof value === "number" ? formatUsd(value) : "")}
            labelFormatter={() => ""}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={isUp ? "#2ee6a6" : "#ff5f52"}
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function MarketsPage() {
  const { tickers, sparklines, status, error } = useMarketsData();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const summaryTickers = useMemo(
    () => {
      const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT"];
      return symbols
        .map((symbol) => tickers.find((ticker) => ticker.symbol === symbol))
        .filter((ticker): ticker is Ticker24h => Boolean(ticker));
    },
    [tickers],
  );

  const totalVolume = useMemo(
    () => tickers.reduce((sum, ticker) => sum + toNumber(ticker.quoteVolume), 0),
    [tickers],
  );

  const topGainers = useMemo(
    () =>
      [...tickers]
        .sort(
          (a, b) =>
            toNumber(b.priceChangePercent) - toNumber(a.priceChangePercent),
        )
        .slice(0, 5),
    [tickers],
  );

  const topLosers = useMemo(
    () =>
      [...tickers]
        .sort(
          (a, b) =>
            toNumber(a.priceChangePercent) - toNumber(b.priceChangePercent),
        )
        .slice(0, 5),
    [tickers],
  );

  const filteredTickers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tickers;
    return tickers.filter((ticker) =>
      ticker.symbol.toLowerCase().includes(query),
    );
  }, [search, tickers]);

  const sortedTickers = useMemo(
    () => sortRows(filteredTickers, sortKey, sortDirection),
    [filteredTickers, sortKey, sortDirection],
  );

  const visibleTickers = sortedTickers.slice(0, 40);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("desc");
  };

  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6">
        <div className="mx-auto max-w-7xl">
          <div className="surface grid gap-6 rounded-3xl px-6 py-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Markets
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Live USDT markets with depth-aware pricing.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[var(--muted)]">
              Powered by Binance public data. Track the most liquid pairs, spot
              gainers and losers, and view 24h ranges across major assets.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <span className="chip rounded-full px-3 py-1">Spot</span>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted)]">
                Futures
              </span>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted)]">
                New listings
              </span>
            </div>
          </div>
          <div className="panel rounded-2xl p-5">
            <p className="text-sm font-semibold">Market filters</p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                <span className="text-xs text-[var(--muted)]">Quote</span>
                <span className="font-semibold">USDT</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                <span className="text-xs text-[var(--muted)]">Liquidity</span>
                <span className="font-semibold">Top 40</span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                <span className="text-xs text-[var(--muted)]">Volume</span>
                <span className="font-semibold">
                  {formatCompactUsd(totalVolume)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                <span className="text-xs text-[var(--muted)]">Refresh</span>
                <span className="font-semibold">Live</span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="panel rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Major pairs</p>
                <p className="text-xs text-[var(--muted)]">
                  24h ranges and last price
                </p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="grid min-w-[640px] gap-3 text-sm">
              {summaryTickers.map((ticker) => {
                const change = toNumber(ticker.priceChangePercent);
                return (
                  <div
                    key={ticker.symbol}
                    className="grid grid-cols-[1fr_1fr_1fr_1fr] items-center gap-2 rounded-xl bg-[rgba(15,21,28,0.7)] px-3 py-2"
                  >
                    <span className="text-[var(--text)]">
                      {symbolLabel(ticker.symbol)}
                    </span>
                    <span className="text-right">
                      {formatUsd(toNumber(ticker.lastPrice))}
                    </span>
                    <span
                      className={`text-right ${
                        change >= 0 ? "price-up" : "price-down"
                      }`}
                    >
                      {formatPct(change)}
                    </span>
                    <span className="text-right text-xs text-[var(--muted)]">
                      {formatUsd(toNumber(ticker.lowPrice))} /{" "}
                      {formatUsd(toNumber(ticker.highPrice))}
                    </span>
                  </div>
                );
              })}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold">Top gainers</p>
              <div className="mt-4 grid gap-3 text-sm">
                {topGainers.map((ticker) => (
                  <div
                    key={ticker.symbol}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2"
                  >
                    <span>{symbolLabel(ticker.symbol)}</span>
                    <span className="price-up">
                      {formatPct(toNumber(ticker.priceChangePercent))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold">Top losers</p>
              <div className="mt-4 grid gap-3 text-sm">
                {topLosers.map((ticker) => (
                  <div
                    key={ticker.symbol}
                    className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2"
                  >
                    <span>{symbolLabel(ticker.symbol)}</span>
                    <span className="price-down">
                      {formatPct(toNumber(ticker.priceChangePercent))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-7xl">
          <div className="panel rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold">USDT spot markets</p>
              <p className="text-xs text-[var(--muted)]">
                Sorted by {sortKey} ({sortDirection})
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                className="input text-sm"
                placeholder="Search symbol"
                aria-label="Search market"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                className="btn btn-ghost text-xs"
                type="button"
                onClick={() => handleSort("volume")}
              >
                Sort volume
              </button>
              <button
                className="btn btn-ghost text-xs"
                type="button"
                onClick={() => handleSort("change")}
              >
                Sort change
              </button>
              <button
                className="btn btn-ghost text-xs"
                type="button"
                onClick={() => handleSort("price")}
              >
                Sort price
              </button>
            </div>
          </div>

          {status === "loading" ? (
            <p className="mt-6 text-sm text-[var(--muted)]">
              Loading live market data...
            </p>
          ) : null}
          {status === "error" ? (
            <p className="mt-6 text-sm text-[var(--danger)]">{error}</p>
          ) : null}

          {status === "ready" ? (
            <div className="mt-4 overflow-x-auto">
              <div className="grid min-w-[760px] gap-2 text-xs text-[var(--muted)]">
                <div className="grid grid-cols-[1.1fr_1fr_1fr_1.2fr_1fr_1.2fr] gap-2 px-3">
                <button
                  type="button"
                  className="text-left"
                  onClick={() => handleSort("symbol")}
                >
                  Pair
                </button>
                <button
                  type="button"
                  className="text-right"
                  onClick={() => handleSort("price")}
                >
                  Last price
                </button>
                <button
                  type="button"
                  className="text-right"
                  onClick={() => handleSort("change")}
                >
                  24h change
                </button>
                <button
                  type="button"
                  className="text-right"
                  onClick={() => handleSort("range")}
                >
                  24h range
                </button>
                <button
                  type="button"
                  className="text-right"
                  onClick={() => handleSort("volume")}
                >
                  24h volume
                </button>
                <span className="text-right">Trend</span>
              </div>
                {visibleTickers.map((ticker) => {
                  const change = toNumber(ticker.priceChangePercent);
                  const sparklineData = sparklines[ticker.symbol];
                  return (
                    <div
                      key={ticker.symbol}
                      className="grid grid-cols-[1.1fr_1fr_1fr_1.2fr_1fr_1.2fr] items-center gap-2 rounded-xl border border-[var(--border)] bg-[rgba(15,21,28,0.7)] px-3 py-2 text-sm"
                    >
                      <span className="text-[var(--text)]">
                        {symbolLabel(ticker.symbol)}
                      </span>
                      <span className="text-right">
                        {formatUsd(toNumber(ticker.lastPrice))}
                      </span>
                      <span
                        className={`text-right font-medium ${
                          change >= 0 ? "price-up" : "price-down"
                        }`}
                      >
                        {formatPct(change)}
                      </span>
                      <span className="text-right text-xs text-[var(--muted)]">
                        {formatUsd(toNumber(ticker.lowPrice))} /{" "}
                        {formatUsd(toNumber(ticker.highPrice))}
                      </span>
                      <span className="text-right text-xs text-[var(--muted)]">
                        {formatCompactUsd(toNumber(ticker.quoteVolume))}
                      </span>
                      <Sparkline data={sparklineData} isUp={change >= 0} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
