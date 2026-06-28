import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AppLayout from "./layouts/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Analytics from "./pages/Analytics";
import Upload from "./pages/Upload";
import NotFound from "./pages/NotFound";

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
            maxWidth: "360px",
          },
          success: { iconTheme: { primary: "#10B981", secondary: "#1A2235" } },
          error:   { iconTheme: { primary: "#EF4444", secondary: "#1A2235" } },
          duration: 4000,
        }}
      />

      <ErrorBoundary>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={
              <ErrorBoundary><Dashboard /></ErrorBoundary>
            } />
            <Route path="/orders" element={
              <ErrorBoundary><Orders /></ErrorBoundary>
            } />
            <Route path="/customers" element={
              <ErrorBoundary><Customers /></ErrorBoundary>
            } />
            <Route path="/products" element={
              <ErrorBoundary><Products /></ErrorBoundary>
            } />
            <Route path="/analytics" element={
              <ErrorBoundary><Analytics /></ErrorBoundary>
            } />
            <Route path="/upload" element={
              <ErrorBoundary><Upload /></ErrorBoundary>
            } />
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
