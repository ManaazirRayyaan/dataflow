import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#6366F1", "#818CF8", "#A5B4FC", "#C7D2FE", "#E0E7FF"];

const TooltipBox = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-canvas-elevated border border-canvas-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-slate-200 mb-1 max-w-[180px] truncate">{d.product_name}</p>
      <p className="text-xs text-slate-400">{d.category}</p>
      <p className="text-sm font-bold text-brand-light mt-1">${d.revenue?.toLocaleString()}</p>
      <p className="text-xs text-slate-400">{d.quantity_sold?.toLocaleString()} units sold</p>
    </div>
  );
};

export default function TopProductsChart({ data = [], loading = false }) {
  if (loading) return <div className="skeleton w-full h-64 rounded-lg" />;

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        No product data yet
      </div>
    );
  }

  const formatted = data.slice(0, 8).map((p) => ({
    ...p,
    // Truncate long product names for the axis
    short_name: p.product_name?.length > 22
      ? p.product_name.substring(0, 22) + "…"
      : p.product_name,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={formatted}
        layout="vertical"
        margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
      >
        <XAxis
          type="number"
          tick={{ fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
        />
        <YAxis
          type="category"
          dataKey="short_name"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={130}
        />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
        <Bar dataKey="revenue" name="Revenue" radius={[0, 4, 4, 0]} maxBarSize={16}>
          {formatted.map((_, idx) => (
            <Cell key={idx} fill={COLORS[Math.min(idx, COLORS.length - 1)]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
