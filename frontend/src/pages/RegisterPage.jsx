import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import { MdAutoGraph, MdVisibility, MdVisibilityOff } from "react-icons/md";

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        full_name: form.full_name,
      });
      toast.success("Account created! Please sign in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-mesh px-6 py-10">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-green-glow">
            <MdAutoGraph className="text-white text-lg" />
          </div>
          <span className="font-display font-bold text-primary-900 text-xl">ForecastIQ</span>
        </div>

        <div className="glass-card p-8">
          <h1 className="font-display text-2xl font-bold text-primary-900 mb-1">Create account</h1>
          <p className="text-primary-500 text-sm mb-6">
            Already have one?{" "}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Jane Smith"
                value={form.full_name}
                onChange={update("full_name")}
              />
            </div>
            <div>
              <label className="label">
                Username <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="jane_smith"
                value={form.username}
                onChange={update("username")}
              />
            </div>
            <div>
              <label className="label">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                className="input-field"
                placeholder="jane@company.com"
                value={form.email}
                onChange={update("email")}
              />
            </div>
            <div>
              <label className="label">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  className="input-field pr-10"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={update("password")}
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
            <div>
              <label className="label">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={update("confirmPassword")}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
