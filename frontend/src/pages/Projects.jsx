import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import ActivityLog from "../components/ActivityLog";
import MembersSidebar from "../components/MembersSidebar";
import InviteModal from "../components/InviteModal";



import "../utils/collab.css";
const IconLogo = () => (
  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
    <path d="M3 6l7-3 7 3v8l-7 3-7-3V6z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M3 6l7 3m0 8V9m7-3l-7 3" stroke="#fff" strokeWidth="1.5"/>
  </svg>
);
const IconPlus = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconFolder = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="5" r="1" fill="currentColor"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <circle cx="12" cy="19" r="1" fill="currentColor"/>
  </svg>
);
const IconClock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const Projects = () => {
  const { workspaceId }             = useParams();
  const navigate = useNavigate();
  const [projects, setProjects]     = useState([]);
  const [workspace, setWorkspace]   = useState(null);
  const [loading, setLoading]       = useState(true);
  const [name, setName]             = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [userRole, setUserRole]       = useState("member");
  const [members, setMembers]         = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  useEffect(() => {
    fetchProjects();
    fetchWorkspace();
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    try {
      const res = await API.get("/workspaces");
      const current = res.data.find(w => w._id === workspaceId);
      setWorkspace(current);

      // Determine user role
      const userId = JSON.parse(localStorage.getItem("user") || "{}")._id;
      const member = current?.members?.find(m => m.user === userId || m.user._id === userId);
      if (member) setUserRole(member.role);

      fetchMembers(workspaceId);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async (workspaceId) => {
    try {
      const res = await API.get(`/workspaces/${workspaceId}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error("fetchMembers:", err);
    }
  };

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/projects/${workspaceId}`);
      setProjects(res.data);
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await API.post("/projects", { name, workspaceId });
      setName("");
      setIsModalOpen(false);
      fetchProjects();
    } catch (err) {
      console.error("Error creating project:", err);
    }
  };

  const inviteMember = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      await API.post(`/workspaces/${workspaceId}/invite`, { email: inviteEmail });
      setInviteEmail("");
      setIsInviteModalOpen(false);
      alert("Invitation sent!");
      fetchWorkspace();
    } catch (err) {
      alert(err.response?.data?.message || "Error inviting member");
    }
  };

  return (
    <div className="dc-page">
      {/* Aurora background handled by dc-page::before */}

      {/* Navbar */}
      <nav className="dc-nav">
        <div className="dc-nav-brand">
          <div className="dc-nav-icon"><IconLogo /></div>
          <span className="dc-nav-wordmark">DevCollab</span>
        </div>

        <div className="dc-nav-divider" />

        <div className="dc-nav-breadcrumb">
          <Link to="/dashboard" className="dc-nav-btn ghost" style={{ width: 34, height: 34, marginRight: 8 }}>
            <IconBack />
          </Link>
          <span className="dim">Workspaces</span>
          <span className="sep">/</span>
          <span className="bold">{workspace?.name || "…"}</span>
        </div>

        <div className="dc-nav-right">
          <button className="dc-nav-btn ghost" onClick={() => setShowActivity(!showActivity)} title="Activity Feed">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </button>
          <button className="dc-nav-btn ghost" onClick={() => setShowMembers(!showMembers)} title="Workspace Members">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </button>
          <button className="dc-nav-btn ghost" title="Settings">
            <IconSettings />
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="dc-main">
        <div className="dc-page-header">
          <div>
            <div className="dc-eyebrow">
              <IconCheck /> Project Management
            </div>
            <h1 className="dc-page-title">Projects</h1>
            <p className="dc-page-sub">
              {workspace?.name && <>{workspace.name} · </>}
              {projects.length} project{projects.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {(userRole === "owner" || userRole === "admin") && (
              <>
                <button className="dc-nav-btn" onClick={() => setIsInviteModalOpen(true)} title="Invite Member">
                  <IconPlus size={14} /> Invite
                </button>
                <button className="dc-cta" onClick={() => setIsModalOpen(true)}>
                  <IconPlus /> Create Project
                </button>
              </>
            )}
          </div>
        </div>

        <div className="dc-page-main-layout">
          <div>
            {loading ? (
              <div className="dc-grid">
                {[1,2,3].map(i => (
                  <div key={i} className="dc-skeleton" style={{ height: 180, animationDelay: `${i * 110}ms` }} />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="dc-grid">
                <div className="dc-empty">
                  <div className="dc-empty-icon-wrap"><IconFolder size={32} /></div>
                  <div className="dc-empty-title">Workspace is empty</div>
                  <p className="dc-empty-sub">Create a project to start tracking tasks and collaborating with your team.</p>
                  <button className="dc-cta" onClick={() => setIsModalOpen(true)} style={{ margin: '0 auto' }}>Add Project →</button>
                </div>
              </div>
            ) : (
              <div className="dc-grid">
                {projects.map((p) => (
                  <div
                    key={p._id}
                    className="dc-card"
                    style={{ textDecoration: "none" }}
                    onClick={() => navigate(`/boards/${p._id}`)}
                  >
                    <div className="dc-card-top">
                      <div className="dc-card-icon"><IconFolder /></div>
                      <button className="dc-card-menu-btn" onClick={(e) => { e.stopPropagation(); /* menu logic */ }} style={{ background: 'transparent', border: 'none', color: 'var(--text-3)', cursor: 'none' }}>
                        <IconDots />
                      </button>
                    </div>

                    <div className="dc-card-title">{p.name}</div>

                    <div className="dc-card-footer">
                      <div className="dc-card-time">
                        <IconClock />
                        Updated 2d ago
                      </div>
                      <div className="dc-mini-avatars">
                        {["A", "B"].map((l, i) => (
                          <div key={i} className="dc-mini-avatar"
                            style={{ background: i === 0 ? "rgba(99,102,241,0.25)" : "rgba(139,92,246,0.2)" }}>
                            {l}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Members Sidebar */}
      <div className="dc-sidebar-panel" style={{ right: showMembers ? 0 : -400 }}>
        <MembersSidebar 
          workspaceId={workspaceId} 
          members={members} 
          userRole={userRole} 
          showMembers={showMembers}
          onUpdate={() => fetchMembers(workspaceId)}
          onClose={() => setShowMembers(false)}
          onInviteOpen={() => setIsInviteModalOpen(true)}
        />
      </div>

      {/* Activity Sidebar */}
      <div className="dc-sidebar-panel" style={{ right: showActivity ? 0 : -400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#fff' }}>Activity Feed</h3>
          <button onClick={() => setShowActivity(false)} className="dc-nav-btn ghost">×</button>
        </div>
        <ActivityLog workspaceId={workspaceId} />
      </div>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="dc-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="dc-modal" onClick={e => e.stopPropagation()}>
              <div className="dc-modal-icon"><IconFolder size={24} /></div>
              <div className="dc-modal-title">New Project</div>
              <p className="dc-modal-sub">Launch a new project in the <strong style={{ color: "var(--text-2)" }}>{workspace?.name}</strong> workspace.</p>
              <form onSubmit={createProject}>
                <label className="dc-field-label">Project name</label>
                <input
                  autoFocus required value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Website Redesign, API v2…"
                  className="dc-input"
                />
                <div className="dc-modal-actions">
                  <button type="button" className="dc-btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="dc-btn-submit">Launch →</button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <InviteModal 
          workspaceId={workspaceId} 
          onClose={() => setIsInviteModalOpen(false)}
          onInviteSent={() => fetchMembers(workspaceId)}
        />
      )}
    </div>
  );
};

export default Projects;