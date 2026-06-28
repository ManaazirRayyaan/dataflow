/**
 * Skeleton loading components.
 * Drop-in replacements for the actual UI while API calls are pending.
 */

// ── Primitives ────────────────────────────────────────────────────

export function SkeletonLine({ className = "" }) {
  return <div className={`skeleton rounded ${className}`} aria-hidden="true" />;
}

// ── KPI card skeleton ─────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className="card p-5" aria-hidden="true" role="presentation">
      <SkeletonLine className="h-3 w-24 mb-4" />
      <SkeletonLine className="h-7 w-32 mb-2" />
      <SkeletonLine className="h-3 w-16" />
    </div>
  );
}

// ── Chart area skeleton ───────────────────────────────────────────

export function SkeletonChart({ height = "h-56" }) {
  return (
    <div className={`skeleton rounded-lg w-full ${height}`} aria-hidden="true" role="presentation" />
  );
}

// ── Table skeleton ────────────────────────────────────────────────

export function SkeletonTable({ rows = 8, cols = 5 }) {
  return (
    <div className="card overflow-hidden" aria-hidden="true" role="presentation">
      {/* Toolbar */}
      <div className="p-4 border-b border-canvas-border">
        <SkeletonLine className="h-8 w-48" />
      </div>
      {/* Rows */}
      <div className="divide-y divide-canvas-border">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonLine key={c} className={`h-3 flex-1 ${c === 0 ? "max-w-[100px]" : "max-w-[140px]"}`} />
            ))}
          </div>
        ))}
      </div>
      {/* Pagination */}
      <div className="p-4 border-t border-canvas-border flex justify-between">
        <SkeletonLine className="h-3 w-20" />
        <SkeletonLine className="h-6 w-32" />
      </div>
    </div>
  );
}
