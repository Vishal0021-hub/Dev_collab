import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  const [focused, setFocused] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  const handleLogin = async () => {
    try {
      // Replace with your API call
      alert("Login Success ✅");
    } catch (err) {
      alert("Login Failed ❌");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { font-family: 'DM Sans', sans-serif; }

        .dc-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #04050a;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        /* ── LEFT PANEL ── */
        .dc-left {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 56px;
          background: linear-gradient(145deg, #080c1a 0%, #0b1228 50%, #060a18 100%);
          overflow: hidden;
        }

        .dc-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 20% 30%, rgba(99,102,241,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 80% 70%, rgba(139,92,246,0.14) 0%, transparent 70%);
          pointer-events: none;
        }

        .dc-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .dc-particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(139,92,246,0.6);
          animation: floatUp var(--dur) var(--delay) ease-in-out infinite alternate;
          pointer-events: none;
        }

        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1);   opacity: 0.3; }
          100% { transform: translateY(-28px) scale(1.4); opacity: 0.7; }
        }

        .dc-illustration {
          position: relative;
          z-index: 2;
          margin-bottom: 48px;
        }

        .collab-canvas {
          width: 100%;
          max-width: 420px;
          border-radius: 20px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(99,102,241,0.2);
          padding: 28px;
          backdrop-filter: blur(12px);
          box-shadow: 0 0 80px rgba(99,102,241,0.12);
        }

        .collab-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 20px;
        }

        .collab-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
        }

        .collab-editor {
          background: rgba(0,0,0,0.4);
          border-radius: 12px;
          padding: 18px;
          font-family: 'Fira Code', monospace;
          font-size: 12px;
          color: #a0aec0;
          line-height: 1.8;
          border: 1px solid rgba(255,255,255,0.05);
          position: relative;
          overflow: hidden;
        }

        .collab-editor::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 40px;
          background: linear-gradient(transparent, rgba(0,0,0,0.4));
        }

        .code-kw  { color: #818cf8; }
        .code-fn  { color: #34d399; }
        .code-str { color: #fbbf24; }
        .code-cm  { color: #4b5563; }

        .cursor-blink {
          display: inline-block;
          width: 2px; height: 14px;
          background: #6366f1;
          margin-left: 2px;
          vertical-align: middle;
          animation: blink 1s step-end infinite;
        }

        @keyframes blink { 50% { opacity: 0; } }

        .collab-avatars {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 16px;
        }

        .collab-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 2px solid #04050a;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
          color: #fff;
          margin-left: -8px;
        }

        .collab-avatar:first-child { margin-left: 0; }

        .collab-live {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-left: auto;
          font-size: 11px;
          color: #34d399;
          font-family: 'DM Sans', sans-serif;
          font-weight: 500;
        }

        .live-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #34d399;
          animation: pulse-live 1.4s ease-in-out infinite;
        }

        @keyframes pulse-live {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(1.5); }
        }

        .dc-tagline {
          position: relative;
          z-index: 2;
        }

        .dc-tagline h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(28px, 3vw, 40px);
          font-weight: 800;
          color: #fff;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin-bottom: 14px;
        }

        .dc-tagline h1 span {
          background: linear-gradient(90deg, #818cf8, #a78bfa, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dc-tagline p {
          color: #6b7280;
          font-size: 15px;
          line-height: 1.7;
          max-width: 340px;
          font-weight: 300;
        }

        .dc-features {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 28px;
        }

        .dc-feat {
          display: flex;
          align-items: center;
          gap: 7px;
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.16);
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 12px;
          color: #a5b4fc;
          font-weight: 500;
        }

        .dc-feat-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #818cf8;
        }

        /* ── RIGHT PANEL ── */
        .dc-right {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 56px;
          background: #04050a;
          position: relative;
          transition: opacity 0.7s, transform 0.7s;
          opacity: ${loaded ? 1 : 0};
          transform: ${loaded ? 'translateX(0)' : 'translateX(30px)'};
        }

        .dc-form-wrap {
          width: 100%;
          max-width: 380px;
        }

        .dc-logo-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 44px;
        }

        .dc-logo-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(99,102,241,0.4);
        }

        .dc-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }

        .dc-form-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .dc-form-sub {
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 36px;
          font-weight: 300;
        }

        .dc-form-sub a {
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
        }

        .dc-field {
          margin-bottom: 18px;
          position: relative;
        }

        .dc-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .dc-input-wrap {
          position: relative;
        }

        .dc-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #374151;
          transition: color 0.2s;
          pointer-events: none;
        }

        .dc-input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: all 0.25s;
        }

        .dc-input::placeholder { color: #374151; }

        .dc-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.05);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .dc-input:focus + .dc-focus-line { width: 100%; }

        .dc-input-wrap:focus-within .dc-input-icon { color: #818cf8; }

        .dc-forgot {
          display: flex;
          justify-content: flex-end;
          margin-top: 6px;
        }

        .dc-forgot a {
          font-size: 12px;
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
        }

        .dc-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
          letter-spacing: 0.02em;
          position: relative;
          overflow: hidden;
          transition: transform 0.15s, box-shadow 0.15s;
          box-shadow: 0 4px 24px rgba(99,102,241,0.35);
        }

        .dc-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }

        .dc-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(99,102,241,0.45);
        }

        .dc-btn:active { transform: translateY(0); }

        .dc-divider {
          display: flex;
          align-items: center;
          gap: 14px;
          margin: 28px 0;
          color: #1f2937;
          font-size: 12px;
        }

        .dc-divider::before, .dc-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }

        .dc-oauth {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .dc-oauth-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          color: #9ca3af;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dc-oauth-btn:hover {
          border-color: rgba(99,102,241,0.3);
          color: #fff;
          background: rgba(99,102,241,0.06);
        }

        .dc-footer {
          text-align: center;
          margin-top: 32px;
          font-size: 12px;
          color: #1f2937;
        }

        .dc-footer a {
          color: #4b5563;
          text-decoration: none;
        }

        @media (max-width: 768px) {
          .dc-root { grid-template-columns: 1fr; }
          .dc-left  { display: none; }
          .dc-right { padding: 40px 28px; }
        }
      `}</style>

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
              <Link to="/Signup">Create one free →</Link>
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
    </>
  );
}

export default Login;