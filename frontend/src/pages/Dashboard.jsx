import { useEffect, useState } from "react";
import API from "../services/api";

// ─── mock data for preview (remove when API is live) ──────────────────────────
const MOCK_BOARDS = [
  {
    _id: "b1", name: "Frontend Sprint", color: "#6366f1",
    tasks: [
      { _id: "t1", title: "Redesign login page", status: "done",    assignee: "A", priority: "high"   },
      { _id: "t2", title: "Build dashboard UI",  status: "active",  assignee: "S", priority: "high"   },
      { _id: "t3", title: "Write unit tests",    status: "idle",    assignee: "R", priority: "medium" },
    ],
  },
  {
    _id: "b2", name: "Backend API", color: "#10b981",
    tasks: [
      { _id: "t4", title: "Auth middleware",      status: "done",   assignee: "K", priority: "high"   },
      { _id: "t5", title: "WebSocket server",     status: "active", assignee: "A", priority: "high"   },
      { _id: "t6", title: "Rate limiting",        status: "idle",   assignee: "S", priority: "low"    },
    ],
  },
  {
    _id: "b3", name: "DevOps", color: "#f59e0b",
    tasks: [
      { _id: "t7", title: "CI/CD pipeline",       status: "active", assignee: "R", priority: "medium" },
      { _id: "t8", title: "Docker compose setup", status: "idle",   assignee: "K", priority: "low"    },
    ],
  },
  {
    _id: "b4", name: "Design System", color: "#ec4899",
    tasks: [
      { _id: "t9",  title: "Token library",       status: "done",   assignee: "A", priority: "medium" },
      { _id: "t10", title: "Component storybook", status: "active", assignee: "S", priority: "high"   },
    ],
  },
];

const AVATAR_COLORS = { A: "#6366f1", S: "#ec4899", R: "#f59e0b", K: "#10b981" };

const STATUS_META = {
  done:   { label: "Done",        dot: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)"  },
  active: { label: "In Progress", dot: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)"  },
  idle:   { label: "Todo",        dot: "#6b7280", bg: "rgba(107,114,128,0.06)", border: "rgba(107,114,128,0.15)" },
};

const PRIORITY_META = {
  high:   { label: "High",   color: "#f87171" },
  medium: { label: "Med",    color: "#fbbf24" },
  low:    { label: "Low",    color: "#34d399" },
};

export default function Dashboard() {
  const [boards, setBoards]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeBoard, setActiveBoard] = useState(null);
  const [filter, setFilter]       = useState("all");
  const [loaded, setLoaded]       = useState(false);

  const fetchBoards = async () => {
    try {
      const res = await API.get("/boards");
      setBoards(res.data);
      setActiveBoard(res.data[0]?._id ?? null);
    } catch {
      // fallback to mock
      setBoards(MOCK_BOARDS);
      setActiveBoard(MOCK_BOARDS[0]._id);
    } finally {
      setLoading(false);
      setTimeout(() => setLoaded(true), 60);
    }
  };

  useEffect(() => { fetchBoards(); }, []);

  const current   = boards.find((b) => b._id === activeBoard);
  const allTasks  = boards.flatMap((b) => b.tasks ?? []);
  const doneTasks = allTasks.filter((t) => t.status === "done").length;
  const actTasks  = allTasks.filter((t) => t.status === "active").length;
  const filtered  = filter === "all"
    ? (current?.tasks ?? [])
    : (current?.tasks ?? []).filter((t) => t.status === filter);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user?.name || "Developer";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #04050a; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 4px; }

        .db-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 240px 1fr;
          grid-template-rows: 64px 1fr;
          background: #04050a;
          font-family: 'DM Sans', sans-serif;
          color: #fff;
        }

        /* ── TOPBAR ── */
        .db-topbar {
          grid-column: 1 / -1;
          display: flex;
          align-items: center;
          padding: 0 28px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(4,5,10,0.9);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 100;
          gap: 16px;
        }

        .db-logo {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-right: 20px;
        }

        .db-logo-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 16px rgba(99,102,241,0.35);
        }

        .db-logo-text {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .db-search {
          flex: 1;
          max-width: 360px;
          position: relative;
        }

        .db-search input {
          width: 100%;
          padding: 8px 14px 8px 36px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          color: #9ca3af;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          outline: none;
          transition: all 0.2s;
        }

        .db-search input:focus {
          border-color: rgba(99,102,241,0.4);
          background: rgba(99,102,241,0.05);
          color: #fff;
        }

        .db-search-icon {
          position: absolute;
          left: 11px; top: 50%;
          transform: translateY(-50%);
          color: #374151;
          pointer-events: none;
        }

        .db-topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
        }

        .db-live-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(52,211,153,0.08);
          border: 1px solid rgba(52,211,153,0.2);
          border-radius: 20px;
          padding: 5px 12px;
          font-size: 11px;
          color: #34d399;
          font-weight: 500;
        }

        .db-live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #34d399;
          animation: pulse-g 1.4s ease-in-out infinite;
        }

        @keyframes pulse-g {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:.4; transform:scale(1.6); }
        }

        .db-notif {
          width: 34px; height: 34px;
          border-radius: 9px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #6b7280;
          position: relative;
          transition: all 0.2s;
        }

        .db-notif:hover { border-color: rgba(99,102,241,0.3); color: #818cf8; }

        .db-notif-dot {
          position: absolute;
          top: 6px; right: 6px;
          width: 6px; height: 6px;
          background: #6366f1;
          border-radius: 50%;
          border: 1.5px solid #04050a;
        }

        .db-user-avatar {
          width: 34px; height: 34px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700;
          font-family: 'Syne', sans-serif;
          cursor: pointer;
          border: 2px solid rgba(99,102,241,0.3);
        }

        /* ── SIDEBAR ── */
        .db-sidebar {
          border-right: 1px solid rgba(255,255,255,0.05);
          padding: 24px 16px;
          overflow-y: auto;
          background: rgba(4,5,10,0.6);
        }

        .db-sidebar-section {
          margin-bottom: 28px;
        }

        .db-sidebar-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #374151;
          padding: 0 8px;
          margin-bottom: 8px;
        }

        .db-nav-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border-radius: 10px;
          font-size: 13px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.18s;
          margin-bottom: 2px;
          font-weight: 400;
        }

        .db-nav-item:hover {
          background: rgba(255,255,255,0.04);
          color: #d1d5db;
        }

        .db-nav-item.active {
          background: rgba(99,102,241,0.12);
          color: #818cf8;
          font-weight: 500;
        }

        .db-board-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border-radius: 10px;
          font-size: 13px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.18s;
          margin-bottom: 2px;
        }

        .db-board-item:hover { background: rgba(255,255,255,0.04); color: #d1d5db; }
        .db-board-item.selected { background: rgba(99,102,241,0.1); color: #e5e7eb; }

        .db-board-color {
          width: 8px; height: 8px;
          border-radius: 2px;
          flex-shrink: 0;
        }

        .db-board-count {
          margin-left: auto;
          font-size: 10px;
          background: rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 1px 7px;
          color: #4b5563;
        }

        /* ── MAIN ── */
        .db-main {
          overflow-y: auto;
          padding: 32px 36px;
          opacity: ${loaded ? 1 : 0};
          transform: ${loaded ? "translateY(0)" : "translateY(16px)"};
          transition: opacity 0.5s, transform 0.5s;
        }

        .db-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .db-greeting {
          font-family: 'Syne', sans-serif;
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }

        .db-greeting span {
          background: linear-gradient(90deg, #818cf8, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .db-sub {
          font-size: 13px;
          color: #4b5563;
          font-weight: 300;
        }

        .db-new-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 10px 18px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(99,102,241,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .db-new-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(99,102,241,0.4);
        }

        /* ── STAT CARDS ── */
        .db-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 32px;
        }

        .db-stat {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 20px;
          transition: border-color 0.2s;
        }

        .db-stat:hover { border-color: rgba(99,102,241,0.25); }

        .db-stat-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }

        .db-stat-icon-wrap {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }

        .db-stat-badge {
          font-size: 10px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 20px;
        }

        .db-stat-num {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 4px;
        }

        .db-stat-lbl {
          font-size: 12px;
          color: #4b5563;
          font-weight: 400;
        }

        /* ── BOARD SECTION ── */
        .db-board-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
        }

        .db-board-title {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.01em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .db-board-dot {
          width: 10px; height: 10px;
          border-radius: 3px;
        }

        .db-filters {
          display: flex;
          gap: 6px;
          margin-left: auto;
        }

        .db-filter-chip {
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.07);
          background: transparent;
          color: #6b7280;
          transition: all 0.18s;
          font-family: 'DM Sans', sans-serif;
        }

        .db-filter-chip:hover { color: #d1d5db; border-color: rgba(255,255,255,0.15); }

        .db-filter-chip.on {
          background: rgba(99,102,241,0.12);
          border-color: rgba(99,102,241,0.35);
          color: #818cf8;
        }

        /* ── TASKS ── */
        .db-tasks {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }

        .db-task {
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
          animation: slideIn 0.3s ease forwards;
          opacity: 0;
          transform: translateY(8px);
        }

        @keyframes slideIn {
          to { opacity: 1; transform: translateY(0); }
        }

        .db-task:hover {
          border-color: rgba(99,102,241,0.3);
          background: rgba(99,102,241,0.04);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        }

        .db-task-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .db-status-chip {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.03em;
        }

        .db-status-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
        }

        .db-priority-chip {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255,255,255,0.04);
        }

        .db-task-title {
          font-size: 14px;
          font-weight: 500;
          color: #e5e7eb;
          margin-bottom: 14px;
          line-height: 1.4;
        }

        .db-task-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .db-task-avatar {
          width: 24px; height: 24px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700;
          font-family: 'Syne', sans-serif;
          color: #fff;
        }

        .db-task-id {
          font-size: 10px;
          color: #1f2937;
          font-family: 'DM Mono', monospace;
        }

        /* ── EMPTY ── */
        .db-empty {
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 0;
          color: #374151;
        }

        .db-empty-icon { font-size: 40px; margin-bottom: 12px; }
        .db-empty-text { font-size: 14px; }

        /* ── LOADING ── */
        .db-skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
          border-radius: 10px;
        }

        @keyframes shimmer { to { background-position: -200% 0; } }

        @media (max-width: 900px) {
          .db-root { grid-template-columns: 1fr; }
          .db-sidebar { display: none; }
          .db-stats { grid-template-columns: 1fr 1fr; }
          .db-main { padding: 20px; }
        }
      `}</style>

      <div className="db-root">
        {/* ── TOPBAR ── */}
        <header className="db-topbar">
          <div className="db-logo">
            <div className="db-logo-icon">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M3 6l7-3 7 3v8l-7 3-7-3V6z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M3 6l7 3m0 8V9m7-3l-7 3" stroke="#fff" strokeWidth="1.5" />
              </svg>
            </div>
            <span className="db-logo-text">DevCollab</span>
          </div>

          <div className="db-search">
            <svg className="db-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input placeholder="Search tasks, boards…" />
          </div>

          <div className="db-topbar-right">
            <div className="db-live-badge">
              <div className="db-live-dot" />
              Live sync
            </div>
            <div className="db-notif">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <div className="db-notif-dot" />
            </div>
            <div className="db-user-avatar">
              {username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* ── SIDEBAR ── */}
        <aside className="db-sidebar">
          <div className="db-sidebar-section">
            <div className="db-sidebar-label">Navigation</div>
            {[
              { icon: "⊞", label: "Dashboard", active: true },
              { icon: "◈", label: "My Tasks" },
              { icon: "⌖", label: "Calendar" },
              { icon: "⊛", label: "Analytics" },
            ].map((n) => (
              <div key={n.label} className={`db-nav-item ${n.active ? "active" : ""}`}>
                <span style={{ fontSize: 14 }}>{n.icon}</span>
                {n.label}
              </div>
            ))}
          </div>

          <div className="db-sidebar-section">
            <div className="db-sidebar-label">Boards</div>
            {boards.map((b) => (
              <div
                key={b._id}
                className={`db-board-item ${activeBoard === b._id ? "selected" : ""}`}
                onClick={() => setActiveBoard(b._id)}
              >
                <div className="db-board-color" style={{ background: b.color }} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {b.name}
                </span>
                <span className="db-board-count">{b.tasks?.length ?? 0}</span>
              </div>
            ))}
          </div>

          <div className="db-sidebar-section">
            <div className="db-sidebar-label">Team</div>
            {[
              { initial: "A", name: "Alex R.",  color: "#6366f1", online: true  },
              { initial: "S", name: "Sara M.",  color: "#ec4899", online: true  },
              { initial: "R", name: "Ravi K.",  color: "#f59e0b", online: false },
              { initial: "K", name: "Kim L.",   color: "#10b981", online: true  },
            ].map((m) => (
              <div key={m.name} className="db-nav-item" style={{ gap: 10 }}>
                <div style={{
                  width: 26, height: 26,
                  borderRadius: "50%",
                  background: m.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "#fff",
                  fontFamily: "Syne, sans-serif",
                  flexShrink: 0,
                  position: "relative",
                }}>
                  {m.initial}
                  {m.online && (
                    <div style={{
                      position: "absolute", bottom: 0, right: 0,
                      width: 7, height: 7,
                      background: "#34d399",
                      borderRadius: "50%",
                      border: "1.5px solid #04050a",
                    }} />
                  )}
                </div>
                <span style={{ fontSize: 12 }}>{m.name}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="db-main">
          {/* Header */}
          <div className="db-header">
            <div>
              <div className="db-greeting">
                Good morning, <span>{username}</span> 👋
              </div>
              <div className="db-sub">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                &nbsp;·&nbsp; {boards.length} active boards
              </div>
            </div>
            <button className="db-new-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Task
            </button>
          </div>

          {/* Stats */}
          <div className="db-stats">
            {[
              { icon: "📋", label: "Total tasks",     value: allTasks.length,  badge: "+12%",  badgeColor: "#34d399", bg: "rgba(99,102,241,0.08)"  },
              { icon: "⚡", label: "In progress",     value: actTasks,         badge: "Active", badgeColor: "#818cf8", bg: "rgba(99,102,241,0.08)"  },
              { icon: "✅", label: "Completed",       value: doneTasks,        badge: `${allTasks.length ? Math.round(doneTasks/allTasks.length*100) : 0}%`, badgeColor: "#34d399", bg: "rgba(52,211,153,0.08)"  },
              { icon: "👥", label: "Collaborators",   value: 4,                badge: "Online", badgeColor: "#f59e0b", bg: "rgba(245,158,11,0.08)"  },
            ].map((s, i) => (
              <div className="db-stat" key={s.label} style={{ animationDelay: `${i * 80}ms` }}>
                <div className="db-stat-top">
                  <div className="db-stat-icon-wrap" style={{ background: s.bg }}>
                    <span>{s.icon}</span>
                  </div>
                  <div
                    className="db-stat-badge"
                    style={{ color: s.badgeColor, background: `${s.badgeColor}18`, border: `1px solid ${s.badgeColor}30` }}
                  >
                    {s.badge}
                  </div>
                </div>
                <div className="db-stat-num">{s.value}</div>
                <div className="db-stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Board tasks */}
          {loading ? (
            <div className="db-tasks">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="db-skeleton" style={{ height: 110, animationDelay: `${i * 100}ms` }} />
              ))}
            </div>
          ) : (
            <>
              <div className="db-board-header">
                <div className="db-board-title">
                  <div
                    className="db-board-dot"
                    style={{ background: current?.color ?? "#6366f1" }}
                  />
                  {current?.name ?? "Select a board"}
                </div>
                <div className="db-filters">
                  {["all", "active", "idle", "done"].map((f) => (
                    <button
                      key={f}
                      className={`db-filter-chip ${filter === f ? "on" : ""}`}
                      onClick={() => setFilter(f)}
                    >
                      {f === "all" ? "All" : STATUS_META[f]?.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="db-tasks">
                {filtered.length === 0 ? (
                  <div className="db-empty">
                    <div className="db-empty-icon">🗂️</div>
                    <div className="db-empty-text">No tasks here yet</div>
                  </div>
                ) : (
                  filtered.map((task, i) => {
                    const sm = STATUS_META[task.status];
                    const pm = PRIORITY_META[task.priority];
                    return (
                      <div
                        key={task._id}
                        className="db-task"
                        style={{ animationDelay: `${i * 60}ms` }}
                      >
                        <div className="db-task-top">
                          <div
                            className="db-status-chip"
                            style={{ background: sm.bg, border: `1px solid ${sm.border}` }}
                          >
                            <div className="db-status-dot" style={{ background: sm.dot }} />
                            <span style={{ color: sm.dot }}>{sm.label}</span>
                          </div>
                          <span className="db-priority-chip" style={{ color: pm.color }}>
                            {pm.label}
                          </span>
                        </div>

                        <div className="db-task-title">{task.title}</div>

                        <div className="db-task-footer">
                          <div
                            className="db-task-avatar"
                            style={{ background: AVATAR_COLORS[task.assignee] ?? "#6366f1" }}
                          >
                            {task.assignee}
                          </div>
                          <span className="db-task-id">#{task._id.slice(-4)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}