import { createContext, useCallback, useContext, useEffect, useState } from "react";

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  // Desktop: icon-only collapsed mode (persisted)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try { return localStorage.getItem("df-sidebar-collapsed") === "true"; }
    catch { return false; }
  });

  // Mobile: slide-in drawer visibility
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("df-sidebar-collapsed", String(next)); } catch {}
      return next;
    });
  }, []);

  const openDrawer  = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((p) => !p), []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isDrawerOpen]);

  // Close drawer on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setIsDrawerOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, isDrawerOpen, toggleCollapsed, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within <SidebarProvider>");
  return ctx;
};
