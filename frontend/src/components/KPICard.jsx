import { TrendingDown, TrendingUp } from "lucide-react";

function formatValue(value, format) {
  if (value === null || value === undefined) return "—";
  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: value >= 1_000_000 ? "compact" : "standard",
        maximumFractionDigits: 1,
      }).format(value);
    case "number":
      return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
    case "percent":
      return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
    default:
      return String(value);
  }
}

export default function KPICard({
  label,
  value,
  format = "number",
  delta,          // optional number — shown as trend
  icon: Icon,
  accent = "brand",
  loading = false,
}) {
  const accentMap = {
    brand:    { bg: "bg-brand/10",            text: "text-brand-light" },
    emerald:  { bg: "bg-metric-positive/10",  text: "text-metric-positive" },
    amber:    { bg: "bg-metric-warning/10",   text: "text-metric-warning" },
    sky:      { bg: "bg-metric-info/10",      text: "text-metric-info" },
  };

  const { bg, text } = accentMap[accent] || accentMap.brand;
  const isPositive = delta >= 0;

  if (loading) {
    return (
      <div className="card p-5 animate-fade-in">
        <div className="skeleton h-3 w-24 mb-4 rounded" />
        <div className="skeleton h-7 w-32 mb-2 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    );
  }

  return (
    <div className="card-hover p-5 animate-fade-in">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${bg}`}>
            <Icon className={`w-4 h-4 ${text}`} />
          </div>
        )}
      </div>

      {/* Value */}
      <p className={`text-2xl font-bold text-white tabular-nums ${text}`}>
        {formatValue(value, format)}
      </p>

      {/* Delta */}
      {delta !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isPositive ? "text-metric-positive" : "text-metric-danger"}`}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{formatValue(Math.abs(delta), "percent")} vs last month</span>
        </div>
      )}
    </div>
  );
}
