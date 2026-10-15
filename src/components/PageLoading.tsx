export function PageLoading() {
  return (
    <div className="container-page py-10" role="status" aria-live="polite">
      <div className="mb-6 h-8 w-56 animate-pulse rounded-full bg-surface-muted" />
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-[var(--radius-card)] bg-surface-muted" />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
