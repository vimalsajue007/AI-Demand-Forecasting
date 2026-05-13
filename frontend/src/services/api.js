import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor – attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor – handle 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
};

// ── Datasets ──────────────────────────────────────────────────────────────────
export const datasetsAPI = {
  list: () => api.get("/api/datasets/"),
  get: (id) => api.get(`/api/datasets/${id}`),
  preview: (id) => api.get(`/api/datasets/${id}/preview`),
  upload: (formData) =>
    api.post("/api/datasets/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id) => api.delete(`/api/datasets/${id}`),
};

// ── Forecasts ─────────────────────────────────────────────────────────────────
export const forecastsAPI = {
  list: () => api.get("/api/forecasts/"),
  get: (id) => api.get(`/api/forecasts/${id}`),
  create: (data) => api.post("/api/forecasts/", data),
  delete: (id) => api.delete(`/api/forecasts/${id}`),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  stats: () => api.get("/api/dashboard/stats"),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsAPI = {
  downloadExcel: (id) =>
    api.get(`/api/reports/${id}/excel`, { responseType: "blob" }),
  downloadPDF: (id) =>
    api.get(`/api/reports/${id}/pdf`, { responseType: "blob" }),
};

export default api;
