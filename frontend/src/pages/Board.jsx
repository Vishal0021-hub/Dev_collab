import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import "../utils/collab.css";
import MembersSidebar from "../components/MembersSidebar";
import InviteModal from "../components/InviteModal";
import ActivityLog from "../components/ActivityLog";

/* ─── Icons ─────────────────────────────────────────────── */
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
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ─── Priority colours ────────────────────────────────────── */
const PRIORITY_CONFIG = {
  high:   { label: "High",   bg: "rgba(239,68,68,0.15)",   color: "#f87171", dot: "#ef4444" },
  medium: { label: "Med",    bg: "rgba(245,158,11,0.15)",  color: "#fbbf24", dot: "#f59e0b" },
  low:    { label: "Low",    bg: "rgba(16,185,129,0.15)",  color: "#34d399", dot: "#10b981" },
};

/* ─── Helper ─────────────────────────────────────────────── */
const formatDate = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};
const isOverdue = (d) => d && new Date(d) < new Date();

/* ═══════════════════════════════════════════════════════════ */
const Board = () => {
  const { projectId }   = useParams();
  const navigate        = useNavigate();

  const [boards, setBoards]           = useState([]);
  const [tasks,  setTasks]            = useState([]);
  const [project, setProject]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [members, setMembers]         = useState([]);
  const [userRole, setUserRole]       = useState("member");

  // New column modal
  const [colName, setColName]         = useState("");
  const [isColModal, setIsColModal]   = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite]   = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  // Task modal (add / edit)
  const [taskModal, setTaskModal]     = useState(null); // null | { mode: "add"|"edit", boardId, task? }
  const [taskForm, setTaskForm]       = useState({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "" });

  /* ── data fetchers ── */
  useEffect(() => {
    fetchProject();
    fetchBoards();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await API.get(`/projects/details/${projectId}`).catch(() => null);
      if (res) {
        setProject(res.data);
        if (res.data.workspace) fetchMembers(res.data.workspace);
      }
    } catch { /* silent */ }
  };

  const fetchMembers = async (workspaceId) => {
    try {
      const res = await API.get(`/workspaces/${workspaceId}/members`);
      setMembers(res.data);

      // Determine current user role
      const userId = JSON.parse(localStorage.getItem("user") || "{}")._id;
      const member = res.data.find(m => m.user === userId || m.user._id === userId);
      if (member) setUserRole(member.role);
    } catch (err) {
      console.error("fetchMembers:", err);
    }
  };

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/boards/${projectId}`);
      setBoards(res.data);
      setTasks([]);
      res.data.forEach(b => fetchTasksFor(b._id));
    } catch (err) {
      console.error("fetchBoards:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksFor = async (boardId) => {
    try {
      const res = await API.get(`/tasks/${boardId}`);
      setTasks(prev => [...prev.filter(t => t.board !== boardId), ...res.data]);
    } catch (err) {
      console.error("fetchTasksFor:", err);
    }
  };

  /* ── create column ── */
  const createBoard = async (e) => {
    e.preventDefault();
    if (!colName.trim()) return;
    try {
      await API.post("/boards", { name: colName, projectId });
      setColName("");
      setIsColModal(false);
      fetchBoards();
    } catch (err) { console.error(err); }
  };

  /* ── task CRUD ── */
  const openAddTask = (boardId) => {
    setTaskForm({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "" });
    setTaskModal({ mode: "add", boardId });
  };
  const openEditTask = (task) => {
    setTaskForm({
      title:       task.title || "",
      description: task.description || "",
      priority:    task.priority || "medium",
      dueDate:     task.dueDate ? task.dueDate.slice(0, 10) : "",
      assignedTo:  task.assignedTo || "",
    });
    setTaskModal({ mode: "edit", boardId: task.board, task });
  };

  const submitTaskModal = async (e) => {
    e.preventDefault();
    const payload = {
      title:       taskForm.title.trim(),
      description: taskForm.description.trim(),
      priority:    taskForm.priority,
      dueDate:     taskForm.dueDate || null,
    };
    try {
      if (taskModal.mode === "add") {
        const res = await API.post("/tasks", { ...payload, boardId: taskModal.boardId });
        if (taskForm.assignedTo) {
          await API.put(`/tasks/${res.data._id}/assign`, { userId: taskForm.assignedTo });
        }
        fetchTasksFor(taskModal.boardId);
      } else {
        await API.put(`/tasks/${taskModal.task._id}`, payload);
        await API.put(`/tasks/${taskModal.task._id}/assign`, { userId: taskForm.assignedTo || null });
        fetchTasksFor(taskModal.boardId);
      }
      setTaskModal(null);
    } catch (err) { console.error(err); }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t._id !== taskId));
    } catch (err) { console.error(err); }
  };

  /* ── drag & drop ── */
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    // Optimistic update
    setTasks(prev =>
      prev.map(t => t._id === draggableId ? { ...t, board: destination.droppableId } : t)
    );

    try {
      await API.put(`/tasks/move/${draggableId}`, { boardId: destination.droppableId });
    } catch (err) {
      console.error("drag failed, refetching:", err);
      fetchBoards(); // revert on failure
    }
  };

  /* ─── Render ─────────────────────────────────────────────── */
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
          <button onClick={() => navigate(-1)} className="dc-nav-btn ghost" style={{ width: 34, height: 34, marginRight: 8 }}>
            <IconBack />
          </button>
          <span className="dim">Projects</span>
          <span className="sep">/</span>
          <span className="bold">{project?.name || "Board"}</span>
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
          <button className="dc-nav-btn ghost" title="Settings"><IconSettings /></button>
        </div>
      </nav>

      {/* Main */}
      <main className="dc-main" style={{ maxWidth: "100%", overflowX: "auto", paddingBottom: 40 }}>

        {/* Header */}
        <div className="dc-page-header">
          <div>
            <div className="dc-eyebrow"><IconCheck /> Sprint Board</div>
            <h1 className="dc-page-title">{project?.name || "Project Board"}</h1>
            <p className="dc-page-sub">Drag tasks between columns · Click a task to edit</p>
          </div>
          <button className="dc-cta" onClick={() => setIsColModal(true)}>
            <IconPlus /> Add Column
          </button>
        </div>

        {/* Board columns */}
        {loading ? (
          <div style={{ display: "flex", gap: 20 }}>
            {[1,2,3].map(i => (
              <div key={i} className="dc-skeleton" style={{ width: 300, height: 400, flexShrink: 0, animationDelay: `${i*110}ms` }} />
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="dc-empty">
            <div className="dc-empty-icon-wrap"><IconBoard size={32} /></div>
            <div className="dc-empty-title">No columns yet</div>
            <p className="dc-empty-sub">Create your first column to start organising tasks.</p>
            <button className="dc-empty-link" onClick={() => setIsColModal(true)}>Add Column →</button>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", paddingBottom: 16 }}>
              {boards.map((board) => {
                const boardTasks = tasks.filter(t => t.board === board._id);
                return (
                  <div
                    key={board._id}
                    style={{
                      flexShrink: 0,
                      width: 300,
                      background: "rgba(10,13,20,0.6)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-xl)",
                      padding: 16,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {/* Column header */}
                    <div className="dc-column-header">
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="dc-card-icon" style={{ width: 32, height: 32, marginBottom: 0 }}>
                          <IconBoard size={16} />
                        </div>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "#fff" }}>
                          {board.name}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 4 }}>
                          {boardTasks.length}
                        </span>
                      </div>
                      <button
                        onClick={() => openAddTask(board._id)}
                        className="dc-nav-btn ghost"
                        style={{ width: 30, height: 30 }}
                        title="Add task"
                      >
                        <IconPlus size={14} />
                      </button>
                    </div>

                    {/* Droppable task list */}
                    <Droppable droppableId={board._id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            minHeight: 60,
                            display: "flex",
                            flexDirection: "column",
                            gap: 10,
                            background: snapshot.isDraggingOver ? "rgba(99,102,241,0.06)" : "transparent",
                            borderRadius: 12,
                            padding: snapshot.isDraggingOver ? "6px 4px" : 0,
                            transition: "background 0.2s, padding 0.2s",
                          }}
                        >
                          {boardTasks.map((task, index) => {
                            const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                            const overdue = isOverdue(task.dueDate);
                            return (
                              <Draggable key={task._id} draggableId={task._id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    onClick={() => openEditTask(task)}
                                    style={{
                                      background: snapshot.isDragging ? "var(--surface-2)" : "var(--surface-2)",
                                      border: `1px solid ${snapshot.isDragging ? "var(--border-hover)" : "var(--border)"}`,
                                      borderRadius: 12,
                                      padding: "12px 14px",
                                      cursor: "grab",
                                      boxShadow: snapshot.isDragging ? "0 16px 40px rgba(0,0,0,0.5)" : "none",
                                      transform: snapshot.isDragging ? "rotate(2deg)" : "none",
                                      transition: "box-shadow 0.15s, border-color 0.15s",
                                      ...provided.draggableProps.style,
                                    }}
                                  >
                                    {/* Priority badge */}
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                      <span style={{
                                        fontSize: 10, fontWeight: 700, padding: "2px 8px",
                                        borderRadius: 20, background: pCfg.bg, color: pCfg.color,
                                        textTransform: "uppercase", letterSpacing: "0.08em",
                                      }}>
                                        <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: "50%", background: pCfg.dot, marginRight: 4, verticalAlign: "middle" }} />
                                        {pCfg.label}
                                      </span>
                                      {/* Action buttons */}
                                      <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                                        <button
                                          onClick={() => openEditTask(task)}
                                          title="Edit"
                                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
                                          onMouseEnter={e => e.currentTarget.style.color = "var(--indigo)"}
                                          onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
                                        ><IconEdit /></button>
                                        {(userRole === "owner" || userRole === "admin") && (
                                          <button
                                            onClick={() => deleteTask(task._id)}
                                            title="Delete"
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
                                            onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                                            onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
                                          ><IconTrash /></button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Title */}
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", lineHeight: 1.4, marginBottom: task.description ? 6 : 0 }}>
                                      {task.title}
                                    </div>

                                    {/* Assigned To */}
                                    {task.assignedTo && (
                                      <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "8px 0" }}>
                                        <div className="dc-mini-avatar" title={task.assignedTo.name} style={{ width: 18, height: 18, fontSize: 9 }}>
                                          {task.assignedTo.name[0].toUpperCase()}
                                        </div>
                                        <span style={{ fontSize: 11, color: "var(--text-2)" }}>{task.assignedTo.name}</span>
                                      </div>
                                    )}

                                    {/* Description */}
                                    {task.description && (
                                      <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 8 }}>
                                        {task.description.length > 80 ? task.description.slice(0, 80) + "…" : task.description}
                                      </div>
                                    )}

                                    {/* Due date */}
                                    {task.dueDate && (
                                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: overdue ? "#f87171" : "var(--text-3)", marginTop: 8 }}>
                                        <IconCalendar />
                                        <span>{formatDate(task.dueDate)}</span>
                                        {overdue && <span style={{ fontWeight: 700 }}>· Overdue</span>}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}

                          {/* Empty state for column */}
                          {boardTasks.length === 0 && !snapshot.isDraggingOver && (
                            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-3)", fontSize: 12 }}>
                              Drop tasks here
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>

                    {/* Add task button */}
                    <button
                      onClick={() => openAddTask(board._id)}
                      className="dc-cta-secondary"
                      style={{ width: "100%", justifyContent: "center", borderRadius: '12px', padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <IconPlus size={14} /> Add Task
                    </button>
                  </div>
                );
              })}

              {/* Add column ghost */}
              <div
                onClick={() => setIsColModal(true)}
                style={{
                  flexShrink: 0, width: 200, height: 80,
                  border: "1.5px dashed var(--border)", borderRadius: "var(--radius-xl)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "var(--text-3)", cursor: "pointer", gap: 8, fontSize: 13,
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.color = "var(--indigo)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)";       e.currentTarget.style.color = "var(--text-3)"; }}
              >
                <IconPlus size={14} /> Add Column
              </div>
            </div>
          </DragDropContext>
        )}
      </main>

      {/* ─── Create Column Modal ────────────────────────── */}
      {isColModal && (
        <div className="dc-overlay" onClick={() => setIsColModal(false)}>
          <div className="dc-modal" onClick={e => e.stopPropagation()}>
            <div className="dc-modal-icon"><IconBoard size={24} /></div>
            <div className="dc-modal-title">New Column</div>
            <p className="dc-modal-sub">Add a new stage to your project workflow.</p>
            <form onSubmit={createBoard}>
              <label className="dc-field-label">Column name</label>
              <input autoFocus required value={colName} onChange={e => setColName(e.target.value)} placeholder="e.g. In Progress, Review…" className="dc-input" />
              <div className="dc-modal-actions">
                <button type="button" className="dc-btn-cancel" onClick={() => setIsColModal(false)}>Cancel</button>
                <button type="submit" className="dc-btn-submit">Add Column</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Add / Edit Task Modal ──────────────────────── */}
      {taskModal && (
        <div className="dc-overlay" onClick={() => setTaskModal(null)}>
          <div className="dc-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="dc-modal-icon"><IconEdit /></div>
            <div className="dc-modal-title">{taskModal.mode === "add" ? "New Task" : "Edit Task"}</div>
            <form onSubmit={submitTaskModal}>
              <label className="dc-field-label">Title</label>
              <input autoFocus required value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title…" className="dc-input" />

              <label className="dc-field-label">Description</label>
              <textarea
                value={taskForm.description}
                onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description…"
                className="dc-input"
                rows={3}
                style={{ resize: "vertical", fontFamily: "var(--font-body)" }}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 4 }}>
                <div>
                  <label className="dc-field-label">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                    className="dc-input"
                    style={{ marginBottom: 0 }}
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                <div>
                  <label className="dc-field-label">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="dc-input"
                    style={{ marginBottom: 0, colorScheme: "dark" }}
                  />
                </div>
              </div>

              {(userRole === "owner" || userRole === "admin") ? (
                <>
                  <label className="dc-field-label">Assign To</label>
                  <div className="dc-assign-grid">
                    <button 
                      type="button"
                      className={`dc-assign-btn ${!taskForm.assignedTo ? 'active' : ''}`}
                      onClick={() => setTaskForm(f => ({ ...f, assignedTo: "" }))}
                    >
                      Unassigned
                    </button>
                    {members.map(m => (
                      <button
                        key={m.user._id}
                        type="button"
                        className={`dc-assign-btn ${taskForm.assignedTo === m.user._id ? 'active' : ''}`}
                        onClick={() => setTaskForm(f => ({ ...f, assignedTo: m.user._id }))}
                      >
                        <div className="dc-mini-avatar" style={{ width: 20, height: 20, fontSize: 10 }}>
                          {m.user.name[0].toUpperCase()}
                        </div>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.user.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                taskForm.assignedTo && (
                  <div style={{ marginTop: 16 }}>
                    <label className="dc-field-label">Assigned To</label>
                    <div className="dc-input" style={{ opacity: 0.7 }}>
                      {members.find(m => m.user?._id === taskForm.assignedTo || m.user === taskForm.assignedTo)?.user?.name || "Assigned"}
                    </div>
                  </div>
                )
              )}

              <div className="dc-modal-actions" style={{ marginTop: 24 }}>
                <button type="button" className="dc-btn-cancel" onClick={() => setTaskModal(null)}>Cancel</button>
                <button type="submit" className="dc-btn-submit">{taskModal.mode === "add" ? "Create Task" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Members Sidebar */}
      <div className="dc-sidebar-panel" style={{ right: showMembers ? 0 : -400 }}>
        <MembersSidebar 
          workspaceId={project?.workspace} 
          members={members} 
          userRole={userRole} 
          showMembers={showMembers}
          onUpdate={() => fetchMembers(project.workspace)}
          onClose={() => setShowMembers(false)}
          onInviteOpen={() => setShowInvite(true)}
        />
      </div>

      {/* Activity Sidebar */}
      <div className="dc-sidebar-panel" style={{ right: showActivity ? 0 : -400 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#fff' }}>Activity Feed</h3>
          <button onClick={() => setShowActivity(false)} className="dc-nav-btn ghost">×</button>
        </div>
        <ActivityLog workspaceId={project?.workspace} />
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal 
          workspaceId={project?.workspace} 
          onClose={() => setShowInvite(false)}
          onInviteSent={() => fetchMembers(project.workspace)}
        />
      )}
    </div>
  );
};

export default Board;
