import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-canvas-elevated border border-canvas-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: ${p.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function RevenueChart({ data = [], loading = false }) {
  if (loading) {
    return <div className="skeleton w-full h-64 rounded-lg" />;
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm">
        Upload a dataset to see revenue trends
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="period"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="#6366F1"
          strokeWidth={2}
          fill="url(#revGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#6366F1" }}
        />
        <Area
          type="monotone"
          dataKey="profit"
          name="Profit"
          stroke="#10B981"
          strokeWidth={2}
          fill="url(#profitGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#10B981" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
