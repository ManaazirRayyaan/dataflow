import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from "lucide-react";
import { useEffect, useState } from "react";

function SortIcon({ column, sortBy, sortDir }) {
  if (sortBy !== column) return <ChevronUp className="w-3 h-3 opacity-20" />;
  return sortDir === "asc" ? (
    <ChevronUp className="w-3 h-3 text-brand" />
  ) : (
    <ChevronDown className="w-3 h-3 text-brand" />
  );
}

export default function DataTable({
  columns,        // [{ key, label, sortable?, render? }]
  fetchFn,        // async (params) => { items, total, pages }
  searchPlaceholder = "Search…",
  extraFilters,   // optional JSX for additional filter controls
  rowKey = "id",
}) {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(columns[0]?.key || "id");
  const [sortDir, setSortDir] = useState("asc");
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 25;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchFn({ page, page_size: PAGE_SIZE, search, sort_by: sortBy, sort_dir: sortDir })
      .then((res) => {
        if (!cancelled) {
          setData(res.items || []);
          setTotal(res.total || 0);
          setPages(res.pages || 1);
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, search, sortBy, sortDir]);

  function handleSort(key) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-canvas-border flex-wrap">
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-9 py-1.5 text-xs"
          />
        </div>
        {extraFilters}
        <span className="ml-auto text-xs text-slate-500">
          {total.toLocaleString()} total
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={col.sortable !== false ? "cursor-pointer select-none hover:text-slate-200" : ""}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && (
                      <SortIcon column={col.key} sortBy={sortBy} sortDir={sortDir} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        <div className="skeleton h-3 rounded w-full max-w-[120px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-16 text-slate-500">
                    No records found
                    {search && ` matching "${search}"`}
                  </td>
                </tr>
              )
              : data.map((row) => (
                  <tr key={row[rowKey]}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-canvas-border">
        <span className="text-xs text-slate-500">
          Page {page} of {pages}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost px-2 py-1 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(5, pages) }, (_, i) => {
            const n = Math.max(1, Math.min(pages - 4, page - 2)) + i;
            return (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`px-2.5 py-1 rounded text-xs font-medium ${
                  n === page
                    ? "bg-brand text-white"
                    : "btn-ghost"
                }`}
              >
                {n}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="btn-ghost px-2 py-1 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
