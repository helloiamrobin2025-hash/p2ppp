export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center app-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
        <p className="text-sm text-[var(--muted)]">Loading...</p>
      </div>
    </div>
  );
}
