/**
 * DataFlow API Service
 * ====================
 * All HTTP calls go through this module.
 * Swap VITE_API_URL in .env to point at any backend.
 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "https://dataflow.manaazirrayyaan.in";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// ── Response interceptor — normalize errors ──────────────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      "An unexpected error occurred";
    return Promise.reject(new Error(message));
  }
);


// ==================================================================
// Dashboard
// ==================================================================

export const getDashboard = () => api.get("/api/dashboard");


// ==================================================================
// Analytics
// ==================================================================

export const getRevenue = (granularity = "monthly", periods = 12) =>
  api.get("/api/analytics/revenue", { params: { granularity, periods } });

export const getCategories = () => api.get("/api/analytics/categories");

export const getRegions = () => api.get("/api/analytics/regions");

export const getTopProducts = (limit = 10) =>
  api.get("/api/analytics/top-products", { params: { limit } });

export const getTopCustomers = (limit = 10) =>
  api.get("/api/analytics/top-customers", { params: { limit } });


// ==================================================================
// Orders
// ==================================================================

export const getOrders = (params = {}) => api.get("/api/orders", { params });

export const getOrder = (orderId) => api.get(`/api/orders/${orderId}`);


// ==================================================================
// Customers
// ==================================================================

export const getCustomers = (params = {}) => api.get("/api/customers", { params });


// ==================================================================
// Products
// ==================================================================

export const getProducts = (params = {}) => api.get("/api/products", { params });


// ==================================================================
// Upload
// ==================================================================

export const uploadDataset = (file, onProgress) => {
  const formData = new FormData();
  formData.append("file", file);

  return api.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (onProgress && progressEvent.total) {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(pct);
      }
    },
  });
};

export const getUploadHistory = (page = 1, pageSize = 20) =>
  api.get("/api/upload/history", { params: { page, page_size: pageSize } });
