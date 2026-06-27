import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

// Indigo → emerald → amber → sky palette for categories
const CATEGORY_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#38BDF8", "#F472B6", "#A78BFA"];

const TooltipBox = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-canvas-elevated border border-canvas-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label || payload[0]?.name}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-sm font-semibold" style={{ color: p.color || p.fill }}>
          {p.name || "Revenue"}: ${(p.value || 0).toLocaleString()}
        </p>
      ))}
    </div>
  );
};


// ------------------------------------------------------------------
// Sales by Category — vertical bar chart
// ------------------------------------------------------------------

export function CategoryChart({ data = [], loading = false }) {
  if (loading) return <div className="skeleton w-full h-56 rounded-lg" />;

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-56 text-slate-500 text-sm">
        No category data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
          width={52}
        />
        <Tooltip content={<TooltipBox />} />
        <Bar dataKey="revenue" name="Revenue" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((_, idx) => (
            <Cell key={idx} fill={CATEGORY_COLORS[idx % CATEGORY_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}


// ------------------------------------------------------------------
// Revenue by Region — donut pie chart
// ------------------------------------------------------------------

const REGION_COLORS = ["#6366F1", "#10B981", "#F59E0B", "#38BDF8", "#F472B6"];

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function RegionChart({ data = [], loading = false }) {
  if (loading) return <div className="skeleton w-full h-56 rounded-lg" />;

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-56 text-slate-500 text-sm">
        No region data yet
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width="55%" height={200}>
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="region"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            labelLine={false}
            label={renderCustomLabel}
          >
            {data.map((_, idx) => (
              <Cell key={idx} fill={REGION_COLORS[idx % REGION_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <div className="bg-canvas-elevated border border-canvas-border rounded-lg px-3 py-2 shadow-xl">
                  <p className="text-xs font-semibold text-slate-200">{payload[0].name}</p>
                  <p className="text-sm text-brand-light">${payload[0].value.toLocaleString()}</p>
                </div>
              ) : null
            }
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex-1 space-y-1.5">
        {data.map((d, idx) => (
          <div key={d.region} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: REGION_COLORS[idx % REGION_COLORS.length] }}
            />
            <span className="text-xs text-slate-400 truncate">{d.region}</span>
            <span className="ml-auto text-xs font-medium text-slate-300 tabular-nums">
              ${d.revenue >= 1000 ? `${(d.revenue / 1000).toFixed(0)}k` : d.revenue}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
