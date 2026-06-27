import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar />
      <main className="flex-1 ml-56 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
