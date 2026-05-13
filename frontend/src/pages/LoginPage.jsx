import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { MdAutoGraph, MdVisibility, MdVisibilityOff } from "react-icons/md";

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await login(form);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-green-mesh">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-primary-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute border border-white rounded-full"
              style={{
                width: `${(i + 1) * 120}px`,
                height: `${(i + 1) * 120}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-400 rounded-xl flex items-center justify-center">
              <MdAutoGraph className="text-primary-900 text-xl" />
            </div>
            <span className="font-display font-bold text-white text-xl">ForecastIQ</span>
          </div>
        </div>
        <div className="relative">
          <h2 className="font-display text-4xl font-bold text-white leading-tight mb-4">
            Predict demand.<br />
            <span className="text-primary-300">Stay ahead.</span>
          </h2>
          <p className="text-primary-200 text-base leading-relaxed max-w-sm">
            Leverage AI-powered forecasting to optimize your supply chain and drive smarter decisions.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[["95%", "Accuracy"], ["10×", "Faster"], ["∞", "Scalable"]].map(([val, label]) => (
              <div key={label} className="bg-primary-700/50 rounded-xl p-3 text-center">
                <div className="font-display text-2xl font-bold text-primary-300">{val}</div>
                <div className="text-xs text-primary-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-primary-500 text-xs">© 2025 ForecastIQ. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6 lg:hidden">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <MdAutoGraph className="text-white" />
              </div>
              <span className="font-display font-bold text-primary-900">ForecastIQ</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-primary-900 mb-2">Sign in</h1>
            <p className="text-primary-500 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                type="text"
                className="input-field"
                placeholder="your_username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-600"
                  onClick={() => setShowPwd(!showPwd)}
                >
                  {showPwd ? <MdVisibilityOff /> : <MdVisibility />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
