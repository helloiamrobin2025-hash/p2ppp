"use client";

import { useEffect, useMemo, useState } from "react";
import { formatInr, formatQty, formatUsd } from "../../lib/format";

const API_BASE = "https://api.binance.com";
const PRICE_REFRESH_MS = 15000;

const PEOPLE = [
  "Aarav Mehta",
  "Ananya Rao",
  "Rohan Kapoor",
  "Isha Verma",
  "Kabir Nair",
  "Mira Shah",
  "Arjun Patel",
  "Sanya Gupta",
  "Vivaan Singh",
  "Diya Joshi",
  "Nikhil Malhotra",
  "Tara Iyer",
];

const TOKENS = ["USDT", "BTC", "ETH", "BNB", "SOL", "XRP", "ADA"];

type Transaction = {
  id: string;
  name: string;
  pair: string;
  side: "Buy" | "Sell";
  amount: number;
  price: number;
  time: string;
};

const pick = <T,>(values: T[]) =>
  values[Math.floor(Math.random() * values.length)];

const buildTransaction = (
  priceMap: Record<string, number>,
  availableTokens: string[],
  displayCurrency: "INR" | "USD",
): Transaction | null => {
  if (availableTokens.length === 0) return null;
  const side = Math.random() > 0.5 ? "Buy" : "Sell";
  const token = pick(availableTokens);
  const price = priceMap[token];
  if (!price) return null;
  const amount = Math.max(
    0.01,
    Math.random() * (token === "USDT" ? 1200 : 2.5),
  );

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: pick(PEOPLE),
    pair: `${token}/${displayCurrency}`,
    side,
    amount,
    price,
    time: new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
};

export default function TransactionsFeed() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [priceMap, setPriceMap] = useState<Record<string, number>>({});
  const [displayCurrency, setDisplayCurrency] = useState<"INR" | "USD">("INR");

  const availableTokens = useMemo(
    () => TOKENS.filter((token) => priceMap[token] && priceMap[token] > 0),
    [priceMap],
  );

  useEffect(() => {
    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const loadPrices = async () => {
      const symbols = [
        "USDTINR",
        "BTCUSDT",
        "ETHUSDT",
        "BNBUSDT",
        "SOLUSDT",
        "XRPUSDT",
        "ADAUSDT",
      ];

      try {
        const response = await fetch(
          `${API_BASE}/api/v3/ticker/price?symbols=${encodeURIComponent(
            JSON.stringify(symbols),
          )}`,
        );
        if (!response.ok) return;
        const data = (await response.json()) as Array<{
          symbol: string;
          price: string;
        }>;

        const symbolMap = new Map(
          data.map((item) => [item.symbol, Number.parseFloat(item.price)]),
        );

        const usdtInr = symbolMap.get("USDTINR") ?? 0;
        const nextMap: Record<string, number> = {};

        if (usdtInr) {
          nextMap.USDT = usdtInr;
          ["BTC", "ETH", "BNB", "SOL", "XRP", "ADA"].forEach((token) => {
            const tokenPrice = symbolMap.get(`${token}USDT`) ?? 0;
            if (tokenPrice) {
              nextMap[token] = tokenPrice * usdtInr;
            }
          });
          if (!isMounted) return;
          setDisplayCurrency("INR");
          setPriceMap(nextMap);
          return;
        }

        nextMap.USDT = 1;
        ["BTC", "ETH", "BNB", "SOL", "XRP", "ADA"].forEach((token) => {
          const tokenPrice = symbolMap.get(`${token}USDT`) ?? 0;
          if (tokenPrice) {
            nextMap[token] = tokenPrice;
          }
        });

        if (!isMounted) return;
        setDisplayCurrency("USD");
        setPriceMap(nextMap);
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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (availableTokens.length === 0) return;

    setItems((prev) => {
      if (prev.length > 0) return prev;
      const seed = Array.from({ length: 6 })
        .map(() => buildTransaction(priceMap, availableTokens, displayCurrency))
        .filter((item): item is Transaction => Boolean(item));
      return seed;
    });

    const scheduleNext = () => {
      const delay = 1000 + Math.random() * 29000;
      timeoutId = setTimeout(() => {
        setItems((prev) => {
          const nextItem = buildTransaction(
            priceMap,
            availableTokens,
            displayCurrency,
          );
          if (!nextItem) return prev;
          const next = [nextItem, ...prev];
          next.pop();
          return next;
        });
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [availableTokens, displayCurrency, priceMap]);

  const summary = useMemo(() => {
    const buys = items.filter((item) => item.side === "Buy").length;
    return `${buys} buys / ${items.length - buys} sells`;
  }, [items]);

  return (
    <div className="panel rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">Recent transactions</p>
          <p className="text-xs text-[var(--muted)]">
            Live P2P tape in {displayCurrency} · {summary}
          </p>
        </div>
        <span className="chip rounded-full px-3 py-1 text-xs">P2P</span>
      </div>
      <div className="mt-4 overflow-x-auto">
        <div className="grid min-w-[680px] gap-2 text-xs text-[var(--muted)]">
          <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-2 px-3">
            <span>Trader</span>
            <span className="text-right">Pair</span>
            <span className="text-right">Price</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Side</span>
          </div>
          {items.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] px-3 py-3 text-sm">
              Loading live prices...
            </div>
          ) : null}
          {items.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1.2fr_1fr_1fr_1fr_1fr] items-center gap-2 rounded-xl border border-[var(--border)] bg-[rgba(15,21,28,0.7)] px-3 py-2 text-sm"
            >
              <div>
                <p className="text-[var(--text)]">{item.name}</p>
                <p className="text-xs text-[var(--muted)]">{item.time}</p>
              </div>
              <span className="text-right">{item.pair}</span>
              <span className="text-right">
                {displayCurrency === "INR"
                  ? formatInr(item.price)
                  : formatUsd(item.price)}
              </span>
              <span className="text-right">{formatQty(item.amount)}</span>
              <span
                className={`text-right ${
                  item.side === "Buy" ? "price-up" : "price-down"
                }`}
              >
                {item.side}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
