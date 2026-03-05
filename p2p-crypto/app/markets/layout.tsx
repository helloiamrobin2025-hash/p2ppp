import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markets | NexaX Exchange",
  description: "Live USDT spot markets with price, volume, and trend analytics.",
};

export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
