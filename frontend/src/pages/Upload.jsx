import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  AlertCircle, CheckCircle2, Clock, FileText,
  Loader2, Upload, XCircle,
} from "lucide-react";

import Header from "../components/Header";
import ErrorState from "../components/ui/ErrorState";
import { getUploadHistory, uploadDataset } from "../services/api";

// ── Status badge ──────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    success:    { cls: "badge-emerald", icon: CheckCircle2, label: "Success" },
    partial:    { cls: "badge-amber",   icon: AlertCircle,  label: "Partial" },
    failed:     { cls: "badge-red",     icon: XCircle,      label: "Failed"  },
    processing: { cls: "badge-indigo",  icon: Loader2,      label: "Processing" },
    pending:    { cls: "badge-indigo",  icon: Clock,        label: "Pending"  },
  };
  const { cls, icon: Icon, label } = map[status] || map.pending;
  return (
    <span className={`badge ${cls} gap-1 whitespace-nowrap`}>
      <Icon className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
      {label}
    </span>
  );
}

// ── Drop zone ─────────────────────────────────────────────────────
function DropZone({ onUpload, uploading, progress }) {
  const onDrop = useCallback(
    (accepted) => { if (accepted[0]) onUpload(accepted[0]); },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/json": [".json"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      role="button"
      aria-label="Upload dataset — drag and drop or click to browse"
      tabIndex={0}
      className={`
        border-2 border-dashed rounded-xl p-8 sm:p-12 text-center
        cursor-pointer transition-all duration-200 outline-none
        focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas
        ${isDragReject
          ? "border-metric-danger bg-metric-danger/5"
          : isDragActive
          ? "border-brand bg-brand/5 shadow-glow"
          : uploading
          ? "border-canvas-border bg-canvas-elevated cursor-not-allowed opacity-60"
          : "border-canvas-border hover:border-brand/50 hover:bg-canvas-elevated"
        }
      `}
    >
      <input {...getInputProps()} aria-hidden="true" />

      {uploading ? (
        <div className="space-y-4">
          <Loader2 className="w-10 h-10 text-brand mx-auto animate-spin" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-300">Processing dataset…</p>
          {progress > 0 && (
            <div className="max-w-xs mx-auto" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Uploading</span><span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-canvas-border rounded-full overflow-hidden">
                <div className="h-full bg-brand rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
        </div>
      ) : isDragReject ? (
        <div className="space-y-2">
          <XCircle className="w-10 h-10 text-metric-danger mx-auto" aria-hidden="true" />
          <p className="text-sm text-metric-danger font-medium">Only .csv and .json files accepted</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-brand/10 mx-auto">
            <Upload className="w-7 h-7 text-brand" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              {isDragActive ? "Drop your file here" : "Drag & drop your dataset"}
            </p>
            <p className="text-xs text-slate-500 mt-1">CSV or JSON · Max 50 MB</p>
          </div>
          <button type="button" className="btn-primary mx-auto text-xs pointer-events-none">
            Browse files
          </button>
        </div>
      )}
    </div>
  );
}

// ── Import result card ────────────────────────────────────────────
function UploadResult({ result, onClear }) {
  if (!result) return null;
  const s = result.stats;
  const ok = s.status === "success" || s.status === "partial";

  return (
    <div className={`card border ${ok ? "border-metric-positive/30" : "border-metric-danger/30"} p-4 sm:p-5 animate-fade-in`}
         role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        {ok
          ? <CheckCircle2 className="w-5 h-5 text-metric-positive flex-shrink-0 mt-0.5" aria-hidden="true" />
          : <XCircle      className="w-5 h-5 text-metric-danger flex-shrink-0 mt-0.5"   aria-hidden="true" />
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{result.message}</p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{result.filename}</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
            {[
              ["Total Rows",      s.total_rows],
              ["Processed",       s.processed_rows],
              ["Failed",          s.failed_rows],
              ["Orders Inserted", s.orders_inserted],
              ["Customers",       s.customers_upserted],
              ["Products",        s.products_upserted],
              ["Duplicates Rm.",  s.duplicates_removed],
              ["Time (s)",        s.processing_time_sec?.toFixed(2)],
            ].map(([label, value]) => (
              <div key={label} className="bg-canvas-elevated rounded-lg px-3 py-2">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-sm font-bold text-white tabular-nums">{value ?? "—"}</p>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onClear} className="btn-ghost text-xs flex-shrink-0" aria-label="Dismiss result">
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function UploadPage() {
  const [uploading,  setUploading]  = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [history,    setHistory]    = useState([]);
  const [histLoading, setHistLoading] = useState(true);
  const [histError,  setHistError]  = useState(null);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    setHistError(null);
    try {
      const res = await getUploadHistory(1, 20);
      setHistory(res.items || []);
    } catch (err) {
      setHistError(err.message);
    } finally {
      setHistLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function handleUpload(file) {
    setUploading(true);
    setProgress(0);
    setLastResult(null);
    try {
      const result = await uploadDataset(file, setProgress);
      setLastResult(result);
      toast.success(`${result.stats.orders_inserted.toLocaleString()} orders imported`);
      loadHistory();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Upload" subtitle="Import CSV or JSON datasets" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6">

        {/* Upload zone */}
        <section aria-labelledby="upload-heading">
          <h2 id="upload-heading" className="text-sm font-semibold text-white mb-1">Import Dataset</h2>
          <p className="text-xs text-slate-500 mb-4 hidden sm:block">
            Upload a Superstore-format CSV or any sales JSON.
            The pipeline automatically cleans, validates, and loads your data.
          </p>
          <div className="max-w-2xl">
            <DropZone onUpload={handleUpload} uploading={uploading} progress={progress} />
          </div>
        </section>

        {/* Result */}
        {lastResult && (
          <div className="max-w-2xl">
            <UploadResult result={lastResult} onClear={() => setLastResult(null)} />
          </div>
        )}

        {/* Format hint */}
        <div className="max-w-2xl card p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-300">Expected columns</span>
          </div>
          <p className="text-xs text-slate-500 font-mono leading-relaxed break-words">
            order_id, customer_name, product_name, category, quantity,
            unit_price, discount, region, salesperson, order_date, payment_method
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Column names are normalized automatically —{" "}
            <code className="text-brand-light">Sales</code>,{" "}
            <code className="text-brand-light">Order Date</code>,{" "}
            <code className="text-brand-light">Customer Name</code> all work.
          </p>
        </div>

        {/* History */}
        <section aria-labelledby="history-heading">
          <h2 id="history-heading" className="text-sm font-semibold text-white mb-3">Upload History</h2>

          {histError ? (
            <ErrorState message={histError} onRetry={loadHistory} />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table min-w-[700px]">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Status</th>
                      <th>Rows</th>
                      <th>Processed</th>
                      <th>Failed</th>
                      <th>Orders</th>
                      <th>Time</th>
                      <th>Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {histLoading
                      ? Array.from({ length: 4 }).map((_, i) => (
                          <tr key={i}>
                            {Array.from({ length: 8 }).map((_, j) => (
                              <td key={j}><div className="skeleton h-3 rounded w-16" /></td>
                            ))}
                          </tr>
                        ))
                      : history.length === 0
                      ? (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-500">
                            No uploads yet — import your first dataset above
                          </td>
                        </tr>
                      )
                      : history.map((h) => (
                          <tr key={h.id}>
                            <td className="max-w-[140px]">
                              <p className="truncate font-medium text-slate-200 text-xs" title={h.filename}>{h.filename}</p>
                              <p className="text-xs text-slate-500">{h.file_size_kb?.toFixed(1)} KB</p>
                            </td>
                            <td><StatusBadge status={h.status} /></td>
                            <td className="tabular-nums">{h.total_rows?.toLocaleString()}</td>
                            <td className="tabular-nums text-metric-positive">{h.processed_rows?.toLocaleString()}</td>
                            <td className="tabular-nums text-metric-danger">{h.failed_rows?.toLocaleString()}</td>
                            <td className="tabular-nums">{h.orders_inserted?.toLocaleString()}</td>
                            <td className="tabular-nums text-slate-400">{h.processing_time_sec?.toFixed(2)}s</td>
                            <td className="text-slate-400 text-xs whitespace-nowrap">
                              {new Date(h.uploaded_at).toLocaleDateString()}{" "}
                              {new Date(h.uploaded_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
