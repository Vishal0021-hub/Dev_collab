import axios from "axios";
import { toast } from "react-hot-toast";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000, // 15-second request timeout
});

/* ── Request interceptor: attach JWT ────────────────────────── */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

/* ── Response interceptor ───────────────────────────────────── */
let _401shown = false; // prevent duplicate "session expired" toasts

API.interceptors.response.use(
  // ✅ Success — pass through
  (res) => res,

  // ❌ Error handling
  (err) => {
    const status  = err.response?.status;
    const message = err.response?.data?.message;

    // ── 401: session expired / invalid token ──────────────────
    if (status === 401) {
      if (!_401shown) {
        _401shown = true;
        toast.error("Session expired — please log in again.", {
          id: "auth-expired", duration: 4000,
        });
        setTimeout(() => { _401shown = false; }, 5000);
      }
      localStorage.removeItem("token");
      // Small delay so the toast is readable before redirect
      setTimeout(() => { window.location.href = "/login"; }, 1200);
      return Promise.reject(err);
    }

    // ── 403: permission denied ────────────────────────────────
    if (status === 403) {
      toast.error(message || "You don't have permission to do that.", {
        id: "forbidden", duration: 4000,
      });
      return Promise.reject(err);
    }

    // ── 404: not found ────────────────────────────────────────
    if (status === 404) {
      // Don't toast — components handle 404s locally
      return Promise.reject(err);
    }

    // ── 429: rate limited ─────────────────────────────────────
    if (status === 429) {
      toast.error("Too many requests — slow down a little! 🐢", {
        id: "rate-limit", duration: 5000,
      });
      return Promise.reject(err);
    }

    // ── 5xx: server error ─────────────────────────────────────
    if (status >= 500) {
      toast.error(
        message || "Server error — please try again in a moment.",
        { id: `server-${status}`, duration: 5000 }
      );
      return Promise.reject(err);
    }

    // ── Network error (no response at all) ────────────────────
    if (!err.response) {
      // ECONNABORTED = timeout
      if (err.code === "ECONNABORTED") {
        toast.error("Request timed out — check your connection.", {
          id: "timeout", duration: 5000,
        });
      }
      // Other network errors (server down, CORS, etc.)
      // Don't show a toast — OfflineBanner handles it visually
    }

    return Promise.reject(err);
  }
);

export default API;