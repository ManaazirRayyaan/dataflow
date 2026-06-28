import Header from "../components/Header";
import DataTable from "../components/DataTable";
import { getProducts } from "../services/api";

const fmt   = (v) => v != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(v) : "—";
const fmtC  = (v) => v != null ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(v) : "—";

const catBadge = (cat) => {
  const map = { Technology: "badge-indigo", Furniture: "badge-amber", "Office Supplies": "badge-emerald" };
  return <span className={`badge whitespace-nowrap ${map[cat] || "badge-indigo"}`}>{cat || "—"}</span>;
};

const COLUMNS = [
  { key: "name",          label: "Product",      render: (v) => <span className="block max-w-[240px] truncate text-slate-200" title={v}>{v}</span> },
  { key: "category",      label: "Category",     render: catBadge },
  { key: "sub_category",  label: "Sub-cat",      render: (v) => <span className="whitespace-nowrap">{v || "—"}</span> },
  { key: "unit_price",    label: "Unit Price",   render: fmt },
  { key: "total_sold",    label: "Units Sold",   render: (v) => <span className="tabular-nums">{(v ?? 0).toLocaleString()}</span> },
  { key: "total_revenue", label: "Revenue",      render: fmtC },
];

export default function Products() {
  return (
    <div className="flex flex-col h-full">
      <Header title="Products" subtitle="Product catalogue and sales performance" />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <DataTable
          columns={COLUMNS}
          fetchFn={getProducts}
          searchPlaceholder="Search by product name…"
          rowKey="id"
        />
      </div>
    </div>
  );
}
