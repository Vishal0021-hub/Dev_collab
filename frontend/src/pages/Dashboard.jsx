import { useEffect, useState } from "react";
import API from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";



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
const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconBriefcase = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);
const IconChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconUsers = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [name, setName]             = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchWorkspaces(); }, []);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const res = await API.get("/workspaces");
      setWorkspaces(res.data);
    } catch (err) {
      console.error("Error fetching workspaces:", err);
      toast.error("Failed to load workspaces");
    } finally {
      setLoading(false);
    }
  };

  const createWorkspace = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const loadingToast = toast.loading("Creating workspace...");
    try {
      await API.post("/workspaces", { name });
      toast.success("Workspace created!", { id: loadingToast });
      setName("");
      setIsModalOpen(false);
      fetchWorkspaces();
    } catch (err) {
      console.error("Error creating workspace:", err);
      toast.error(err.response?.data?.message || "Failed to create workspace", { id: loadingToast });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="dc-page">
      {/* Navbar handled by dc-page::before for aurora */}

      {/* Navbar */}
      <nav className="dc-nav">
        <div className="dc-nav-brand">
          <div className="dc-nav-icon"><IconLogo /></div>
          <span className="dc-nav-wordmark">DevCollab</span>
        </div>
        <div className="dc-nav-right">
          <div className="dc-nav-user">
            <div className="dc-user-text">
              <div className="dc-user-name">{user.name  || "Developer"}</div>
              <div className="dc-user-email">{user.email || ""}</div>
            </div>
            <div className="dc-avatar">{(user.name || "D")[0].toUpperCase()}</div>
          </div>
          <button className="dc-nav-btn" title="Logout" onClick={handleLogout}>
            <IconLogout />
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="dc-main">
        <div className="dc-page-header">
          <div>
            <div className="dc-eyebrow">
              <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
              Your spaces
            </div>
            <h1 className="dc-page-title">Workspaces</h1>
            <p className="dc-page-sub">
              {workspaces.length} active environment{workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button className="dc-cta" onClick={() => setIsModalOpen(true)}>
            <IconPlus /> New Workspace
          </button>
        </div>

        {loading ? (
          <div className="dc-grid">
            {[1,2,3].map(i => (
              <div key={i} className="dc-skeleton" style={{ height: 196, animationDelay: `${i * 110}ms` }} />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="dc-grid">
            <div className="dc-empty">
              <div className="dc-empty-icon-wrap"><IconBriefcase size={32} /></div>
              <div className="dc-empty-title">Welcome to DevCollab</div>
              <p className="dc-empty-sub">Create your first workspace to start collaborating with your team in a premium, real-time environment.</p>
              <button className="dc-cta" onClick={() => setIsModalOpen(true)} style={{ margin: '0 auto' }}>Get started →</button>
            </div>
          </div>
        ) : (
          <div className="dc-grid">
            {workspaces.map((ws) => (
              <Link key={ws._id} to={`/projects/${ws._id}`} className="dc-card">
                <div className="dc-card-top">
                  <div className="dc-card-icon"><IconBriefcase /></div>
                </div>
                <div className="dc-card-title">{ws.name}</div>
                <div className="dc-card-meta">
                  <div className="dc-card-meta-item">
                    <div className="dc-status-dot" />
                    Active
                  </div>
                  <span style={{ color: "var(--text-3)" }}>·</span>
                  <div className="dc-card-meta-item">
                    <IconUsers />
                    {ws.members?.length || 1} member{ws.members?.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Create Workspace Modal */}
      {isModalOpen && (
        <div className="dc-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="dc-modal" onClick={e => e.stopPropagation()}>
              <div className="dc-modal-icon"><IconBriefcase size={24} /></div>
              <div className="dc-modal-title">New Workspace</div>
              <p className="dc-modal-sub">Give your environment a name and start building together.</p>
              <form onSubmit={createWorkspace}>
                <label className="dc-field-label">Workspace name</label>
                <input
                  autoFocus value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acme Studio, Marketing Team…"
                  className="dc-input"
                />
                <div className="dc-modal-actions">
                  <button type="button" className="dc-btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="dc-btn-submit">Create →</button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

export default Dashboard;