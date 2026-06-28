import Header from "../components/Header";
import DataTable from "../components/DataTable";
import { getOrders } from "../services/api";

const fmt = (v) => v != null
  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v)
  : "—";

const pctBadge = (v) => {
  if (v == null) return "—";
  const pct = (v * 100).toFixed(1);
  const cls = v >= 0.2 ? "badge-emerald" : v >= 0.1 ? "badge-amber" : "badge-red";
  return <span className={`badge ${cls}`}>{pct}%</span>;
};

const COLUMNS = [
  { key: "order_id",      label: "Order ID",    render: (v) => <span className="font-mono text-xs text-slate-300 whitespace-nowrap">{v}</span> },
  { key: "customer_name", label: "Customer",    render: (v) => <span className="whitespace-nowrap">{v || "—"}</span> },
  { key: "product_name",  label: "Product",     render: (v) => <span className="block max-w-[200px] truncate" title={v}>{v}</span> },
  { key: "category",      label: "Category",    render: (v) => <span className="badge badge-indigo whitespace-nowrap">{v || "—"}</span> },
  { key: "quantity",      label: "Qty",          sortable: false },
  { key: "revenue",       label: "Revenue",      render: fmt },
  { key: "profit",        label: "Profit",       render: fmt },
  { key: "profit_margin", label: "Margin",       render: pctBadge },
  { key: "region",        label: "Region",       render: (v) => <span className="badge badge-indigo whitespace-nowrap">{v || "—"}</span> },
  { key: "order_date",    label: "Date",         render: (v) => v ? <span className="whitespace-nowrap">{new Date(v).toLocaleDateString()}</span> : "—" },
];

export default function Orders() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Orders" subtitle="All sales transactions" />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
