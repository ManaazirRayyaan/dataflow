import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

import Header from "../components/Header";
import RevenueChart from "../components/charts/RevenueChart";
import { CategoryChart, RegionChart } from "../components/charts/CategoryRegionCharts";
import TopProductsChart from "../components/charts/TopProductsChart";
import ErrorState from "../components/ui/ErrorState";
import { SkeletonChart } from "../components/ui/Skeleton";
import {
  getCategories, getRegions, getRevenue,
  getTopCustomers, getTopProducts,
} from "../services/api";

function SectionCard({ title, subtitle, badge, children, loading, height = "h-56" }) {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>
        {badge && <span className="badge badge-indigo">{badge}</span>}
      </div>
      {loading ? <SkeletonChart height={height} /> : children}
    </div>
  );
}

export default function Analytics() {
  const [revenue,      setRevenue]      = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [regions,      setRegions]      = useState([]);
  const [topProducts,  setTopProducts]  = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [granularity,  setGranularity]  = useState("monthly");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const periods = granularity === "monthly" ? 24 : 60;
      const [rev, cats, regs, prods, custs] = await Promise.all([
        getRevenue(granularity, periods),
        getCategories(),
        getRegions(),
        getTopProducts(10),
        getTopCustomers(10),
      ]);
      setRevenue(rev);
      setCategories(cats);
      setRegions(regs);
      setTopProducts(prods);
      setTopCustomers(custs);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [granularity]);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (error && !loading) {
    return (
      <div className="flex flex-col h-full">
        <Header title="Analytics" subtitle="Deep-dive business intelligence" onRefresh={loadAll} loading={loading} />
        <div className="flex-1 overflow-y-auto"><ErrorState message={error} onRetry={loadAll} /></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Analytics" subtitle="Deep-dive business intelligence" onRefresh={loadAll} loading={loading} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">

        {/* Revenue trend with granularity toggle */}
        <div className="card p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-sm font-semibold text-white">Revenue & Profit Trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {granularity === "monthly" ? "Last 24 months" : "Last 60 days"}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-canvas-elevated border border-canvas-border rounded-lg p-0.5 self-start sm:self-auto">
              {["monthly", "daily"].map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularity(g)}
                  aria-pressed={granularity === g}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    granularity === g ? "bg-brand text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {g.charAt(0).toUpperCase() + g.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {loading ? <SkeletonChart height="h-56" /> : <RevenueChart data={revenue} />}
        </div>

        {/* Category + Region — side by side on lg, stacked on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <SectionCard title="Sales by Category" subtitle="Revenue per category" loading={loading}>
            <CategoryChart data={categories} />
          </SectionCard>
          <SectionCard title="Revenue by Region" subtitle="Geographic distribution" loading={loading}>
            <RegionChart data={regions} />
          </SectionCard>
        </div>

        {/* Top products */}
        <SectionCard title="Top 10 Products" subtitle="By total revenue" badge="Top 10" loading={loading} height="h-64">
          <TopProductsChart data={topProducts} />
        </SectionCard>

        {/* Top customers */}
        <div className="card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-canvas-border">
            <h2 className="text-sm font-semibold text-white">Top 10 Customers</h2>
            <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Highest spending accounts</p>
          </div>
          {loading ? (
            <div className="p-4 sm:p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-8 rounded" />
              ))}
            </div>
          ) : topCustomers.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No customer data yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table min-w-[480px]">
                <thead>
                  <tr>
                    <th>#</th><th>Customer</th><th>Segment</th><th>Orders</th><th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c, idx) => (
                    <tr key={c.customer_name}>
                      <td className="text-slate-500 tabular-nums w-8">{idx + 1}</td>
                      <td className="font-medium text-slate-200">{c.customer_name}</td>
                      <td>
                        <span className={`badge ${
                          c.segment === "Corporate" ? "badge-emerald"
                          : c.segment === "Home Office" ? "badge-amber"
                          : "badge-indigo"}`}>
                          {c.segment}
                        </span>
                      </td>
                      <td className="tabular-nums">{c.total_orders.toLocaleString()}</td>
                      <td className="tabular-nums font-semibold text-brand-light">
                        ${c.total_revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
