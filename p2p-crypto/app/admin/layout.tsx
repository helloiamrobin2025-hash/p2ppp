import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Console | NexaX Exchange",
  description: "Admin controls for KYC, deposits, and wallet balances.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
