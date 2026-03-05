import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center app-bg px-6 text-center">
      <div className="surface mx-auto max-w-md rounded-3xl px-8 py-12">
        <p className="text-6xl font-semibold text-[var(--accent)]">404</p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link className="btn btn-primary text-sm" href="/">
            Back to home
          </Link>
          <Link className="btn btn-ghost text-sm" href="/support">
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
