import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart3, ChevronLeft, ChevronRight, Database,
  LayoutDashboard, Menu, Package, ShoppingCart,
  Upload, Users, X, Zap,
} from "lucide-react";
import { useSidebar } from "../contexts/SidebarContext";

const navItems = [
  { to: "/",          label: "Dashboard",  icon: LayoutDashboard },
  { to: "/orders",    label: "Orders",     icon: ShoppingCart },
  { to: "/customers", label: "Customers",  icon: Users },
  { to: "/products",  label: "Products",   icon: Package },
  { to: "/analytics", label: "Analytics",  icon: BarChart3 },
  { to: "/upload",    label: "Upload",     icon: Upload },
];

// ── Shared nav link list ──────────────────────────────────────────
function NavItems({ collapsed, onNavigate }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
      {!collapsed && (
        <p className="px-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
          Main
        </p>
      )}
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          aria-label={label}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
             transition-all duration-150 group relative
             ${isActive
               ? "bg-brand/15 text-brand-light border border-brand/20"
               : "text-slate-400 hover:bg-canvas-elevated hover:text-slate-200"
             }
             ${collapsed ? "justify-center px-0" : ""}`
          }
        >
          <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          {!collapsed && <span>{label}</span>}
          {/* Tooltip for collapsed desktop */}
          {collapsed && (
            <span className="
              absolute left-full ml-2 px-2 py-1 rounded-md
              bg-canvas-elevated border border-canvas-border
              text-xs text-slate-200 whitespace-nowrap
              opacity-0 pointer-events-none
              group-hover:opacity-100
              transition-opacity duration-150 z-50
            ">
              {label}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

// ── Desktop sidebar ───────────────────────────────────────────────
function DesktopSidebar() {
  const { isCollapsed, toggleCollapsed } = useSidebar();

  return (
    <aside
      className={`
        hidden lg:flex flex-col fixed inset-y-0 left-0 z-30
        bg-canvas-surface border-r border-canvas-border
        transition-[width] duration-200 ease-in-out overflow-hidden
        ${isCollapsed ? "w-16" : "w-56"}
      `}
      aria-label="Sidebar"
    >
      {/* Logo row */}
      <div className={`h-16 flex items-center border-b border-canvas-border flex-shrink-0 ${isCollapsed ? "justify-center px-2" : "gap-2.5 px-5"}`}>
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand/20 flex-shrink-0">
          <Zap className="w-4 h-4 text-brand" aria-hidden="true" />
        </div>
        {!isCollapsed && (
          <>
            <span className="text-sm font-semibold text-white tracking-tight">DataFlow</span>
            <span className="ml-auto badge badge-indigo">v1</span>
          </>
        )}
      </div>

      <NavItems collapsed={isCollapsed} />

      {/* Footer */}
      <div className={`border-t border-canvas-border flex-shrink-0 ${isCollapsed ? "p-3" : "p-4"}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2 px-2">
            <Database className="w-3.5 h-3.5 text-metric-positive flex-shrink-0" aria-hidden="true" />
            <span className="text-xs text-slate-500">PostgreSQL connected</span>
          </div>
        ) : (
          <div className="flex justify-center" title="PostgreSQL connected">
            <Database className="w-3.5 h-3.5 text-metric-positive" aria-hidden="true" />
          </div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`
            mt-3 flex items-center justify-center rounded-lg
            w-full py-1.5 text-slate-500 hover:text-slate-300
            hover:bg-canvas-elevated transition-colors duration-150
          `}
        >
          {isCollapsed
            ? <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            : <ChevronLeft  className="w-3.5 h-3.5" aria-hidden="true" />
          }
        </button>
      </div>
    </aside>
  );
}

// ── Mobile drawer ─────────────────────────────────────────────────
function MobileDrawer() {
  const { isDrawerOpen, closeDrawer } = useSidebar();
  const drawerRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!isDrawerOpen) return;
    const handler = (e) => { if (e.key === "Escape") closeDrawer(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isDrawerOpen, closeDrawer]);

  // Trap focus inside drawer
  useEffect(() => {
    if (isDrawerOpen) drawerRef.current?.focus();
  }, [isDrawerOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden
          transition-opacity duration-200
          ${isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* Drawer panel */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        aria-label="Mobile navigation"
        role="dialog"
        aria-modal="true"
        className={`
          fixed inset-y-0 left-0 z-50 w-64 lg:hidden
          bg-canvas-surface border-r border-canvas-border
          flex flex-col
          transition-transform duration-250 ease-in-out
          ${isDrawerOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Drawer header */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-canvas-border flex-shrink-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-brand/20">
            <Zap className="w-4 h-4 text-brand" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold text-white tracking-tight">DataFlow</span>
          <span className="ml-auto badge badge-indigo">v1</span>
          <button
            onClick={closeDrawer}
            aria-label="Close menu"
            className="ml-1 btn-ghost p-1"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <NavItems collapsed={false} onNavigate={closeDrawer} />

        <div className="p-4 border-t border-canvas-border flex-shrink-0">
          <div className="flex items-center gap-2 px-2">
            <Database className="w-3.5 h-3.5 text-metric-positive" aria-hidden="true" />
            <span className="text-xs text-slate-500">PostgreSQL connected</span>
          </div>
        </div>
      </aside>
    </>
  );
}

// ── Public export ─────────────────────────────────────────────────
export default function Sidebar() {
  return (
    <>
      <DesktopSidebar />
      <MobileDrawer />
    </>
  );
}
