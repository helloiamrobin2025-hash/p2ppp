import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account | NexaX Exchange",
  description: "Register for a NexaX Exchange account and start trading.",
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
