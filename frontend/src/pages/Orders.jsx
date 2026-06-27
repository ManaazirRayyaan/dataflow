import Header from "../components/Header";
import DataTable from "../components/DataTable";
import { getOrders } from "../services/api";

const fmt = (v) =>
  v != null
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(v)
    : "—";

const pctBadge = (v) => {
  if (v == null) return "—";
  const pct = (v * 100).toFixed(1);
  const cls = v >= 0.2 ? "badge-emerald" : v >= 0.1 ? "badge-amber" : "badge-red";
  return <span className={`badge ${cls}`}>{pct}%</span>;
};

const regionBadge = (region) => (
  <span className="badge badge-indigo">{region || "—"}</span>
);

const COLUMNS = [
  { key: "order_id",       label: "Order ID",    render: (v) => <span className="font-mono text-xs text-slate-300">{v}</span> },
  { key: "customer_name",  label: "Customer"  },
  { key: "product_name",   label: "Product",     render: (v) => <span className="text-slate-200 max-w-[200px] truncate block" title={v}>{v}</span> },
  { key: "category",       label: "Category",    render: (v) => <span className="badge badge-indigo">{v || "—"}</span> },
  { key: "quantity",       label: "Qty",          sortable: false },
  { key: "revenue",        label: "Revenue",      render: fmt },
  { key: "profit",         label: "Profit",       render: fmt },
  { key: "profit_margin",  label: "Margin",       render: pctBadge },
  { key: "region",         label: "Region",       render: regionBadge },
  { key: "order_date",     label: "Date",         render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
];

export default function Orders() {
  return (
    <div className="flex flex-col h-full">
      <Header
        title="Orders"
        subtitle="All sales transactions"
      />
      <div className="flex-1 overflow-y-auto p-6">
        <DataTable
          columns={COLUMNS}
          fetchFn={getOrders}
          searchPlaceholder="Search by order ID or customer…"
          rowKey="id"
        />
      </div>
    </div>
  );
}
