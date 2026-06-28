import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";
import ErrorState from "./ui/ErrorState";

function SortIcon({ column, sortBy, sortDir }) {
  if (sortBy !== column) return <ChevronUp className="w-3 h-3 opacity-20" aria-hidden="true" />;
  return sortDir === "asc"
    ? <ChevronUp   className="w-3 h-3 text-brand" aria-hidden="true" />
    : <ChevronDown className="w-3 h-3 text-brand" aria-hidden="true" />;
}

const PAGE_SIZE = 25;

function DataTable({ columns, fetchFn, searchPlaceholder = "Search…", extraFilters, rowKey = "id" }) {
  const [data,        setData]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [pages,       setPages]       = useState(1);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy,      setSortBy]      = useState(columns[0]?.key || "id");
  const [sortDir,     setSortDir]     = useState("asc");
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchFn({ page, page_size: PAGE_SIZE, search, sort_by: sortBy, sort_dir: sortDir })
      .then((res) => {
        if (!cancelled) {
          setData(res.items || []);
          setTotal(res.total || 0);
          setPages(res.pages || 1);
        }
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [page, search, sortBy, sortDir, fetchFn]);

  useEffect(() => load(), [load]);

  // Debounced search → resets to page 1
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleSort = useCallback((key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(1);
  }, [sortBy]);

  // Visible page numbers (max 5 buttons)
  const pageButtons = Array.from({ length: Math.min(5, pages) }, (_, i) => {
    return Math.max(1, Math.min(pages - 4, page - 2)) + i;
  });

  return (
    <div className="card overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-3 sm:p-4 border-b border-canvas-border flex-wrap">
        <div className="relative flex-1 min-w-0 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          <input
            type="search"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label={searchPlaceholder}
            className="input pl-9 py-1.5 text-xs w-full"
          />
        </div>
        {extraFilters}
        <span className="ml-auto text-xs text-slate-500 flex-shrink-0">
          {total.toLocaleString()} total
        </span>
      </div>

      {/* Error */}
      {error && !loading && <ErrorState message={error} onRetry={load} />}

      {/* Table with horizontal scroll + sticky header */}
      <div className="overflow-x-auto" role="region" aria-label="Data table">
        <table className="data-table min-w-[800px]" aria-busy={loading}>
          <thead className="sticky top-0 bg-canvas-surface z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  aria-sort={sortBy === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
                  className={col.sortable !== false
                    ? "cursor-pointer select-none hover:text-slate-200 focus-visible:outline-brand"
                    : ""}
                  tabIndex={col.sortable !== false ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (col.sortable !== false && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      handleSort(col.key);
                    }
                  }}
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
                  <tr key={i} aria-hidden="true">
                    {columns.map((col) => (
                      <td key={col.key}><div className="skeleton h-3 rounded w-full max-w-[120px]" /></td>
                    ))}
                  </tr>
                ))
              : data.length === 0
              ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-16 text-slate-500">
                    {error ? null : <>No records found{search && ` matching "${search}"`}</>}
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
                ))
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-canvas-border flex-wrap gap-2">
        <span className="text-xs text-slate-500">
          Page {page} of {pages}
        </span>
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
            className="btn-ghost px-2 py-1 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          {pageButtons.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              aria-label={`Page ${n}`}
              aria-current={n === page ? "page" : undefined}
              className={`px-2.5 py-1 rounded text-xs font-medium ${
                n === page ? "bg-brand text-white" : "btn-ghost"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            aria-label="Next page"
            className="btn-ghost px-2 py-1 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
}

export default memo(DataTable);
