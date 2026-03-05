import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KYC Verification | NexaX Exchange",
  description: "Complete identity verification to unlock P2P trading and higher limits.",
};

export default function KycLayout({ children }: { children: React.ReactNode }) {
  return children;
}
