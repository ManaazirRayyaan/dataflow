import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * ErrorState — shown when an API call fails.
 * Replaces the blank screen with a clear message + retry.
 */
export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-metric-danger/10 mb-4">
        <AlertTriangle className="w-7 h-7 text-metric-danger" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-white mb-1">Failed to load data</h2>
      <p className="text-sm text-slate-400 max-w-sm mb-6">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-primary">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );
}
