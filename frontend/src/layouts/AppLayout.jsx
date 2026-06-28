import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { SidebarProvider, useSidebar } from "../contexts/SidebarContext";

function LayoutInner() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar />
      {/*
        Main content. On mobile: no left margin (drawer overlays).
        On desktop: matches sidebar width with smooth transition.
      */}
      <main
        id="main-content"
        className={[
          "flex-1 flex flex-col min-w-0 overflow-hidden",
          "transition-[margin-left] duration-200 ease-in-out",
          // On lg+: offset tracks sidebar width
          isCollapsed ? "lg:ml-16" : "lg:ml-56",
        ].join(" ")}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
