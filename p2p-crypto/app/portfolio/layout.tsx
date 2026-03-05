import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio | NexaX Exchange",
  description: "Track wallet balances, deposits, and P2P transfer history.",
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
