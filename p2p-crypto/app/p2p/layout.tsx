import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "P2P Trading | NexaX Exchange",
  description: "Trade peer-to-peer with verified payment rails and escrow-style settlement.",
};

export default function P2PLayout({ children }: { children: React.ReactNode }) {
  return children;
}
