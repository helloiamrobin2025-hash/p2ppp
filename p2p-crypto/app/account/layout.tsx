import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account | NexaX Exchange",
  description: "Manage your NexaX Exchange profile, KYC, and security settings.",
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return children;
}
