import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import ActivityLog from "../components/ActivityLog";
import MembersSidebar from "../components/MembersSidebar";
import InviteModal from "../components/InviteModal";
import AppShell from "../components/AppShell";
import NotificationBell from "../components/NotificationBell";
import { useWorkspace } from "../context/WorkspaceContext";

/* ─── Icons ──────────────────────────────────────────────────── */
const IconPlus     = ({ size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconFolder   = ({ size=20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>;
const IconBack     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;
const IconArrow    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>;
const IconActivity = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconUsers    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconTrash    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;

// Project color gradients — assigned by index
const PROJECT_GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#0ea5e9,#6366f1)",
  "linear-gradient(135deg,#10b981,#0ea5e9)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
  "linear-gradient(135deg,#14b8a6,#6366f1)",
];

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/* ═══════════════════════════════════════════════════════════════ */
const Projects = () => {
  const { workspaceId } = useParams();
  const navigate        = useNavigate();
  const { workspaces, setActiveWorkspace } = useWorkspace();

  const [projects,   setProjects]   = useState([]);
  const [workspace,  setWorkspace]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [members,    setMembers]    = useState([]);
  const [userRole,   setUserRole]   = useState("member");

  // Sidebars / Modals
  const [showMembers,    setShowMembers]    = useState(false);
  const [showActivity,   setShowActivity]   = useState(false);
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [isInviteOpen,   setIsInviteOpen]   = useState(false);

  // Form
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [creating,    setCreating]    = useState(false);

  useEffect(() => {
    fetchWorkspace();
    fetchProjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    try {
      const res = await API.get("/workspaces");
      const current = res.data.find(w => w._id === workspaceId);
      setWorkspace(current);

      // Sync context
      if (current) setActiveWorkspace(current);

      const userId = JSON.parse(localStorage.getItem("user") || "{}")._id;
      const m = current?.members?.find(
        m => m.userId?.toString() === userId || m.userId?._id?.toString() === userId
      );
      if (m) setUserRole(m.role);

      fetchMembers();
    } catch (err) { console.error(err); }
  };

  const fetchMembers = async () => {
    try {
      const res = await API.get(`/workspaces/${workspaceId}/members`);
      setMembers(res.data);
    } catch (err) { console.error("fetchMembers:", err); }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/projects/${workspaceId}`);
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    const t = toast.loading("Creating project…");
    try {
      const res = await API.post("/projects", { name: name.trim(), workspaceId, description });
      toast.success("Project created!", { id: t });
      setProjects(prev => [...prev, res.data]);
      setName("");
      setDescription("");
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create project", { id: t });
    } finally {
      setCreating(false);
    }
  };

  const isAdmin = userRole === "owner" || userRole === "admin";

  return (
    <AppShell>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#07090f" }}>

        {/* ── Top bar ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 64, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,13,22,0.9)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 20, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => navigate("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", padding: 6, borderRadius: 8, transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
            ><IconBack/></button>
            <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }}/>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, letterSpacing: "0.06em" }}>Workspace</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", fontFamily: "Figtree, sans-serif" }}>{workspace?.name || "…"}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <NotificationBell/>
            <button onClick={() => setShowActivity(p => !p)} style={{ background: showActivity ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", transition: "all 0.2s" }} title="Activity">
              <IconActivity/>
            </button>
            <button onClick={() => setShowMembers(p => !p)} style={{ background: showMembers ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", transition: "all 0.2s" }} title="Members">
              <IconUsers/>
            </button>
            {isAdmin && (
              <>
                <button onClick={() => setIsInviteOpen(true)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; e.currentTarget.style.color = "#818cf8"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}
                >
                  <IconPlus size={13}/> Invite
                </button>
                <button onClick={() => setIsModalOpen(true)} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <IconPlus size={13}/> New Project
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Page header stat bar ── */}
        <div style={{ padding: "20px 32px 0" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Projects</div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "Figtree, sans-serif", letterSpacing: "-0.02em" }}>
                {workspace?.name}
              </h1>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#818cf8" }}>{projects.length}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Projects</div>
              </div>
              <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.08)" }}/>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#34d399" }}>{members.length}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Members</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Project grid ── */}
        <div style={{ padding: "0 32px 40px", flex: 1 }}>
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ height: 180, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i*100}ms` }}/>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", textAlign: "center" }}>
              <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: "#818cf8" }}>
                <IconFolder size={36}/>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 8 }}>No projects yet</div>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", maxWidth: 340, lineHeight: 1.6, marginBottom: 24 }}>
                Create your first project to start organising tasks and collaborating with your team.
              </p>
              {isAdmin && (
                <button onClick={() => setIsModalOpen(true)} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 12, padding: "12px 28px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                  Create First Project →
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
              {projects.map((p, i) => (
                <div
                  key={p._id}
                  onClick={() => navigate(`/boards/${p._id}`, { state: { workspaceId } })}
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px 20px 16px", cursor: "pointer", transition: "all 0.2s", position: "relative", overflow: "hidden" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(99,102,241,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {/* Top accent */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: PROJECT_GRADIENTS[i % PROJECT_GRADIENTS.length] }}/>

                  {/* Icon + Actions */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, marginTop: 6 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: PROJECT_GRADIENTS[i % PROJECT_GRADIENTS.length], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                      <IconFolder size={20}/>
                    </div>
                    <div style={{ display: "flex", gap: 4, opacity: 0 }} className="project-actions"
                      onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    >
                    </div>
                  </div>

                  {/* Project info */}
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6, fontFamily: "Figtree, sans-serif" }}>{p.name}</div>
                  {p.description && (
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, marginBottom: 12 }}>
                      {p.description.length > 80 ? p.description.slice(0, 80) + "…" : p.description}
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                      Created {formatDate(p.createdAt)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#818cf8" }}>
                      Open Board <IconArrow/>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Project card */}
              {isAdmin && (
                <button onClick={() => setIsModalOpen(true)} style={{ background: "none", border: "1.5px dashed rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "rgba(255,255,255,0.3)", transition: "all 0.2s", minHeight: 160 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.color = "#818cf8"; e.currentTarget.style.background = "rgba(99,102,241,0.04)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "none"; }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, border: "1.5px dashed currentColor", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <IconPlus size={20}/>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>New Project</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Members Sidebar ── */}
        {showMembers && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setShowMembers(false)}>
            <div style={{ position: "absolute", right: 0, top: 0, width: 380, height: "100vh", background: "rgba(10,13,22,0.98)", borderLeft: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }} onClick={e => e.stopPropagation()}>
              <MembersSidebar workspaceId={workspaceId} members={members} userRole={userRole} showMembers={showMembers}
                onUpdate={fetchMembers} onClose={() => setShowMembers(false)} onInviteOpen={() => { setShowMembers(false); setIsInviteOpen(true); }}/>
            </div>
          </div>
        )}

        {/* ── Activity Sidebar ── */}
        {showActivity && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setShowActivity(false)}>
            <div style={{ position: "absolute", right: 0, top: 0, width: 380, height: "100vh", background: "rgba(10,13,22,0.98)", borderLeft: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", padding: 24, boxSizing: "border-box", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>Activity</h3>
                <button onClick={() => setShowActivity(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 20 }}>×</button>
              </div>
              <ActivityLog workspaceId={workspaceId}/>
            </div>
          </div>
        )}

        {/* ── Invite Modal ── */}
        {isInviteOpen && (
          <InviteModal workspaceId={workspaceId} onClose={() => setIsInviteOpen(false)} onInviteSent={fetchMembers}/>
        )}

        {/* ── Create Project Modal ── */}
        {isModalOpen && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }} onClick={() => setIsModalOpen(false)}>
            <div style={{ background: "rgba(10,13,22,0.99)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: 420, boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: "#fff" }}>
                <IconFolder size={22}/>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", marginBottom: 6, fontFamily: "Figtree, sans-serif" }}>New Project</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
                Launch a new project in <strong style={{ color: "rgba(255,255,255,0.7)" }}>{workspace?.name}</strong>.
              </p>
              <form onSubmit={createProject}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Project name *</label>
                <input autoFocus required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Website Redesign, API v2…"
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 14, fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this project about?" rows={2}
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 24, fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 18px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
                  <button type="submit" disabled={creating} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, padding: "9px 22px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                    {creating ? "Creating…" : "Launch Project →"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
      </div>
    </AppShell>
  );
};

export default Projects;