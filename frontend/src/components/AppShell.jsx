import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import API from "../services/api";
import { toast } from "react-hot-toast";

/* ─── Icons ──────────────────────────────────────────────────── */
const IconLogo = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M3 6l7-3 7 3v8l-7 3-7-3V6z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M3 6l7 3m0 8V9m7-3l-7 3" stroke="#fff" strokeWidth="1.5"/>
  </svg>
);
const IconHash   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>;
const IconPlus   = ({ size=14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconDM     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const IconFolder = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconChevron = ({ open }) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>;
const IconLogout = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const IconBriefcase = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>;
const IconLock = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

const ROLE_COLORS = {
  owner:  { bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
  admin:  { bg: "rgba(99,102,241,0.15)",  color: "#818cf8" },
  member: { bg: "rgba(148,163,184,0.1)",  color: "#94a3b8" },
};

export default function AppShell({ children }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const {
    workspaces, activeWorkspace, setActiveWorkspace,
    channels, members, userRole, loadingChannels,
    refreshWorkspaces, refreshChannels
  } = useWorkspace();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [sectionsOpen, setSectionsOpen] = useState({
    channels: true,
    dms: true,
    projects: true,
  });

  const [newChannelName, setNewChannelName]   = useState("");
  const [showNewChannel, setShowNewChannel]   = useState(false);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [collapsed, setCollapsed]             = useState(false);

  const toggle = (key) => setSectionsOpen(p => ({ ...p, [key]: !p[key] }));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim() || !activeWorkspace) return;
    setCreatingChannel(true);
    try {
      const res = await API.post("/channels", {
        name: newChannelName.trim(),
        workspaceId: activeWorkspace._id
      });
      toast.success(`#${res.data.name} created`);
      setNewChannelName("");
      setShowNewChannel(false);
      refreshChannels();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create channel");
    } finally {
      setCreatingChannel(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-base, #07090f)" }}>

      {/* ── Sidebar ────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? 60 : 260,
        minWidth: collapsed ? 60 : 260,
        height: "100vh",
        background: "rgba(10,13,22,0.95)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease, min-width 0.25s ease",
        overflow: "hidden",
        backdropFilter: "blur(20px)",
        zIndex: 50,
      }}>

        {/* Logo + Collapse button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconLogo />
              </div>
              <span style={{ fontFamily: "var(--font-display, Figtree)", fontWeight: 800, fontSize: 16, color: "#fff", letterSpacing: "-0.02em" }}>DevSpace</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(p => !p)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 6, borderRadius: 8, transition: "color 0.2s", marginLeft: collapsed ? "auto" : 0 }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Workspace Switcher */}
        {!collapsed && (
          <div style={{ padding: "12px 12px 8px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6, paddingLeft: 4 }}>Workspace</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {workspaces.map(ws => (
                <button
                  key={ws._id}
                  onClick={() => { setActiveWorkspace(ws); navigate(`/projects/${ws._id}`); }}
                  style={{
                    width: "100%", textAlign: "left", background: activeWorkspace?._id === ws._id ? "rgba(99,102,241,0.15)" : "none",
                    border: activeWorkspace?._id === ws._id ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
                    borderRadius: 10, padding: "8px 10px", cursor: "pointer",
                    color: activeWorkspace?._id === ws._id ? "#818cf8" : "rgba(255,255,255,0.7)",
                    fontSize: 13, fontWeight: activeWorkspace?._id === ws._id ? 600 : 400,
                    display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s"
                  }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                    {ws.name[0].toUpperCase()}
                  </div>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ws.name}</span>
                </button>
              ))}
              <button
                onClick={() => navigate("/dashboard")}
                style={{ width: "100%", textAlign: "left", background: "none", border: "1.5px dashed rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 10px", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 12, display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
              >
                <IconPlus size={12}/> New Workspace
              </button>
            </div>
          </div>
        )}

        {/* Scrollable nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px", display: "flex", flexDirection: "column", gap: 2 }}>

          {!collapsed && activeWorkspace && (
            <>
              {/* ── Channels ── */}
              <div style={{ marginTop: 8 }}>
                <button onClick={() => toggle("channels")} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <IconChevron open={sectionsOpen.channels}/> Channels
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowNewChannel(p => !p); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 2, borderRadius: 4, display: "flex", alignItems: "center" }}
                    title="New channel"
                  ><IconPlus size={11}/></button>
                </button>

                {showNewChannel && (
                  <form onSubmit={handleCreateChannel} style={{ padding: "6px 4px", display: "flex", gap: 6 }}>
                    <input
                      autoFocus placeholder="channel-name" value={newChannelName}
                      onChange={e => setNewChannelName(e.target.value)}
                      style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "5px 8px", color: "#fff", fontSize: 12, outline: "none" }}
                    />
                    <button type="submit" disabled={creatingChannel} style={{ background: "rgba(99,102,241,0.8)", border: "none", borderRadius: 7, padding: "5px 10px", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                      {creatingChannel ? "…" : "Add"}
                    </button>
                  </form>
                )}

                {sectionsOpen.channels && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 2 }}>
                    {loadingChannels ? (
                      <div style={{ padding: "4px 8px", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Loading…</div>
                    ) : channels.length === 0 ? (
                      <div style={{ padding: "4px 8px", fontSize: 12, color: "rgba(255,255,255,0.25)" }}>No channels yet</div>
                    ) : channels.map(ch => (
                      <Link key={ch._id} to={`/channels/${ch._id}?workspaceId=${activeWorkspace._id}`}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8,
                          color: isActive(`/channels/${ch._id}`) ? "#818cf8" : "rgba(255,255,255,0.6)",
                          background: isActive(`/channels/${ch._id}`) ? "rgba(99,102,241,0.12)" : "none",
                          textDecoration: "none", fontSize: 13, fontWeight: isActive(`/channels/${ch._id}`) ? 600 : 400,
                          transition: "all 0.15s"
                        }}
                      >
                        {ch.isPrivate ? <IconLock/> : <IconHash/>}
                        {ch.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* ── DMs ── */}
              <div style={{ marginTop: 12 }}>
                <button onClick={() => toggle("dms")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  <IconChevron open={sectionsOpen.dms}/> Direct Messages
                </button>
                {sectionsOpen.dms && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, marginTop: 2 }}>
                    {members.filter(m => {
                      const memberId = m.userId?._id || m.userId;
                      const myId = JSON.parse(localStorage.getItem("user") || "{}")._id;
                      return memberId?.toString() !== myId?.toString();
                    }).map(m => {
                      const memberId = m.userId?._id || m.userId;
                      const memberName = m.userId?.name || "Unknown";
                      const roleStyle = ROLE_COLORS[m.role] || ROLE_COLORS.member;
                      return (
                        <Link key={memberId} to={`/dm/${memberId}?workspaceId=${activeWorkspace._id}`}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8,
                            color: "rgba(255,255,255,0.65)", background: "none", textDecoration: "none", fontSize: 13, transition: "all 0.15s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                          onMouseLeave={e => e.currentTarget.style.background = "none"}
                        >
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, flexShrink: 0 }}>
                            {memberName[0].toUpperCase()}
                          </div>
                          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{memberName}</span>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 20, background: roleStyle.bg, color: roleStyle.color }}>
                            {m.role}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Projects ── */}
              <div style={{ marginTop: 12 }}>
                <button onClick={() => toggle("projects")} style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  <IconChevron open={sectionsOpen.projects}/> Projects
                </button>
                {sectionsOpen.projects && (
                  <div style={{ marginTop: 2 }}>
                    <Link to={`/projects/${activeWorkspace._id}`}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: 13, transition: "all 0.15s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    >
                      <IconFolder/> View Projects
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── User footer ── */}
        <div style={{ padding: "12px 12px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {(user.name || "U")[0].toUpperCase()}
          </div>
          {!collapsed && (
            <>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name || "User"}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email || ""}</div>
              </div>
              <button onClick={handleLogout} title="Logout" style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 6, borderRadius: 8, display: "flex", alignItems: "center", transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
              ><IconLogout/></button>
            </>
          )}
        </div>
      </aside>

      {/* ── Main content area ─────────────────────────── */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}
