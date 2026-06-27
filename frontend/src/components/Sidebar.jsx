import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Database,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Upload,
  Users,
  Zap,
} from "lucide-react";

const navItems = [
  { to: "/",          label: "Dashboard",  icon: LayoutDashboard },
  { to: "/orders",    label: "Orders",     icon: ShoppingCart },
  { to: "/customers", label: "Customers",  icon: Users },
  { to: "/products",  label: "Products",   icon: Package },
  { to: "/analytics", label: "Analytics",  icon: BarChart3 },
  { to: "/upload",    label: "Upload",     icon: Upload },
];

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-canvas-surface border-r border-canvas-border z-30 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-canvas-border">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand/20">
          <Zap className="w-4 h-4 text-brand" />
        </div>
        <span className="text-sm font-semibold text-white tracking-tight">
          DataFlow
        </span>
        <span className="ml-auto badge badge-indigo">v1</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Main
        </p>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-brand/15 text-brand-light border border-brand/20"
                  : "text-slate-400 hover:bg-canvas-elevated hover:text-slate-200"
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-canvas-border">
        <div className="flex items-center gap-2 px-2">
          <Database className="w-3.5 h-3.5 text-metric-positive" />
          <span className="text-xs text-slate-500">PostgreSQL connected</span>
        </div>
      </div>
    </aside>
  );
}
