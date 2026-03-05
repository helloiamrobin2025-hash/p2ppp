"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

const NAV_ITEMS = [
  { label: "Markets", href: "/markets" },
  { label: "P2P", href: "/p2p" },
  { label: "Fees", href: "/fees" },
  { label: "Portfolio", href: "/portfolio" },
  { label: "Support", href: "/support" },
  { label: "Security", href: "/security" },
];

export default function SiteHeader() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (!isMounted) return;
      setUserEmail(data.user?.email ?? null);
    };

    void loadUser();
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user?.email ?? null);
      },
    );

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setIsAccountOpen(false);
    setIsMenuOpen(false);
    router.push("/");
  };

  const accountInitial = userEmail?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="px-6 py-5">
      <div className="surface mx-auto flex max-w-7xl items-center justify-between gap-6 rounded-2xl px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(46,230,166,0.12)] text-lg font-semibold text-[var(--accent)]">
            NX
          </div>
          <div>
            <p className="text-sm font-semibold tracking-wide">NexaX Exchange</p>
            <p className="text-xs text-[var(--muted)]">Spot markets</p>
          </div>
        </div>
        <nav className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[rgba(10,15,20,0.7)] px-2 py-2 text-xs text-[var(--muted)] md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-1.5 transition-all hover:bg-[rgba(46,230,166,0.12)] hover:text-[var(--text)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="relative hidden items-center gap-3 md:flex">
          {userEmail ? (
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-3 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs"
                onClick={() => setIsAccountOpen((open) => !open)}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(46,230,166,0.12)] text-[var(--accent)]">
                  {accountInitial}
                </span>
                <span className="text-[var(--muted)]">{userEmail}</span>
              </button>
              {isAccountOpen ? (
                <div className="absolute right-0 mt-3 w-56 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-3 text-sm">
                  <Link
                    className="block rounded-xl px-3 py-2 hover:bg-[rgba(46,230,166,0.12)]"
                    href="/account"
                    onClick={() => setIsAccountOpen(false)}
                  >
                    Account center
                  </Link>
                  <Link
                    className="block rounded-xl px-3 py-2 hover:bg-[rgba(46,230,166,0.12)]"
                    href="/kyc"
                    onClick={() => setIsAccountOpen(false)}
                  >
                    KYC status
                  </Link>
                  <Link
                    className="block rounded-xl px-3 py-2 hover:bg-[rgba(46,230,166,0.12)]"
                    href="/portfolio"
                    onClick={() => setIsAccountOpen(false)}
                  >
                    Wallets & balances
                  </Link>
                  <button
                    type="button"
                    className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-left text-[var(--danger)]"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Link className="btn btn-ghost text-sm" href="/login">
                Log in
              </Link>
              <Link className="btn btn-primary text-sm" href="/signup">
                Create account
              </Link>
            </>
          )}
        </div>
        <button
          className="btn btn-ghost flex items-center gap-2 text-sm md:hidden"
          type="button"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
        >
          <span className="h-0.5 w-5 rounded-full bg-[var(--text)]" />
          <span className="h-0.5 w-5 rounded-full bg-[var(--text)]" />
        </button>
      </div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden">
          <div className="absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-[var(--panel-strong)] p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">NexaX Menu</p>
              <button
                type="button"
                className="btn btn-ghost text-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="mt-6 grid gap-2 text-sm">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl border border-[var(--border)] px-4 py-3"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 grid gap-3">
              {userEmail ? (
                <>
                  <Link
                    className="btn btn-ghost text-sm"
                    href="/account"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Account center
                  </Link>
                  <Link
                    className="btn btn-ghost text-sm"
                    href="/kyc"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    KYC status
                  </Link>
                  <button
                    type="button"
                    className="btn btn-primary text-sm"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link className="btn btn-ghost text-sm" href="/login">
                    Log in
                  </Link>
                  <Link className="btn btn-primary text-sm" href="/signup">
                    Create account
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
