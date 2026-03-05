import type { Metadata } from "next";
import SiteFooter from "../components/site-footer";
import SiteHeader from "../components/site-header";

export const metadata: Metadata = {
  title: "Fees | NexaX Exchange",
  description: "Transparent maker/taker fee tiers with volume-based discounts for spot and P2P trading.",
};

export default function FeesPage() {
  return (
    <div className="min-h-screen app-bg">
      <SiteHeader />
      <section className="px-6">
        <div className="mx-auto max-w-7xl">
          <div className="surface grid gap-6 rounded-3xl px-6 py-8 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
              Fees
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Transparent pricing with volume-based tiers.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[var(--muted)]">
              Maker and taker fees scale with 30-day volume. All fees are
              displayed per market with clear settlement rules.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { label: "Base maker", value: "0.10%" },
                { label: "Base taker", value: "0.10%" },
                { label: "VIP 1", value: "0.08%" },
              ].map((stat) => (
                <div key={stat.label} className="panel rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold">{stat.value}</p>
                  <p className="text-xs text-[var(--muted-2)]">Spot only</p>
                </div>
              ))}
            </div>
          </div>
          <div className="panel rounded-2xl p-5">
            <p className="text-sm font-semibold">Fee overview</p>
            <div className="mt-4 grid gap-3 text-sm">
              {[
                "Spot maker/taker",
                "P2P settlement",
                "Deposit and withdrawal",
                "VIP volume tiers",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-[var(--border)] px-3 py-2"
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--border)] px-3 py-3 text-xs text-[var(--muted)]">
              Fees shown here are indicative. Final pricing depends on tier and
              instrument.
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="panel rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Spot fee schedule</p>
                <p className="text-xs text-[var(--muted)]">
                  30-day volume tiers
                </p>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <div className="grid min-w-[640px] gap-2 text-xs text-[var(--muted)]">
                <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr] gap-2 px-3">
                <span>Tier</span>
                <span className="text-right">30d volume</span>
                <span className="text-right">Maker</span>
                <span className="text-right">Taker</span>
                </div>
                {[
                  { tier: "Base", volume: "<$1M", maker: "0.10%", taker: "0.10%" },
                  { tier: "VIP 1", volume: "$1M+", maker: "0.08%", taker: "0.09%" },
                  { tier: "VIP 2", volume: "$10M+", maker: "0.06%", taker: "0.08%" },
                  { tier: "VIP 3", volume: "$50M+", maker: "0.04%", taker: "0.06%" },
                ].map((row) => (
                  <div
                    key={row.tier}
                    className="grid grid-cols-[1.3fr_1fr_1fr_1fr] items-center gap-2 rounded-xl border border-[var(--border)] bg-[rgba(15,21,28,0.7)] px-3 py-2 text-sm"
                  >
                    <span className="text-[var(--text)]">{row.tier}</span>
                    <span className="text-right text-xs text-[var(--muted)]">
                      {row.volume}
                    </span>
                    <span className="text-right">{row.maker}</span>
                    <span className="text-right">{row.taker}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel rounded-2xl p-6">
            <p className="text-sm font-semibold">Fee calculator</p>
            <p className="text-xs text-[var(--muted)]">
              Estimate spot fees before execution
            </p>
            <div className="mt-4 grid gap-3 text-sm">
              <div className="grid gap-2">
                <label className="input-label" htmlFor="fee-pair">
                  Pair
                </label>
                <input
                  id="fee-pair"
                  className="input"
                  defaultValue="ETH/USDT"
                />
              </div>
              <div className="grid gap-2">
                <label className="input-label" htmlFor="fee-volume">
                  30d volume
                </label>
                <input
                  id="fee-volume"
                  className="input"
                  defaultValue="$1,200,000"
                />
              </div>
              <div className="grid gap-2">
                <label className="input-label" htmlFor="fee-size">
                  Order size
                </label>
                <input id="fee-size" className="input" defaultValue="$25,000" />
              </div>
              <div className="rounded-xl border border-[var(--border)] px-3 py-3 text-xs text-[var(--muted)]">
                Estimated fee: <span className="text-[var(--text)]">$22.50</span>
              </div>
              <p className="text-xs text-[var(--muted-2)]">
                Actual fees update with tier and order type.
              </p>
            </div>
          </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-3">
          {[
            {
              title: "Deposits",
              copy: "Most deposits settle with zero platform fees.",
            },
            {
              title: "Withdrawals",
              copy: "Network fees vary by chain and congestion.",
            },
            {
              title: "P2P settlement",
              copy: "Fee-free for verified counterparties on supported rails.",
            },
          ].map((card) => (
            <div key={card.title} className="panel rounded-2xl p-5">
              <p className="text-sm font-semibold">{card.title}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{card.copy}</p>
            </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
