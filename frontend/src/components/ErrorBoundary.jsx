import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * ErrorBoundary — catches render-time JS errors anywhere in the subtree.
 * Wrap routes or sections that might throw.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-metric-danger/10 mb-5">
          <AlertTriangle className="w-8 h-8 text-metric-danger" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-400 max-w-md mb-2">
          An unexpected error occurred in this part of the page.
        </p>
        {this.state.error && (
          <code className="block text-xs text-metric-danger/80 bg-canvas-elevated border border-canvas-border rounded-lg px-4 py-2 mb-6 max-w-lg break-words">
            {this.state.error.message}
          </code>
        )}
        <button onClick={this.reset} className="btn-primary">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    );
  }
}
