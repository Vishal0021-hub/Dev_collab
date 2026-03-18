import { useState, useEffect } from "react";

const floatingParticles = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 3 + 1,
  delay: Math.random() * 6,
  duration: Math.random() * 8 + 6,
}));

const steps = ["Account", "Profile", "Done"];

function Signup() {
  const [step, setStep] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirm: "", role: "", team: ""
  });

  useEffect(() => { setTimeout(() => setLoaded(true), 100); }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSignup = async () => {
    alert("Account created! 🎉");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; }

        .su-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #04050a;
          font-family: 'DM Sans', sans-serif;
          overflow: hidden;
        }

        /* ── RIGHT (form) – comes first in DOM but grid handles layout ── */
        .su-right {
          order: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px 56px;
          background: #04050a;
          position: relative;
          transition: opacity 0.7s, transform 0.7s;
          opacity: ${loaded ? 1 : 0};
          transform: ${loaded ? 'translateX(0)' : 'translateX(-30px)'};
        }

        .su-form-wrap {
          width: 100%;
          max-width: 380px;
        }

        .su-logo-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 44px;
        }

        .su-logo-icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 20px rgba(99,102,241,0.4);
        }

        .su-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }

        /* progress stepper */
        .su-steps {
          display: flex;
          align-items: center;
          gap: 0;
          margin-bottom: 36px;
        }

        .su-step {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .su-step-num {
          width: 28px; height: 28px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px;
          font-weight: 700;
          font-family: 'Syne', sans-serif;
          transition: all 0.3s;
        }

        .su-step-num.active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          box-shadow: 0 0 14px rgba(99,102,241,0.4);
        }

        .su-step-num.done {
          background: rgba(52,211,153,0.15);
          border: 1px solid rgba(52,211,153,0.4);
          color: #34d399;
        }

        .su-step-num.idle {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #374151;
        }

        .su-step-label {
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: color 0.3s;
        }

        .su-step-label.active { color: #818cf8; }
        .su-step-label.done   { color: #34d399; }
        .su-step-label.idle   { color: #1f2937; }

        .su-step-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 0 10px;
          min-width: 24px;
        }

        .su-form-title {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 700;
          color: #fff;
          margin-bottom: 6px;
          letter-spacing: -0.02em;
        }

        .su-form-sub {
          font-size: 14px;
          color: #4b5563;
          margin-bottom: 30px;
          font-weight: 300;
        }

        .su-form-sub a {
          color: #818cf8;
          text-decoration: none;
          font-weight: 500;
        }

        .su-field {
          margin-bottom: 16px;
          position: relative;
        }

        .su-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 7px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .su-input-wrap { position: relative; }

        .su-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #374151;
          transition: color 0.2s;
          pointer-events: none;
        }

        .su-input-wrap:focus-within .su-input-icon { color: #818cf8; }

        .su-input {
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

        .su-input::placeholder { color: #374151; }

        .su-input:focus {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.05);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }

        .su-grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .su-role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 16px;
        }

        .su-role-chip {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          color: #6b7280;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .su-role-chip:hover {
          border-color: rgba(99,102,241,0.3);
          color: #a5b4fc;
        }

        .su-role-chip.selected {
          border-color: rgba(99,102,241,0.5);
          background: rgba(99,102,241,0.1);
          color: #818cf8;
          box-shadow: 0 0 0 2px rgba(99,102,241,0.1);
        }

        .su-btn {
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

        .su-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
          pointer-events: none;
        }

        .su-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(99,102,241,0.45);
        }

        .su-btn:active { transform: translateY(0); }

        .su-btn-ghost {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          color: #6b7280;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          margin-top: 10px;
          transition: all 0.2s;
        }

        .su-btn-ghost:hover {
          border-color: rgba(99,102,241,0.3);
          color: #818cf8;
        }

        /* success screen */
        .su-success {
          text-align: center;
          padding: 20px 0;
        }

        .su-success-icon {
          width: 72px; height: 72px;
          border-radius: 50%;
          background: rgba(52,211,153,0.12);
          border: 2px solid rgba(52,211,153,0.3);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 24px;
          animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }

        @keyframes popIn {
          0%   { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .su-footer {
          text-align: center;
          margin-top: 28px;
          font-size: 12px;
          color: #1f2937;
        }

        .su-footer a { color: #4b5563; text-decoration: none; }

        /* ── LEFT PANEL ── */
        .su-left {
          order: 2;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px 56px;
          background: linear-gradient(145deg, #080c1a 0%, #0b1228 50%, #060a18 100%);
          overflow: hidden;
        }

        .su-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 50% at 80% 30%, rgba(99,102,241,0.18) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 20% 70%, rgba(139,92,246,0.14) 0%, transparent 70%);
          pointer-events: none;
        }

        .su-grid-overlay {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }

        .su-particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(139,92,246,0.6);
          animation: floatUp2 var(--dur) var(--delay) ease-in-out infinite alternate;
          pointer-events: none;
        }

        @keyframes floatUp2 {
          0%   { transform: translateY(0) scale(1); opacity: 0.3; }
          100% { transform: translateY(-28px) scale(1.4); opacity: 0.7; }
        }

        .su-stats {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 44px;
        }

        .su-stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(99,102,241,0.14);
          border-radius: 16px;
          padding: 20px;
          backdrop-filter: blur(10px);
        }

        .su-stat-number {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 4px;
          letter-spacing: -0.03em;
        }

        .su-stat-number span {
          background: linear-gradient(90deg, #818cf8, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .su-stat-label {
          font-size: 12px;
          color: #4b5563;
          font-weight: 400;
        }

        .su-stat-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
        }

        .su-testimonial {
          position: relative;
          z-index: 2;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(99,102,241,0.14);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .su-quote {
          font-size: 14px;
          color: #9ca3af;
          line-height: 1.7;
          font-style: italic;
          font-weight: 300;
          margin-bottom: 16px;
        }

        .su-quote::before {
          content: '"';
          font-size: 36px;
          color: #6366f1;
          line-height: 0;
          vertical-align: -14px;
          margin-right: 4px;
          font-style: normal;
        }

        .su-reviewer {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .su-reviewer-avatar {
          width: 36px; height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          font-family: 'Syne', sans-serif;
        }

        .su-reviewer-name {
          font-size: 13px;
          font-weight: 600;
          color: #e5e7eb;
          font-family: 'Syne', sans-serif;
        }

        .su-reviewer-role {
          font-size: 11px;
          color: #4b5563;
        }

        .su-tagline {
          position: relative;
          z-index: 2;
        }

        .su-tagline h2 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(24px, 2.5vw, 36px);
          font-weight: 800;
          color: #fff;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }

        .su-tagline h2 span {
          background: linear-gradient(90deg, #818cf8, #a78bfa, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .su-tagline p {
          color: #4b5563;
          font-size: 14px;
          line-height: 1.7;
          max-width: 340px;
          font-weight: 300;
        }

        @media (max-width: 768px) {
          .su-root { grid-template-columns: 1fr; }
          .su-left  { display: none; }
          .su-right { padding: 40px 28px; }
        }
      `}</style>

      <div className="su-root">
        {/* ── FORM (left column in grid) ── */}
        <div className="su-right">
          <div className="su-form-wrap">
            <div className="su-logo-row">
              <div className="su-logo-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 6l7-3 7 3v8l-7 3-7-3V6z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M3 6l7 3m0 8V9m7-3l-7 3" stroke="#fff" strokeWidth="1.5" />
                </svg>
              </div>
              <span className="su-logo-text">DevCollab</span>
            </div>

            {/* Stepper */}
            <div className="su-steps">
              {steps.map((s, i) => (
                <>
                  <div className="su-step" key={s}>
                    <div className={`su-step-num ${i < step ? "done" : i === step ? "active" : "idle"}`}>
                      {i < step ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`su-step-label ${i < step ? "done" : i === step ? "active" : "idle"}`}>{s}</span>
                  </div>
                  {i < steps.length - 1 && <div className="su-step-line" key={`line-${i}`} />}
                </>
              ))}
            </div>

            {step === 0 && (
              <>
                <h2 className="su-form-title">Create your account</h2>
                <p className="su-form-sub">
                  Already have one? <a href="/login">Sign in →</a>
                </p>

                <div className="su-grid2">
                  <div className="su-field">
                    <label className="su-label">First name</label>
                    <div className="su-input-wrap">
                      <svg className="su-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                      <input type="text" placeholder="Alex" className="su-input" onChange={set("name")} />
                    </div>
                  </div>
                  <div className="su-field">
                    <label className="su-label">Last name</label>
                    <div className="su-input-wrap">
                      <svg className="su-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                      <input type="text" placeholder="Rivera" className="su-input" />
                    </div>
                  </div>
                </div>

                <div className="su-field">
                  <label className="su-label">Work email</label>
                  <div className="su-input-wrap">
                    <svg className="su-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8l10 6 10-6" />
                    </svg>
                    <input type="email" placeholder="alex@company.dev" className="su-input" onChange={set("email")} />
                  </div>
                </div>

                <div className="su-field">
                  <label className="su-label">Password</label>
                  <div className="su-input-wrap">
                    <svg className="su-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input type="password" placeholder="Min. 8 characters" className="su-input" onChange={set("password")} />
                  </div>
                </div>

                <button className="su-btn" onClick={() => setStep(1)}>
                  Continue →
                </button>
              </>
            )}

            {step === 1 && (
              <>
                <h2 className="su-form-title">Tell us about you</h2>
                <p className="su-form-sub">Help us personalize your workspace</p>

                <label className="su-label" style={{ marginBottom: 10 }}>I am a…</label>
                <div className="su-role-grid">
                  {["Frontend Dev", "Backend Dev", "Full Stack", "DevOps", "Designer", "Manager"].map((r) => (
                    <div
                      key={r}
                      className={`su-role-chip ${form.role === r ? "selected" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, role: r }))}
                    >
                      {r}
                    </div>
                  ))}
                </div>

                <div className="su-field">
                  <label className="su-label">Team / Company name</label>
                  <div className="su-input-wrap">
                    <svg className="su-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <input type="text" placeholder="Acme Inc." className="su-input" onChange={set("team")} />
                  </div>
                </div>

                <button className="su-btn" onClick={() => { handleSignup(); setStep(2); }}>
                  Create my workspace 🚀
                </button>
                <button className="su-btn-ghost" onClick={() => setStep(0)}>
                  ← Back
                </button>
              </>
            )}

            {step === 2 && (
              <div className="su-success">
                <div className="su-success-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="su-form-title" style={{ textAlign: "center" }}>You're all set!</h2>
                <p className="su-form-sub" style={{ textAlign: "center", margin: "8px auto 32px" }}>
                  Your DevCollab workspace is ready. Time to build something incredible.
                </p>
                <button className="su-btn" onClick={() => alert("Opening workspace!")}>
                  Open my workspace →
                </button>
              </div>
            )}

            {step < 2 && (
              <div className="su-footer">
                By creating an account you agree to our{" "}
                <a href="/terms">Terms</a> &amp; <a href="/privacy">Privacy</a>
              </div>
            )}
          </div>
        </div>

        {/* ── ILLUSTRATION (right column in grid) ── */}
        <div className="su-left">
          <div className="su-grid-overlay" />
          {floatingParticles.map((p) => (
            <div
              key={p.id}
              className="su-particle"
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

          <div className="su-stats">
            {[
              { icon: "👥", num: "12K+",  label: "Active developers",  bg: "rgba(99,102,241,0.1)"  },
              { icon: "⚡", num: "98ms",   label: "Avg. sync latency",   bg: "rgba(251,191,36,0.08)" },
              { icon: "🚀", num: "340K+",  label: "Sessions launched",   bg: "rgba(52,211,153,0.08)" },
              { icon: "🛡️", num: "99.9%",  label: "Uptime guaranteed",   bg: "rgba(244,63,94,0.08)"  },
            ].map((s) => (
              <div className="su-stat-card" key={s.label}>
                <div className="su-stat-icon" style={{ background: s.bg }}>
                  <span style={{ fontSize: 16 }}>{s.icon}</span>
                </div>
                <div className="su-stat-number"><span>{s.num}</span></div>
                <div className="su-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="su-testimonial">
            <div className="su-quote">
              DevCollab cut our code-review cycle from two days to two hours.
              It's the missing piece every remote team needs.
            </div>
            <div className="su-reviewer">
              <div className="su-reviewer-avatar">M</div>
              <div>
                <div className="su-reviewer-name">Maya Chen</div>
                <div className="su-reviewer-role">Engineering Lead · Stripe</div>
              </div>
            </div>
          </div>

          <div className="su-tagline">
            <h2>Join thousands of<br /><span>elite dev teams.</span></h2>
            <p>
              From solo hackers to enterprise squads — DevCollab scales with you,
              keeping everyone in sync without the noise.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Signup;