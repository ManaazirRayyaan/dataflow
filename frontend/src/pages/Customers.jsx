import Header from "../components/Header";
import DataTable from "../components/DataTable";
import { getCustomers } from "../services/api";

const fmtCompact = (v) => v != null
  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v)
  : "—";

const segBadge = (seg) => {
  const map = { Consumer: "badge-indigo", Corporate: "badge-emerald", "Home Office": "badge-amber" };
  return <span className={`badge whitespace-nowrap ${map[seg] || "badge-indigo"}`}>{seg || "—"}</span>;
};

const COLUMNS = [
  { key: "name",          label: "Customer",     render: (v) => <span className="whitespace-nowrap font-medium text-slate-200">{v}</span> },
  { key: "city",          label: "City" },
  { key: "state",         label: "State" },
  { key: "segment",       label: "Segment",      render: segBadge },
  { key: "total_orders",  label: "Orders",       render: (v) => <span className="tabular-nums">{v ?? "—"}</span> },
  { key: "total_revenue", label: "Total Revenue",render: fmtCompact },
];

export default function Customers() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Customers" subtitle="Customer accounts and order history" />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <DataTable
          columns={COLUMNS}
          fetchFn={getCustomers}
          searchPlaceholder="Search by name, city, or state…"
          rowKey="id"
        />
      </div>
    </div>
  );
}
