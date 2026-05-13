import { useState, useEffect } from "react";
import { forecastsAPI, reportsAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  MdAssessment,
  MdFileDownload,
  MdPictureAsPdf,
  MdTableChart,
} from "react-icons/md";
import { TbFileSpreadsheet } from "react-icons/tb";

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    forecastsAPI
      .list()
      .then((r) => setForecasts(r.data.filter((f) => f.status === "completed")))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (id, type) => {
    setDownloading((prev) => ({ ...prev, [`${id}-${type}`]: true }));
    try {
      const res = type === "excel"
        ? await reportsAPI.downloadExcel(id)
        : await reportsAPI.downloadPDF(id);
      const ext = type === "excel" ? "xlsx" : "pdf";
      downloadBlob(res.data, `forecast_${id}_report.${ext}`);
      toast.success(`${type.toUpperCase()} report downloaded!`);
    } catch {
      toast.error("Download failed");
    } finally {
      setDownloading((prev) => ({ ...prev, [`${id}-${type}`]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="text-primary-500 text-sm mt-1">
          Download forecasting reports as Excel or PDF
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-2">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <TbFileSpreadsheet className="text-primary-600 text-2xl" />
          </div>
          <div>
            <p className="font-semibold text-primary-900 text-sm">Excel Export</p>
            <p className="text-primary-400 text-xs mt-0.5">
              Summary, historical data & predictions in structured sheets
            </p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <MdPictureAsPdf className="text-primary-600 text-2xl" />
          </div>
          <div>
            <p className="font-semibold text-primary-900 text-sm">PDF Export</p>
            <p className="text-primary-400 text-xs mt-0.5">
              Branded PDF report with metrics and prediction table
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <MdAssessment className="text-primary-500" />
          Completed Forecasts
        </h2>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-primary-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : forecasts.length === 0 ? (
          <div className="text-center py-14">
            <MdAssessment className="text-5xl text-primary-200 mx-auto mb-3" />
            <p className="text-primary-400 text-sm">
              No completed forecasts yet. Run a forecast to generate reports.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-100">
                  <th className="table-th">Forecast</th>
                  <th className="table-th">Model</th>
                  <th className="table-th">Periods</th>
                  <th className="table-th">R² Accuracy</th>
                  <th className="table-th">MAE</th>
                  <th className="table-th">RMSE</th>
                  <th className="table-th">Created</th>
                  <th className="table-th">Export</th>
                </tr>
              </thead>
              <tbody>
                {forecasts.map((f) => (
                  <tr key={f.id} className="border-b border-primary-50 hover:bg-primary-50/50 transition-colors">
                    <td className="table-td font-semibold">{f.name}</td>
                    <td className="table-td">
                      <span className="font-mono text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-lg">
                        {f.model_type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="table-td">{f.periods}</td>
                    <td className="table-td">
                      {f.accuracy_score ? (
                        <span className={`font-bold ${f.accuracy_score > 0.8 ? "text-primary-600" : f.accuracy_score > 0.6 ? "text-yellow-600" : "text-red-500"}`}>
                          {(f.accuracy_score * 100).toFixed(1)}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="table-td font-mono text-xs">
                      {f.mae ? f.mae.toFixed(4) : "—"}
                    </td>
                    <td className="table-td font-mono text-xs">
                      {f.rmse ? f.rmse.toFixed(4) : "—"}
                    </td>
                    <td className="table-td text-primary-400">{f.created_at?.slice(0, 10)}</td>
                    <td className="table-td">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(f.id, "excel")}
                          disabled={downloading[`${f.id}-excel`]}
                          className="flex items-center gap-1 btn-secondary text-xs px-3 py-1.5"
                          title="Download Excel"
                        >
                          {downloading[`${f.id}-excel`] ? (
                            <div className="w-3 h-3 border border-primary-400 border-t-primary-700 rounded-full animate-spin" />
                          ) : (
                            <TbFileSpreadsheet />
                          )}
                          XLSX
                        </button>
                        <button
                          onClick={() => handleDownload(f.id, "pdf")}
                          disabled={downloading[`${f.id}-pdf`]}
                          className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-xl transition-colors font-medium"
                          title="Download PDF"
                        >
                          {downloading[`${f.id}-pdf`] ? (
                            <div className="w-3 h-3 border border-red-300 border-t-red-600 rounded-full animate-spin" />
                          ) : (
                            <MdPictureAsPdf />
                          )}
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
