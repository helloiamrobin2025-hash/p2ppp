import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="px-6 pb-10">
      <div className="panel mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 rounded-2xl px-6 py-4 text-sm text-[var(--muted)]">
        <p className="text-xs">NexaX Exchange · Global spot markets</p>
        <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
          <Link href="/support" className="hover:text-[var(--text)]">
            Support
          </Link>
          <Link
            href="/privacy-policy"
            className="hover:text-[var(--text)]"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="hover:text-[var(--text)]"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
