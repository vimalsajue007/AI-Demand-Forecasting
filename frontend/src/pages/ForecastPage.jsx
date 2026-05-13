import { useState, useEffect } from "react";
import { forecastsAPI, datasetsAPI } from "../services/api";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { TbBrain } from "react-icons/tb";
import { MdAdd, MdDelete, MdRefresh, MdAutoGraph } from "react-icons/md";

export default function ForecastPage() {
  const [forecasts, setForecasts] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [datasetCols, setDatasetCols] = useState([]);

  const [form, setForm] = useState({
    name: "",
    dataset_id: "",
    model_type: "linear_regression",
    periods: 12,
    target_column: "",
    date_column: "",
    feature_columns: [],
  });

  useEffect(() => {
    Promise.all([forecastsAPI.list(), datasetsAPI.list()])
      .then(([fr, dr]) => {
        setForecasts(fr.data);
        setDatasets(dr.data.filter((d) => d.status === "processed"));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDatasetChange = async (id) => {
    setForm((f) => ({ ...f, dataset_id: id, target_column: "", date_column: "", feature_columns: [] }));
    if (!id) return;
    try {
      const r = await datasetsAPI.preview(id);
      setDatasetCols(r.data.columns || []);
    } catch {
      setDatasetCols([]);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.dataset_id || !form.target_column || !form.date_column) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCreating(true);
    try {
      const payload = { ...form, dataset_id: parseInt(form.dataset_id), periods: parseInt(form.periods) };
      const r = await forecastsAPI.create(payload);
      setForecasts((prev) => [r.data, ...prev]);
      toast.success("Forecast started! It will complete shortly.");
      setShowForm(false);
      setForm({ name: "", dataset_id: "", model_type: "linear_regression", periods: 12, target_column: "", date_column: "", feature_columns: [] });
      setDatasetCols([]);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create forecast");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this forecast?")) return;
    await forecastsAPI.delete(id);
    setForecasts((prev) => prev.filter((f) => f.id !== id));
    if (selected?.id === id) setSelected(null);
    toast.success("Deleted");
  };

  const handleRefresh = async (id) => {
    const r = await forecastsAPI.get(id);
    setForecasts((prev) => prev.map((f) => (f.id === id ? r.data : f)));
    if (selected?.id === id) setSelected(r.data);
  };

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // Build chart data
  const chartData = selected?.status === "completed" ? buildChartData(selected) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Forecasts</h1>
          <p className="text-primary-500 text-sm mt-1">Generate AI-powered demand predictions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <MdAdd /> New Forecast
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="glass-card p-6 animate-slide-up">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <TbBrain className="text-primary-500" />
            Configure Forecast
          </h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Forecast Name *</label>
              <input
                className="input-field"
                placeholder="e.g. Q4 Demand Forecast"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Dataset *</label>
              <select
                className="input-field"
                value={form.dataset_id}
                onChange={(e) => handleDatasetChange(e.target.value)}
              >
                <option value="">Select dataset…</option>
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Model *</label>
              <select
                className="input-field"
                value={form.model_type}
                onChange={(e) => setForm({ ...form, model_type: e.target.value })}
              >
                <option value="linear_regression">Linear Regression</option>
                <option value="prophet">Prophet (Meta)</option>
              </select>
            </div>
            <div>
              <label className="label">Forecast Periods *</label>
              <input
                type="number"
                className="input-field"
                min={1}
                max={365}
                value={form.periods}
                onChange={(e) => setForm({ ...form, periods: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Date Column *</label>
              <select
                className="input-field"
                value={form.date_column}
                onChange={(e) => setForm({ ...form, date_column: e.target.value })}
                disabled={!datasetCols.length}
              >
                <option value="">Select date column…</option>
                {datasetCols.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Target Column *</label>
              <select
                className="input-field"
                value={form.target_column}
                onChange={(e) => setForm({ ...form, target_column: e.target.value })}
                disabled={!datasetCols.length}
              >
                <option value="">Select target column…</option>
                {datasetCols.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="md:col-span-2 flex gap-3 pt-2">
              <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2">
                {creating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {creating ? "Running…" : "Run Forecast"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Forecasts list */}
        <div className="lg:col-span-2 glass-card p-5">
          <h2 className="section-title mb-4">All Forecasts</h2>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-primary-50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : forecasts.length === 0 ? (
            <p className="text-center text-primary-400 text-sm py-10">No forecasts yet.</p>
          ) : (
            <div className="space-y-2">
              {forecasts.map((f) => (
                <div
                  key={f.id}
                  onClick={() => f.status === "completed" && setSelected(f)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all duration-150
                    ${selected?.id === f.id
                      ? "border-primary-400 bg-primary-50 shadow-green-glow"
                      : "border-primary-100 hover:border-primary-300 hover:bg-primary-50/50"
                    }
                    ${f.status !== "completed" ? "opacity-70 cursor-default" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary-900 truncate">{f.name}</p>
                      <p className="text-xs text-primary-400 font-mono mt-0.5">{f.model_type}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <StatusBadge status={f.status} />
                      {f.status === "running" && (
                        <button onClick={(e) => { e.stopPropagation(); handleRefresh(f.id); }} className="text-primary-400 hover:text-primary-600">
                          <MdRefresh className="text-sm" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(f.id); }} className="text-red-400 hover:text-red-600">
                        <MdDelete className="text-sm" />
                      </button>
                    </div>
                  </div>
                  {f.accuracy_score && (
                    <div className="mt-1.5 flex gap-3 text-xs text-primary-500">
                      <span>R²: <strong className="text-primary-700">{(f.accuracy_score * 100).toFixed(1)}%</strong></span>
                      {f.mae && <span>MAE: <strong className="text-primary-700">{f.mae.toFixed(2)}</strong></span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forecast chart */}
        <div className="lg:col-span-3 glass-card p-5">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <MdAutoGraph className="text-primary-500" />
            {selected ? selected.name : "Select a forecast to visualize"}
          </h2>
          {selected?.status === "completed" && chartData.length > 0 ? (
            <div>
              <div className="flex gap-4 mb-4 text-xs">
                {selected.accuracy_score && (
                  <div className="bg-primary-50 rounded-lg px-3 py-1.5">
                    <span className="text-primary-500">R² Score</span>
                    <span className="font-bold text-primary-800 ml-1.5">
                      {(selected.accuracy_score * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
                {selected.mae && (
                  <div className="bg-primary-50 rounded-lg px-3 py-1.5">
                    <span className="text-primary-500">MAE</span>
                    <span className="font-bold text-primary-800 ml-1.5">{selected.mae.toFixed(3)}</span>
                  </div>
                )}
                {selected.rmse && (
                  <div className="bg-primary-50 rounded-lg px-3 py-1.5">
                    <span className="text-primary-500">RMSE</span>
                    <span className="font-bold text-primary-800 ml-1.5">{selected.rmse.toFixed(3)}</span>
                  </div>
                )}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dcfce7" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#86efac" }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: "#86efac" }} />
                  <Tooltip
                    contentStyle={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "12px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <ReferenceLine
                    x={chartData.find((d) => d.type === "forecast")?.date}
                    stroke="#22c55e"
                    strokeDasharray="4 4"
                    label={{ value: "Forecast Start", fill: "#22c55e", fontSize: 10 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="historical"
                    stroke="#166534"
                    strokeWidth={2}
                    dot={false}
                    name="Historical"
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                    name="Forecast"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : selected?.status === "running" ? (
            <div className="h-72 flex flex-col items-center justify-center gap-3 text-primary-500">
              <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-sm">Model is training… refresh to check status.</p>
            </div>
          ) : (
            <div className="h-72 flex flex-col items-center justify-center text-primary-300">
              <MdAutoGraph className="text-5xl mb-3 text-primary-200" />
              <p className="text-sm">Click a completed forecast to see its chart</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = { completed: "badge-success", running: "badge-info", error: "badge-error", pending: "badge-warning" };
  return <span className={map[status] || "badge-warning"}>{status}</span>;
}

function buildChartData(forecast) {
  const hist = (forecast.historical_data || []).map((d) => ({
    date: d.ds,
    historical: d.y,
    forecast: null,
    type: "historical",
  }));
  const preds = (forecast.predictions || []).map((d) => ({
    date: d.ds,
    historical: null,
    forecast: d.yhat,
    type: "forecast",
  }));
  return [...hist.slice(-60), ...preds];
}
