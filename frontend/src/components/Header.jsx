import { Search, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function Header({ title, subtitle, onRefresh, loading }) {
  const [query, setQuery] = useState("");

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-canvas-border bg-canvas-surface/80 backdrop-blur-sm sticky top-0 z-20">
      <div>
        <h1 className="text-sm font-semibold text-white leading-none">{title}</h1>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Global search — decorative, wire up with useNavigate if needed */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input w-48 pl-9 py-1.5 text-xs"
          />
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn-ghost"
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        )}

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-canvas-elevated border border-canvas-border">
          <span className="w-1.5 h-1.5 rounded-full bg-metric-positive animate-pulse-slow" />
          <span className="text-xs text-slate-400 hidden sm:block">Live</span>
        </div>
      </div>
    </header>
  );
}
