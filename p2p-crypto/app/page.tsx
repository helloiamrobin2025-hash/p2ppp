import { formatUsd, formatCompactUsd, formatQty, formatPct, toNumber, symbolLabel } from "../lib/format";
import SiteFooter from "./components/site-footer";
import SiteHeader from "./components/site-header";
import TransactionsFeed from "./components/transactions-feed";

export const dynamic = "force-dynamic";

const MARKET_SYMBOLS = [
  "BTCUSDT",
  "ETHUSDT",
  "BNBUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "TONUSDT",
  "AVAXUSDT",
  "LINKUSDT",
];

const PRIMARY_SYMBOL = "ETHUSDT";

const API_BASE = "https://api.binance.com";

type Ticker24h = {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
};

type BookTicker = {
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
};

type DepthLevel = [string, string];

type DepthResponse = {
  bids: DepthLevel[];
  asks: DepthLevel[];
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

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { next: { revalidate: 5 } });
  if (!response.ok) {
    throw new Error(`Binance request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
};

async function fetchMarketData() {
  const tickerUrl = `${API_BASE}/api/v3/ticker/24hr?symbols=${encodeURIComponent(
    JSON.stringify(MARKET_SYMBOLS),
  )}`;
  const [tickers, bookTicker, depth, klines] = await Promise.all([
    fetchJson<Ticker24h[]>(tickerUrl),
    fetchJson<BookTicker>(
      `${API_BASE}/api/v3/ticker/bookTicker?symbol=${PRIMARY_SYMBOL}`,
    ),
    fetchJson<DepthResponse>(
      `${API_BASE}/api/v3/depth?symbol=${PRIMARY_SYMBOL}&limit=10`,
    ),
    fetchJson<Kline[]>(
      `${API_BASE}/api/v3/klines?symbol=${PRIMARY_SYMBOL}&interval=1m&limit=60`,
    ),
  ]);

  const tickerMap = new Map(tickers.map((ticker) => [ticker.symbol, ticker]));
  const primaryTicker = tickerMap.get(PRIMARY_SYMBOL);
  if (!primaryTicker) {
    throw new Error("Primary symbol not available from Binance.");
  }

  const totalVolume = tickers.reduce(
    (sum, ticker) => sum + toNumber(ticker.quoteVolume),
    0,
  );

  const bid = toNumber(bookTicker.bidPrice);
  const ask = toNumber(bookTicker.askPrice);
  const mid = (bid + ask) / 2;
  const spreadPct = mid === 0 ? 0 : ((ask - bid) / mid) * 100;

  const recentCloses = klines
    .slice(-10)
    .map((kline) => toNumber(kline[4]));
  const closeMin = Math.min(...recentCloses);
  const closeMax = Math.max(...recentCloses);
  const closeRange = closeMax - closeMin || 1;
  const chartWidths = recentCloses.map((close) =>
    Math.round(((close - closeMin) / closeRange) * 60 + 30),
  );

  const topAsks = depth.asks.slice(0, 3).map(([price, size]) => ({
    price: toNumber(price),
    size: toNumber(size),
  }));
  const topBids = depth.bids.slice(0, 3).map(([price, size]) => ({
    price: toNumber(price),
    size: toNumber(size),
  }));

  return {
    tickers,
    tickerMap,
    primaryTicker,
    bookTicker,
    totalVolume,
    bid,
    ask,
    mid,
    spreadPct,
    chartWidths,
    topAsks,
    topBids,
  };
}

export default async function Home() {
  let data: Awaited<ReturnType<typeof fetchMarketData>> | null = null;
  try {
    data = await fetchMarketData();
  } catch {
    /* Binance API unreachable (e.g. 451 geo-block) — render fallback */
  }

  if (!data) {
    return (
      <div className="min-h-screen app-bg">
        <SiteHeader />
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Markets temporarily unavailable
            </h1>
            <p className="mt-4 text-base text-[var(--muted)] sm:text-lg">
              Live market data could not be loaded right now. This is usually
              caused by a regional restriction on the data provider. Please try
              again shortly.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a className="btn btn-primary" href="/login">
                Open trading terminal
              </a>
              <a className="btn btn-ghost" href="/markets">View markets</a>
            </div>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }

  const {
    tickerMap,
    primaryTicker,
    bookTicker,
    totalVolume,
    bid,
    ask,
    mid,
    spreadPct,
    chartWidths,
    topAsks,
    topBids,
  } = data;

  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />

      <section className="px-6">
        <div className="mx-auto max-w-7xl">
          <div className="surface grid gap-6 rounded-3xl px-6 py-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="chip rounded-full px-3 py-1 text-xs font-semibold">
                Live markets
              </span>
              <span className="text-xs text-[var(--muted)]">
                {MARKET_SYMBOLS.length} pairs · 24h volume {formatCompactUsd(totalVolume)}
              </span>
            </div>
            <div>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                Trade with the speed of a desk, built for independent pros.
              </h1>
              <p className="mt-4 max-w-xl text-base text-[var(--muted)] sm:text-lg">
                A Binance-grade trading layout with real-time depth, fast order
                routing, and precise risk controls. Web3 look, Web2 stack.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a className="btn btn-primary" href="/login">
                Open trading terminal
              </a>
              <a className="btn btn-ghost" href="/markets">View markets</a>
              <div className="ml-2 text-xs text-[var(--muted-2)]">
                Postgres-backed engine · WebSockets soon
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  label: "Best bid",
                  value: formatUsd(bid),
                  meta: formatQty(toNumber(bookTicker.bidQty)),
                  className: "price-up",
                },
                {
                  label: "Best ask",
                  value: formatUsd(ask),
                  meta: formatQty(toNumber(bookTicker.askQty)),
                  className: "text-[var(--muted)]",
                },
                {
                  label: "24h change",
                  value: formatPct(toNumber(primaryTicker.priceChangePercent)),
                  meta: `${formatUsd(
                    toNumber(primaryTicker.highPrice),
                  )} / ${formatUsd(toNumber(primaryTicker.lowPrice))}`,
                  className:
                    toNumber(primaryTicker.priceChangePercent) >= 0
                      ? "price-up"
                      : "price-down",
                },
              ].map((stat) => (
                <div key={stat.label} className="panel rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    {stat.label}
                  </p>
                  <p className={`mt-2 text-lg font-semibold ${stat.className}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-[var(--muted-2)]">{stat.meta}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="panel rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span>{symbolLabel(PRIMARY_SYMBOL)}</span>
                <span>24h High · Low</span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-semibold">
                    {formatUsd(toNumber(primaryTicker.lastPrice))}
                  </p>
                  <p
                    className={`text-xs ${
                      toNumber(primaryTicker.priceChangePercent) >= 0
                        ? "price-up"
                        : "price-down"
                    }`}
                  >
                    {formatPct(toNumber(primaryTicker.priceChangePercent))} · 1D
                  </p>
                </div>
                <div className="text-right text-xs text-[var(--muted)]">
                  <p>{formatUsd(toNumber(primaryTicker.highPrice))}</p>
                  <p>{formatUsd(toNumber(primaryTicker.lowPrice))}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {chartWidths.map((width, index) => (
                  <div
                    key={`${width}-${index}`}
                    className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]"
                  >
                    <div
                      className="h-full rounded-full bg-[linear-gradient(120deg,var(--accent),var(--accent-2))]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="panel rounded-2xl p-4">
              <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                <span>Order book</span>
                <span>Aggregated depth</span>
              </div>
              <div className="mt-4 grid gap-3 text-xs">
                {topAsks.map((row) => (
                  <div
                    key={`ask-${row.price}`}
                    className="grid grid-cols-3 text-right"
                  >
                    <span className="price-down text-left">
                      {formatUsd(row.price)}
                    </span>
                    <span>{formatQty(row.size)}</span>
                    <span className="text-[var(--muted)]">
                      {formatUsd(row.price * row.size)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-[var(--border)] pt-3 text-center text-xs text-[var(--muted-2)]">
                  Spread {formatPct(spreadPct)} · Mid {formatUsd(mid)}
                </div>
                {topBids.map((row) => (
                  <div
                    key={`bid-${row.price}`}
                    className="grid grid-cols-3 text-right"
                  >
                    <span className="price-up text-left">
                      {formatUsd(row.price)}
                    </span>
                    <span>{formatQty(row.size)}</span>
                    <span className="text-[var(--muted)]">
                      {formatUsd(row.price * row.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="panel rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Market pulse</p>
                <p className="text-xs text-[var(--muted)]">
                  Live USDT leaders by volume
                </p>
              </div>
              <a className="btn btn-ghost text-xs" href="/markets">
                View all markets
              </a>
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="grid min-w-[680px] gap-3 text-sm">
                {MARKET_SYMBOLS.map((symbol) => {
                  const ticker = tickerMap.get(symbol);
                  if (!ticker) return null;
                  const change = toNumber(ticker.priceChangePercent);
                  return (
                    <div
                      key={symbol}
                      className="grid grid-cols-[1.2fr_1fr_1fr_1fr] items-center gap-2 rounded-xl border border-[var(--border)] bg-[rgba(15,21,28,0.7)] px-3 py-2"
                    >
                      <div>
                        <p className="text-[var(--text)]">
                          {symbolLabel(symbol)}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          24h vol {formatCompactUsd(toNumber(ticker.quoteVolume))}
                        </p>
                      </div>
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Risk controls",
              copy: "Granular limits, isolated margin, and auto-deleveraging alerts.",
              note: "Protect capital",
              accent: "bg-[rgba(46,230,166,0.12)] text-[var(--accent)]",
            },
            {
              title: "Fast execution",
              copy: "Optimized matching pipeline with micro-latency UI refresh.",
              note: "Pro-grade speed",
              accent: "bg-[rgba(54,163,255,0.12)] text-[var(--accent-2)]",
            },
            {
              title: "Portfolio view",
              copy: "Track PnL, funding, and open positions across all pairs.",
              note: "Unified risk",
              accent: "bg-[rgba(255,181,71,0.12)] text-[var(--warn)]",
            },
          ].map((card) => (
            <div key={card.title} className="panel rounded-2xl p-5">
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  card.accent
                }`}
              >
                {card.note}
              </span>
              <p className="mt-4 text-lg font-semibold">{card.title}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{card.copy}</p>
              <div className="mt-4 h-1 w-full rounded-full bg-[var(--border)]">
                <div
                  className="h-1 rounded-full bg-[linear-gradient(90deg,var(--accent),transparent)]"
                  style={{ width: "60%" }}
                />
              </div>
            </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="surface grid gap-6 rounded-3xl px-6 py-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              P2P desk
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Local payments with verified counterparties.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
              Choose region-specific rails, confirm the terms, and settle in
              minutes. Built for compliant, high-volume local liquidity.
            </p>
            <div className="mt-5 grid gap-3 text-sm">
              {[
                "Escrow-protected settlement flow",
                "Multi-chain USDT routing",
                "Verified merchant network",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-[var(--border)] px-3 py-2"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              {[
                "USDT",
                "BTC",
                "ETH",
                "BNB",
                "SOL",
                "XRP",
              ].map((token) => (
                <span
                  key={token}
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-[var(--muted)]"
                >
                  {token}
                </span>
              ))}
            </div>
          </div>
          <div className="panel rounded-2xl p-5">
            <p className="text-sm font-semibold">Payment rails</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              {[
                "Bank transfer",
                "UPI",
                "SEPA",
                "PIX",
                "PayNow",
                "PayID",
              ].map((method) => (
                <div
                  key={method}
                  className="rounded-xl border border-[var(--border)] px-3 py-2 text-center"
                >
                  {method}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--border)] px-3 py-3 text-xs text-[var(--muted)]">
              Settlement is internal to NexaX wallets with verified counterparties.
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="surface grid gap-4 rounded-3xl px-6 py-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Secure access
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">
              Safe login defaults for every account.
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Enforce 2FA, lock devices, and protect withdrawals with allowlists
              and session monitoring.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a className="btn btn-primary" href="/security">
                Review security
              </a>
              <a className="btn btn-ghost" href="/login">
                Secure login
              </a>
            </div>
          </div>
          <div className="grid gap-3 text-sm">
            {[
              {
                title: "Authenticator-based 2FA",
                copy: "Require app-based codes on every login.",
              },
              {
                title: "New device approvals",
                copy: "Approve devices and revoke stale sessions fast.",
              },
              {
                title: "Withdrawal allowlists",
                copy: "Restrict transfers to trusted destinations.",
              },
              {
                title: "Session risk alerts",
                copy: "Monitor IP changes and unusual activity.",
              },
            ].map((item) => (
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
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <TransactionsFeed />
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
