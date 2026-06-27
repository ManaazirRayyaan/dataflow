import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Analytics from "./pages/Analytics";
import Upload from "./pages/Upload";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1A2235",
            color: "#e2e8f0",
            border: "1px solid #1E2D3D",
            fontSize: "13px",
          },
          success: { iconTheme: { primary: "#10B981", secondary: "#1A2235" } },
          error:   { iconTheme: { primary: "#EF4444", secondary: "#1A2235" } },
        }}
      />

      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="/orders"    element={<Orders />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/products"  element={<Products />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/upload"    element={<Upload />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
