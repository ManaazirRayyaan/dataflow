import { useCallback, useEffect, useState } from "react";
import {
  BarChart3, DollarSign, Package, ShoppingCart, TrendingUp, Users,
} from "lucide-react";
import toast from "react-hot-toast";

import Header from "../components/Header";
import KPICard from "../components/KPICard";
import RevenueChart from "../components/charts/RevenueChart";
import { CategoryChart, RegionChart } from "../components/charts/CategoryRegionCharts";
import TopProductsChart from "../components/charts/TopProductsChart";
import ErrorState from "../components/ui/ErrorState";
import { SkeletonChart } from "../components/ui/Skeleton";
import { getDashboard, getRegions, getTopProducts } from "../services/api";

// Lazy region sub-chart (separate component so it fetches independently)
function RegionChartWrapper() {
  const [regions, setRegions] = useState([]);
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    getRegions().then(setRegions).catch(console.error).finally(() => setBusy(false));
  }, []);
  return busy ? <SkeletonChart height="h-48" /> : <RegionChart data={regions} />;
}

export default function Dashboard() {
  const [summary, setSummary]       = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dash, products] = await Promise.all([getDashboard(), getTopProducts(8)]);
      setSummary(dash);
      setTopProducts(products);
    } catch (err) {
      setError(err.message);
      toast.error(`Dashboard error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const kpis = summary ? [
    { label: "Total Revenue",   value: summary.total_revenue,        format: "currency", delta: summary.monthly_growth_pct, icon: DollarSign,  accent: "brand"   },
    { label: "Total Orders",    value: summary.total_orders,         format: "number",                                       icon: ShoppingCart, accent: "emerald" },
    { label: "Customers",       value: summary.total_customers,      format: "number",                                       icon: Users,        accent: "sky"     },
    { label: "Avg Order Value", value: summary.average_order_value,  format: "currency",                                     icon: TrendingUp,   accent: "amber"   },
    { label: "Products",        value: summary.total_products,       format: "number",                                       icon: Package,      accent: "brand"   },
    { label: "Monthly Growth",  value: summary.monthly_growth_pct,   format: "percent",                                      icon: BarChart3,    accent: summary.monthly_growth_pct >= 0 ? "emerald" : "amber" },
  ] : Array(6).fill(null);

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle="Sales analytics overview" onRefresh={loadData} loading={loading} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">

        {error && !loading && <ErrorState message={error} onRetry={loadData} />}

        {/* KPI grid: 1 col → 2 col → 3 col → 6 col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {kpis.map((kpi, i) =>
            kpi
              ? <KPICard key={kpi.label} {...kpi} loading={loading} />
              : <KPICard key={i} label="" loading />
          )}
        </div>

        {/* Top badges */}
        {summary && !loading && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-slate-500">Top performers:</span>
            <span className="badge badge-indigo">📦 {summary.top_category}</span>
            <span className="badge badge-emerald">🌍 {summary.top_region}</span>
          </div>
        )}

        {/* Row 1: Revenue trend (2/3) + Region (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue trend */}
          <div className="lg:col-span-2 card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Revenue & Profit Trend</h2>
                <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Monthly performance</p>
              </div>
              <span className="badge badge-indigo">12 months</span>
            </div>
            {loading
              ? <SkeletonChart height="h-52" />
              : <RevenueChart data={summary?.revenue_trend || []} />
            }
          </div>

          {/* Region donut */}
          <div className="card p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white">Revenue by Region</h2>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Geographic breakdown</p>
            </div>
            {loading ? <SkeletonChart height="h-52" /> : <RegionChartWrapper />}
          </div>
        </div>

        {/* Row 2: Category (1/2) + Top products (1/2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Sales by Category</h2>
            </div>
            {loading
              ? <SkeletonChart height="h-52" />
              : <CategoryChart data={summary?.category_breakdown || []} />
            }
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Top Products</h2>
              <span className="badge badge-indigo">Top 8</span>
            </div>
            {loading
              ? <SkeletonChart height="h-52" />
              : <TopProductsChart data={topProducts} />
            }
          </div>
        </div>

      </div>
    </div>
  );
}
