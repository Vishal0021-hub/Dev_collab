import { useState, useEffect } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";
import '../utils/login.css'
const floatingParticles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 6,
  duration: Math.random() * 8 + 6,
}));

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      // ✅ MUST BE HERE
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/dashboard";

    } catch (err) {
      console.log(err.response?.data);
      alert(err.response?.data?.message || "Login Failed ❌");
    }
  };


  return (
    <div className="dc-page">


      <div className="dc-root">
        {/* ── LEFT ── */}
        <div className="dc-left">
          <div className="dc-grid-overlay" />
          {floatingParticles.map((p) => (
            <div
              key={p.id}
              className="dc-particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                "--dur": `${p.duration}s`,
                "--delay": `${p.delay}s`,
              }}
            />
          ))}

          <div className="dc-illustration">
            <div className="collab-canvas">
              <div className="collab-bar">
                <div className="collab-dot" style={{ background: "#f87171" }} />
                <div className="collab-dot" style={{ background: "#fbbf24" }} />
                <div className="collab-dot" style={{ background: "#34d399" }} />
                <span style={{ marginLeft: 8, fontSize: 11, color: "#4b5563", fontFamily: "DM Sans" }}>
                  collab — main.js
                </span>
              </div>

              <div className="collab-editor">
                <div><span className="code-cm">// Real-time sync active 🟢</span></div>
                <div>
                  <span className="code-kw">const</span>{" "}
                  <span className="code-fn">useCollab</span> = ({"{"}
                  <span className="code-str">roomId</span>{"}"}) =&gt; {"{"}
                </div>
                <div>&nbsp;&nbsp;<span className="code-kw">const</span> [peers, setPeers] = useState([]);</div>
                <div>
                  &nbsp;&nbsp;<span className="code-kw">const</span> socket ={" "}
                  <span className="code-fn">io</span>(
                  <span className="code-str">`/room/${"{"}roomId{"}"}`</span>);
                </div>
                <div>&nbsp;&nbsp;<span className="code-cm">// sync cursor positions</span></div>
                <div>
                  &nbsp;&nbsp;<span className="code-fn">socket</span>.on(
                  <span className="code-str">'update'</span>, fn);
                  <span className="cursor-blink" />
                </div>
              </div>

              <div className="collab-avatars">
                {[
                  { bg: "#6366f1", label: "A" },
                  { bg: "#ec4899", label: "S" },
                  { bg: "#f59e0b", label: "R" },
                  { bg: "#10b981", label: "K" },
                ].map((a) => (
                  <div
                    key={a.label}
                    className="collab-avatar"
                    style={{ background: a.bg }}
                  >
                    {a.label}
                  </div>
                ))}
                <div className="collab-live">
                  <div className="live-dot" />
                  4 collaborating
                </div>
              </div>
            </div>
          </div>

          <div className="dc-tagline">
            <h1>
              Build Together,<br />
              <span>Ship Faster.</span>
            </h1>
            <p>
              DevCollab brings your entire engineering team into a single,
              real-time workspace — code, review, and ship without context switching.
            </p>
            <div className="dc-features">
              {["Live cursors", "Instant sync", "Code reviews", "Voice rooms"].map((f) => (
                <div className="dc-feat" key={f}>
                  <div className="dc-feat-dot" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="dc-right">
          <div className="dc-form-wrap">
            <div className="dc-logo-row">
              <div className="dc-logo-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 6l7-3 7 3v8l-7 3-7-3V6z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M3 6l7 3m0 8V9m7-3l-7 3" stroke="#fff" strokeWidth="1.5" />
                </svg>
              </div>
              <span className="dc-logo-text">DevCollab</span>
            </div>

            <h2 className="dc-form-title">Welcome back</h2>
            <p className="dc-form-sub">
              Don't have an account?{" "}
              <Link to="/signup">Create one free →</Link>
            </p>

            <div className="dc-field">
              <label className="dc-label">Email address</label>
              <div className="dc-input-wrap">
                <svg className="dc-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M2 8l10 6 10-6" />
                </svg>
                <input
                  type="email"
                  placeholder="you@company.dev"
                  className="dc-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>

            <div className="dc-field">
              <label className="dc-label">Password</label>
              <div className="dc-input-wrap">
                <svg className="dc-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type="password"
                  placeholder="••••••••••"
                  className="dc-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                />
              </div>
              <div className="dc-forgot">
                <a href="/forgot-password">Forgot password?</a>
              </div>
            </div>

            <button className="dc-btn" onClick={handleLogin}>
              Sign in to DevCollab
            </button>

            <div className="dc-divider">or continue with</div>

            <div className="dc-oauth">
              <button className="dc-oauth-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z" />
                </svg>
                GitHub
              </button>
              <button className="dc-oauth-btn">
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </div>

            <div className="dc-footer">
              By signing in you agree to our{" "}
              <a href="/terms">Terms</a> &amp; <a href="/privacy">Privacy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;