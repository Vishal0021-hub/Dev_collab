import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
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
const IconBoard = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="9" y1="3" x2="9" y2="21"/>
    <line x1="15" y1="3" x2="15" y2="21"/>
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

const Board = () => {
  const { projectId }               = useParams();
  const navigate                    = useNavigate();
  const [boards, setBoards]         = useState([]);
  const [tasks, setTasks]           = useState([]);
  const [project, setProject]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [name, setName]             = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchBoards();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      // Assuming there's a way to get project details from either its own endpoint or matching workspace call
      // For now, let's try to find it in the projects list of the workspace
      // Actually, standard AI projects usually have a GET /projects/:id or similar
      // If not, we'll just show "Project"
      const res = await API.get(`/projects/details/${projectId}`).catch(() => null);
      if (res) setProject(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/boards/${projectId}`);
      setBoards(res.data);
      setTasks([]); // Clear tasks before refetching
      res.data.forEach(board => {
        fetchTasks(board._id);
      });
    } catch (err) {
      console.error("Error fetching boards:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (boardId) => {
    try {
      const res = await API.get(`/tasks/${boardId}`);
      setTasks(prev => {
        // Filter out any existing tasks for this board to avoid duplicates
        const filtered = prev.filter(t => t.board !== boardId);
        return [...filtered, ...res.data];
      });
    } catch (err) {
      console.error(`Error fetching tasks for board ${boardId}:`, err);
    }
  };

  const createBoard = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await API.post("/boards", { name, projectId });
      setName("");
      setIsModalOpen(false);
      fetchBoards();
    } catch (err) {
      console.error("Error creating board:", err);
    }
  };

  const createTask = async (boardId) => {
    const title = prompt("Enter task title");
    if (!title) return;
    try {
      await API.post("/tasks", { title, boardId });
      fetchTasks(boardId);
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  return (
    <div className="dc-page">
      <div className="dc-orb dc-orb-1" />
      <div className="dc-orb dc-orb-2" />

      {/* Navbar */}
      <nav className="dc-nav">
        <div className="dc-nav-brand">
          <div className="dc-nav-icon"><IconLogo /></div>
          <span className="dc-nav-wordmark">DevCollab</span>
        </div>

        <div className="dc-nav-divider" />

        <div className="dc-nav-breadcrumb">
          <button onClick={() => navigate(-1)} className="dc-back-btn" style={{ width: 30, height: 30 }}>
            <IconBack />
          </button>
          <span className="dim">Projects</span>
          <span className="sep">/</span>
          <span className="bold">{project?.name || "Board"}</span>
        </div>

        <div className="dc-nav-right">
          <button className="dc-nav-btn ghost" title="Settings">
            <IconSettings />
          </button>
        </div>
      </nav>

      {/* Main */}
      <main className="dc-main" style={{ maxWidth: '100vw', overflowX: 'auto' }}>
        <div className="dc-page-header">
          <div>
            <div className="dc-eyebrow">
              <IconCheck /> Sprint Planning
            </div>
            <h1 className="dc-page-title">{project?.name || "Project Board"}</h1>
            <p className="dc-page-sub">
              Manage tasks and track progress across boards
            </p>
          </div>
          <button className="dc-cta" onClick={() => setIsModalOpen(true)}>
            <IconPlus /> Add Column
          </button>
        </div>

        {loading ? (
          <div className="dc-grid" style={{ gridTemplateColumns: 'repeat(4, 300px)' }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="dc-skeleton" style={{ height: 400, animationDelay: `${i * 110}ms` }} />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="dc-empty">
            <div className="dc-empty-icon-wrap"><IconBoard size={32} /></div>
            <div className="dc-empty-title">No boards found</div>
            <p className="dc-empty-sub">This project doesn't have any boards yet. Create one to start organizing tasks.</p>
            <button className="dc-empty-link" onClick={() => setIsModalOpen(true)}>Create Board →</button>
          </div>
        ) : (
          <div className="dc-grid" style={{ 
            display: 'flex', 
            gap: '24px', 
            alignItems: 'flex-start',
            paddingBottom: '20px',
            minHeight: '60vh'
          }}>
            {boards.map((board, idx) => (
              <motion.div
                key={board._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1, ease: "easeOut" }}
                className="dc-card"
                style={{ 
                  flex: '0 0 320px', 
                  background: 'rgba(10, 13, 20, 0.4)',
                  backdropFilter: 'blur(10px)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: '70vh'
                }}
              >
                <div className="dc-card-top" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="dc-card-icon" style={{ width: 32, height: 32 }}><IconBoard size={16} /></div>
                    <div className="dc-card-title" style={{ fontSize: '16px', margin: 0 }}>{board.name}</div>
                  </div>
                  <button className="dc-card-menu-btn"><IconDots /></button>
                </div>

                <div className="dc-tasks-list" style={{ 
                  flex: 1, 
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  paddingRight: '4px',
                  marginBottom: '16px'
                }}>
                  {tasks
                    .filter(t => t.board === board._id)
                    .map((task) => (
                      <motion.div
                        key={task._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="dc-task-item"
                        style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          padding: '14px',
                          fontSize: '13px',
                          color: 'var(--text-1)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        whileHover={{ borderColor: 'var(--border-hover)', y: -2 }}
                      >
                        {task.title}
                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.6, fontSize: '10px' }}>
                           <IconClock /> 
                           Just now
                        </div>
                      </motion.div>
                    ))
                  }
                  
                  {tasks.filter(t => t.board === board._id).length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)', fontSize: '12px' }}>
                      No tasks yet
                    </div>
                  )}
                </div>

                <button 
                  className="dc-empty-link" 
                  style={{ width: '100%', marginTop: 'auto' }}
                  onClick={() => createTask(board._id)}
                >
                  <IconPlus size={12} /> Add Task
                </button>
              </motion.div>
            ))}
            
            {/* Quick add column indicator */}
            <div 
              onClick={() => setIsModalOpen(true)}
              style={{
                flex: '0 0 320px',
                height: '100px',
                border: '1.5px dashed var(--border)',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-3)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <IconPlus /> Add Another Column
            </div>
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            className="dc-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              className="dc-modal"
              initial={{ opacity: 0, y: 28, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 340, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dc-modal-icon"><IconBoard size={24} /></div>
              <div className="dc-modal-title">New Column</div>
              <p className="dc-modal-sub">Create a new stage for your project workflow.</p>
              <form onSubmit={createBoard}>
                <label className="dc-field-label">Column Name</label>
                <input
                  autoFocus required value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. In Progress, Quality Assurance…"
                  className="dc-input"
                />
                <div className="dc-modal-actions">
                  <button type="button" className="dc-btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                  <button type="submit" className="dc-btn-submit">Add Column</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Board;