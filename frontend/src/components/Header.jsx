import { Menu, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { useSidebar } from "../contexts/SidebarContext";

export default function Header({ title, subtitle, onRefresh, loading }) {
  const { toggleDrawer } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* Main header bar */}
      <header
        className="h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 border-b border-canvas-border bg-canvas-surface/80 backdrop-blur-sm sticky top-0 z-20"
        role="banner"
      >
        {/* Left: hamburger (mobile) + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggleDrawer}
            aria-label="Open navigation menu"
            className="lg:hidden btn-ghost p-2 flex-shrink-0"
          >
            <Menu className="w-4 h-4" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white leading-none truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block truncate">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right: search + refresh + live */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Search — visible on md+, button on mobile */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search…"
              aria-label="Global search"
              className="input w-40 lg:w-48 pl-9 py-1.5 text-xs"
            />
          </div>

          {/* Search icon button on small screens */}
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Toggle search"
            className="md:hidden btn-ghost p-2"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              aria-label="Refresh data"
              disabled={loading}
              className="btn-ghost p-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
            </button>
          )}

          {/* Live indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-canvas-elevated border border-canvas-border"
            aria-label="Live data"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-metric-positive animate-pulse-slow" aria-hidden="true" />
            <span className="text-xs text-slate-400 hidden sm:block">Live</span>
          </div>
        </div>
      </header>

      {/* Mobile search panel (slides down) */}
      {searchOpen && (
        <div className="md:hidden px-4 py-2 border-b border-canvas-border bg-canvas-surface/90 backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search…"
              autoFocus
              aria-label="Global search"
              className="input w-full pl-9 py-1.5 text-xs"
            />
          </div>
        </div>
      )}
    </>
  );
}
