import { Link } from "react-router-dom";
import { Home, Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-canvas px-6 text-center">
      {/* Logo */}
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand/20 mb-8">
        <Zap className="w-6 h-6 text-brand" aria-hidden="true" />
      </div>

      {/* 404 */}
      <p className="text-8xl font-extrabold text-brand/20 tabular-nums mb-2 select-none">404</p>
      <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-sm text-slate-400 max-w-sm mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <Link to="/" className="btn-primary">
        <Home className="w-4 h-4" aria-hidden="true" />
        Back to Dashboard
      </Link>
    </div>
  );
}
