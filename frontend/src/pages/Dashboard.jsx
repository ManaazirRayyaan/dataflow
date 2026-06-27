import { useEffect, useState } from "react";
import {
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";

import Header from "../components/Header";
import KPICard from "../components/KPICard";
import RevenueChart from "../components/charts/RevenueChart";
import { CategoryChart, RegionChart } from "../components/charts/CategoryRegionCharts";
import TopProductsChart from "../components/charts/TopProductsChart";
import { getDashboard, getTopProducts } from "../services/api";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [dash, products] = await Promise.all([
        getDashboard(),
        getTopProducts(8),
      ]);
      setSummary(dash);
      setTopProducts(products);
    } catch (err) {
      toast.error(`Failed to load dashboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const kpis = summary
    ? [
        {
          label: "Total Revenue",
          value: summary.total_revenue,
          format: "currency",
          delta: summary.monthly_growth_pct,
          icon: DollarSign,
          accent: "brand",
        },
        {
          label: "Total Orders",
          value: summary.total_orders,
          format: "number",
          icon: ShoppingCart,
          accent: "emerald",
        },
        {
          label: "Customers",
          value: summary.total_customers,
          format: "number",
          icon: Users,
          accent: "sky",
        },
        {
          label: "Avg Order Value",
          value: summary.average_order_value,
          format: "currency",
          icon: TrendingUp,
          accent: "amber",
        },
        {
          label: "Products",
          value: summary.total_products,
          format: "number",
          icon: Package,
          accent: "brand",
        },
        {
          label: "Monthly Growth",
          value: summary.monthly_growth_pct,
          format: "percent",
          icon: BarChart3,
          accent: summary.monthly_growth_pct >= 0 ? "emerald" : "amber",
        },
      ]
    : Array(6).fill(null);

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Dashboard"
        subtitle="Sales analytics overview"
        onRefresh={loadData}
        loading={loading}
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi, i) =>
            kpi ? (
              <KPICard key={kpi.label} {...kpi} loading={loading} />
            ) : (
              <KPICard key={i} label="" loading={true} />
            )
          )}
        </div>

        {/* Top badges */}
        {summary && !loading && (
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Top performers:</span>
            <span className="badge badge-indigo">
              📦 {summary.top_category}
            </span>
            <span className="badge badge-emerald">
              🌍 {summary.top_region}
            </span>
          </div>
        )}

        {/* Charts — first row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue trend — spans 2 cols */}
          <div className="lg:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Revenue & Profit Trend</h2>
                <p className="text-xs text-slate-500 mt-0.5">Monthly performance</p>
              </div>
              <span className="badge badge-indigo">12 months</span>
            </div>
            <RevenueChart
              data={summary?.revenue_trend || []}
              loading={loading}
            />
          </div>

          {/* Region donut */}
          <div className="card p-5">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-white">Revenue by Region</h2>
              <p className="text-xs text-slate-500 mt-0.5">Geographic breakdown</p>
            </div>
            <RegionChart
              data={summary?.category_breakdown?.length ? [] : []}
              loading={loading}
            />
            {/* Use real region data once loaded */}
            {!loading && summary && (
              <RegionChartWrapper />
            )}
          </div>
        </div>

        {/* Charts — second row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Category bars */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Sales by Category</h2>
                <p className="text-xs text-slate-500 mt-0.5">Revenue breakdown</p>
              </div>
            </div>
            <CategoryChart
              data={summary?.category_breakdown || []}
              loading={loading}
            />
          </div>

          {/* Top products */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Top Products</h2>
                <p className="text-xs text-slate-500 mt-0.5">By revenue</p>
              </div>
              <span className="badge badge-indigo">Top 8</span>
            </div>
            <TopProductsChart data={topProducts} loading={loading} />
          </div>
        </div>

      </div>
    </div>
  );
}

// Lazy region chart that fetches its own data
import { getRegions } from "../services/api";

function RegionChartWrapper() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRegions()
      .then(setRegions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return <RegionChart data={regions} loading={loading} />;
}
