import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In | NexaX Exchange",
  description: "Sign in to your NexaX Exchange trading workspace.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
