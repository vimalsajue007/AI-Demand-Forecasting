import { useState, useEffect } from "react";
import { dashboardAPI } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  MdStorage,
  MdAutoGraph,
  MdTrendingUp,
  MdShowChart,
  MdAccessTime,
} from "react-icons/md";

const GREENS = ["#4ade80", "#22c55e", "#16a34a", "#166534", "#14532d", "#052e16"];

function StatCard({ icon: Icon, label, value, sub, color = "primary" }) {
  return (
    <div className="stat-card animate-scale-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-primary-500 uppercase tracking-wider">{label}</p>
          <p className="font-display text-2xl font-bold text-primary-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-primary-400 mt-0.5">{sub}</p>}
        </div>
        <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="text-primary-600 text-lg" />
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <p className="font-semibold text-primary-800">{label}</p>
        <p className="text-primary-600">
          Sales: <span className="font-bold text-primary-900">{payload[0]?.value?.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI
      .stats()
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-primary-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-primary-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const greetHour = new Date().getHours();
  const greeting = greetHour < 12 ? "Good morning" : greetHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-title">
          {greeting}, {user?.full_name?.split(" ")[0] || user?.username} 👋
        </h1>
        <p className="text-primary-500 text-sm mt-1">
          Here's what's happening with your forecasts today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MdStorage}
          label="Datasets"
          value={stats?.total_datasets ?? 0}
          sub="uploaded"
        />
        <StatCard
          icon={MdAutoGraph}
          label="Forecasts"
          value={stats?.total_forecasts ?? 0}
          sub="generated"
        />
        <StatCard
          icon={MdTrendingUp}
          label="Total Sales"
          value={stats?.total_sales ? `$${(stats.total_sales / 1000).toFixed(1)}K` : "—"}
          sub="from historical data"
        />
        <StatCard
          icon={MdShowChart}
          label="Avg Accuracy"
          value={stats?.avg_accuracy ? `${stats.avg_accuracy}%` : "—"}
          sub="R² score"
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Monthly Trends */}
        <div className="glass-card p-5 lg:col-span-2">
          <h2 className="section-title mb-4">Monthly Sales Trends</h2>
          {stats?.monthly_trends?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={stats.monthly_trends} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#dcfce7" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#86efac" }} />
                <YAxis tick={{ fontSize: 11, fill: "#86efac" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#salesGrad)"
                  dot={{ r: 3, fill: "#22c55e" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Run forecasts to see monthly trends" />
          )}
        </div>

        {/* Top Products */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Top Products</h2>
          {stats?.top_products?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.top_products.slice(0, 6)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#dcfce7" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#86efac" }} />
                <YAxis dataKey="product" type="category" tick={{ fontSize: 10, fill: "#4ade80" }} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                  {stats.top_products.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={GREENS[i % GREENS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="No product data yet" />
          )}
        </div>
      </div>

      {/* Recent Forecasts */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <MdAccessTime className="text-primary-500" />
          Recent Forecasts
        </h2>
        {stats?.recent_forecasts?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-100">
                  <th className="table-th">Name</th>
                  <th className="table-th">Model</th>
                  <th className="table-th">Accuracy</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Created</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_forecasts.map((f) => (
                  <tr key={f.id} className="border-b border-primary-50 hover:bg-primary-50/50 transition-colors">
                    <td className="table-td font-medium">{f.name}</td>
                    <td className="table-td font-mono text-xs">{f.model}</td>
                    <td className="table-td">
                      {f.accuracy ? (
                        <span className="font-semibold text-primary-700">{f.accuracy}%</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="table-td">
                      <StatusBadge status={f.status} />
                    </td>
                    <td className="table-td text-primary-400">{f.created_at?.slice(0, 10)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-primary-400 text-sm text-center py-8">No forecasts yet. Create your first forecast!</p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    completed: "badge-success",
    running: "badge-info",
    error: "badge-error",
    pending: "badge-warning",
  };
  return <span className={map[status] || "badge-warning"}>{status}</span>;
}

function EmptyChart({ message }) {
  return (
    <div className="h-48 flex items-center justify-center text-primary-300 text-sm">
      <div className="text-center">
        <MdAutoGraph className="text-4xl mx-auto mb-2 text-primary-200" />
        <p>{message}</p>
      </div>
    </div>
  );
}
