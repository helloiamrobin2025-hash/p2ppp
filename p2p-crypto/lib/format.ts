/**
 * Shared formatting utilities used across the application.
 * Centralised here to avoid duplicating helpers in every page component.
 */

export const toNumber = (value: string) => Number.parseFloat(value);

export const formatUsd = (value: number) => {
  const decimals = value >= 1 ? 2 : 4;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatCompactUsd = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);

export const formatQty = (value: number, maxDigits = 4) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: maxDigits,
  }).format(value);

export const formatQtyInr = (value: number, maxDigits = 4) =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: maxDigits,
  }).format(value);

export const formatPct = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

export const formatInr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const symbolLabel = (symbol: string) =>
  symbol.replace("USDT", "/USDT");
