import { Component } from "react";

/* ── ErrorBoundary ─────────────────────────────────────────────
   Wraps any subtree. On a render crash it shows a recovery UI
   instead of a blank white screen.
────────────────────────────────────────────────────────────── */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReload = () => window.location.reload();
  handleHome   = () => { window.location.href = "/dashboard"; };
  handleReset  = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg = this.state.error?.message || "Unknown error";

    return (
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,#07090f 0%,#0d1020 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Figtree, Inter, sans-serif", padding: 24,
      }}>
        <div style={{
          maxWidth: 500, width: "100%", textAlign: "center",
        }}>
          {/* Animated glitch icon */}
          <div style={{ fontSize: 72, marginBottom: 24, lineHeight: 1, animation: "pulse 2s ease-in-out infinite" }}>
            💥
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 900, color: "#fff",
            marginBottom: 8, letterSpacing: "-0.02em",
          }}>
            Something went wrong
          </h1>

          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginBottom: 28, lineHeight: 1.6 }}>
            An unexpected error occurred in this part of the app.<br/>
            Your data is safe — this is a display issue only.
          </p>

          {/* Error detail */}
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 12, padding: "14px 18px", marginBottom: 28, textAlign: "left",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Error Detail
            </div>
            <code style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "Fira Code, Consolas, monospace", wordBreak: "break-all" }}>
              {msg}
            </code>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={this.handleReset}
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                border: "none", borderRadius: 10, padding: "10px 22px",
                color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              }}
            >
              Try Again
            </button>
            <button onClick={this.handleReload}
              style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10, padding: "10px 22px",
                color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Reload Page
            </button>
            <button onClick={this.handleHome}
              style={{
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: "10px 22px",
                color: "rgba(255,255,255,0.45)", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>

        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }`}</style>
      </div>
    );
  }
}
