import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { toast } from "react-hot-toast";

import "../utils/collab.css";
import AppShell from "../components/AppShell";
import MembersSidebar from "../components/MembersSidebar";
import InviteModal from "../components/InviteModal";
import ActivityLog from "../components/ActivityLog";
import AssignDropdown from "../components/AssignDropdown";
import NotificationBell from "../components/NotificationBell";
import { useWorkspace } from "../context/WorkspaceContext";

/* ─── Icons ──────────────────────────────────────────────────── */
const IconPlus      = ({ size=16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconBack      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;
const IconTrash     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconEdit      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const IconCalendar  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconActivity  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IconUsers     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

/* ─── Priority config ──────────────────────────────────────────── */
const PRIORITY_CONFIG = {
  high:   { label: "High",   bg: "rgba(239,68,68,0.15)",   color: "#f87171", dot: "#ef4444" },
  medium: { label: "Med",    bg: "rgba(245,158,11,0.15)",  color: "#fbbf24", dot: "#f59e0b" },
  low:    { label: "Low",    bg: "rgba(16,185,129,0.15)",  color: "#34d399", dot: "#10b981" },
};

const STATUS_STEPS = [
  { key: "todo",       label: "Todo",        color: "#94a3b8", icon: "○" },
  { key: "inprogress", label: "In Progress", color: "#fbbf24", icon: "◑" },
  { key: "review",     label: "Review",      color: "#818cf8", icon: "◕" },
  { key: "done",       label: "Done",        color: "#34d399", icon: "●" },
];

const formatDate = (d) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};
const isOverdue = (d) => d && new Date(d) < new Date();

/* ═══════════════════════════════════════════════════════════════ */
const Board = () => {
  const { projectId } = useParams();
  const navigate      = useNavigate();
  const { setActiveWorkspace, workspaces } = useWorkspace();

  const [boards,  setBoards]  = useState([]);
  const [tasks,   setTasks]   = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [userRole, setUserRole] = useState("member");

  // Sidebars
  const [showMembers,  setShowMembers]  = useState(false);
  const [showInvite,   setShowInvite]   = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  // Column creation
  const [colName,    setColName]    = useState("");
  const [isColModal, setIsColModal] = useState(false);
  const [colLoading, setColLoading] = useState(false);

  // Task modal
  const [taskModal, setTaskModal] = useState(null);
  const [taskForm,  setTaskForm]  = useState({
    title: "", description: "", priority: "medium", dueDate: "", assignedTo: "", status: "todo"
  });

  /* ── Fetch on mount ── */
  useEffect(() => {
    fetchProject();
    fetchBoards();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const res = await API.get(`/projects/details/${projectId}`).catch(() => null);
      if (res) {
        setProject(res.data);
        if (res.data.workspace) {
          fetchMembers(res.data.workspace);
          // Sync active workspace in context
          const ws = workspaces.find(w => w._id === res.data.workspace || w._id?.toString() === res.data.workspace?.toString());
          if (ws) setActiveWorkspace(ws);
        }
      }
    } catch { /* silent */ }
  };

  const fetchMembers = async (workspaceId) => {
    try {
      const res = await API.get(`/workspaces/${workspaceId}/members`);
      setMembers(res.data);
      const userId = JSON.parse(localStorage.getItem("user") || "{}")._id;
      const m = res.data.find(
        m => m.userId?.toString() === userId || m.userId?._id?.toString() === userId
      );
      if (m) setUserRole(m.role);
    } catch (err) { console.error("fetchMembers:", err); }
  };

  const normalizeId = (v) => {
    if (!v) return v;
    if (typeof v === "string") return v;
    if (typeof v === "object" && v._id) return v._id.toString();
    return String(v);
  };

  /* KEY FIX: fetch boards then tasks — errors surfaced via toast */
  const fetchBoards = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/boards/${projectId}`);
      const boardsFromApi = res.data;
      setBoards(boardsFromApi);

      // Fetch tasks for each board independently — don't let one failure block others
      const taskResults = await Promise.allSettled(
        boardsFromApi.map(board => API.get(`/tasks/${board._id}`))
      );

      const allTasks = taskResults.flatMap((r, i) => {
        if (r.status === "fulfilled") {
          return r.value.data.map(task => ({ ...task, board: normalizeId(boardsFromApi[i]._id) }));
        }
        return [];
      });

      setTasks(allTasks);
    } catch (err) {
      console.error("fetchBoards:", err);
      toast.error("Failed to load board");
    } finally {
      setLoading(false);
    }
  };

  /* ── Create column — optimistic + confirmed ── */
  const createBoardHandler = async (e) => {
    e.preventDefault();
    if (!colName.trim()) return;
    setColLoading(true);

    // Optimistic: add a placeholder column immediately
    const tempId = `temp-${Date.now()}`;
    const tempBoard = { _id: tempId, name: colName.trim(), project: projectId, _temp: true };
    setBoards(prev => [...prev, tempBoard]);
    setColName("");
    setIsColModal(false);

    try {
      const res = await API.post("/boards", { name: tempBoard.name, projectId });
      const newBoard = res.data;
      // Replace temp with real board
      setBoards(prev => prev.map(b => b._id === tempId ? newBoard : b));
      toast.success(`Column "${newBoard.name}" added`);
    } catch (err) {
      // Rollback on failure
      setBoards(prev => prev.filter(b => b._id !== tempId));
      toast.error(err.response?.data?.message || "Failed to add column");
    } finally {
      setColLoading(false);
    }
  };

  /* ── Delete column ── */
  const deleteBoard = async (boardId) => {
    if (!window.confirm("Delete this column and ALL its tasks?")) return;
    setBoards(prev => prev.filter(b => normalizeId(b._id) !== normalizeId(boardId)));
    setTasks(prev => prev.filter(t => normalizeId(t.board) !== normalizeId(boardId)));
    try {
      await API.delete(`/boards/${boardId}`);
      toast.success("Column deleted");
    } catch (err) {
      toast.error("Failed to delete column");
      fetchBoards(); // revert on error
    }
  };

  /* ── Task CRUD ── */
  const openAddTask = (boardId) => {
    setTaskForm({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: "", status: "todo" });
    setTaskModal({ mode: "add", boardId });
  };

  const openEditTask = (task) => {
    setTaskForm({
      title:       task.title || "",
      description: task.description || "",
      priority:    task.priority || "medium",
      dueDate:     task.dueDate ? task.dueDate.slice(0, 10) : "",
      assignedTo:  task.assignedTo?._id || task.assignedTo || "",
      status:      task.status || "todo",
    });
    setTaskModal({ mode: "edit", boardId: task.board, task });
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await API.patch(`/tasks/${taskId}/status`, { status: newStatus });
      setTasks(prev => prev.map(t => normalizeId(t._id) === normalizeId(taskId) ? { ...t, status: newStatus } : t));
      if (taskModal?.task?._id === taskId) {
        setTaskForm(f => ({ ...f, status: newStatus }));
        setTaskModal(m => ({ ...m, task: { ...m.task, status: newStatus } }));
      }
      toast.success(`→ ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update status");
    }
  };

  const submitTaskModal = async (e) => {
    e.preventDefault();
    const payload = {
      title:       taskForm.title.trim(),
      description: taskForm.description.trim(),
      priority:    taskForm.priority,
      dueDate:     taskForm.dueDate || null,
    };
    const t = toast.loading(`${taskModal.mode === "add" ? "Creating" : "Updating"} task…`);
    try {
      if (taskModal.mode === "add") {
        const res = await API.post("/tasks", { ...payload, boardId: taskModal.boardId });
        let newTask = { ...res.data, board: normalizeId(taskModal.boardId) };
        if (taskForm.assignedTo) {
          await API.put(`/tasks/${res.data._id}/assign`, { userId: taskForm.assignedTo });
          newTask = { ...newTask, assignedTo: taskForm.assignedTo };
        }
        setTasks(prev => [...prev, newTask]);
        toast.success("Task created!", { id: t });
      } else {
        const res = await API.put(`/tasks/${taskModal.task._id}`, payload);
        await API.put(`/tasks/${taskModal.task._id}/assign`, { userId: taskForm.assignedTo || null });
        setTasks(prev => prev.map(tk =>
          normalizeId(tk._id) === normalizeId(taskModal.task._id)
            ? { ...tk, ...payload, assignedTo: taskForm.assignedTo || null, status: tk.status }
            : tk
        ));
        toast.success("Task updated!", { id: t });
      }
      setTaskModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save task", { id: t });
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    setTasks(prev => prev.filter(t => normalizeId(t._id) !== normalizeId(taskId)));
    try {
      await API.delete(`/tasks/${taskId}`);
      toast.success("Task deleted");
    } catch { fetchBoards(); }
  };

  /* ── Drag & drop ── */
  const onDragEnd = async ({ source, destination, draggableId }) => {
    if (!destination || source.droppableId === destination.droppableId) return;
    setTasks(prev => prev.map(t =>
      t._id === draggableId ? { ...t, board: destination.droppableId } : t
    ));
    try {
      await API.put(`/tasks/move/${draggableId}`, { boardId: destination.droppableId });
    } catch { fetchBoards(); }
  };

  /* ── Derived stats ── */
  const totalTasks = tasks.length;
  const doneTasks  = tasks.filter(t => t.status === "done").length;
  const pctDone    = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const isAdmin = userRole === "owner" || userRole === "admin";

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <AppShell>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#07090f", overflow: "hidden" }}>

        {/* ── Top bar ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "0 24px",
          height: 60, flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(10,13,22,0.9)", backdropFilter: "blur(20px)", zIndex: 10
        }}>
          <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", padding: 6, borderRadius: 8, transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = "#fff"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
          ><IconBack/></button>
          <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }}/>
          <div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Project</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{project?.name || "Board"}</div>
          </div>

          {/* Progress pill */}
          {totalTasks > 0 && (
            <div style={{ marginLeft: 16, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "4px 14px" }}>
              <div style={{ width: 80, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pctDone}%`, background: "#34d399", borderRadius: 4, transition: "width 0.4s ease" }}/>
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#34d399" }}>{pctDone}%</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{doneTasks}/{totalTasks} done</span>
            </div>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
            {/* Status stat pills */}
            {totalTasks > 0 && STATUS_STEPS.map(s => {
              const cnt = tasks.filter(t => t.status === s.key).length;
              if (!cnt) return null;
              return (
                <div key={s.key} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: s.color + "18", color: s.color, border: `1px solid ${s.color}30` }}>
                  {cnt} {s.label}
                </div>
              );
            })}

            <NotificationBell/>

            <button onClick={() => setShowActivity(p => !p)} style={{ background: showActivity ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", transition: "all 0.2s" }} title="Activity">
              <IconActivity/>
            </button>
            <button onClick={() => setShowMembers(p => !p)} style={{ background: showMembers ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.7)", transition: "all 0.2s" }} title="Members">
              <IconUsers/>
            </button>

            {isAdmin && (
              <button onClick={() => setIsColModal(true)} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, padding: "8px 14px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <IconPlus size={13}/> Add Column
              </button>
            )}
          </div>
        </div>

        {/* ── Board canvas ── */}
        <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", padding: "20px 24px" }}>
          {loading ? (
            <div style={{ display: "flex", gap: 16 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ flexShrink: 0, width: 300, height: 480, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i*120}ms` }}/>
              ))}
            </div>
          ) : boards.length === 0 ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>No columns yet</div>
                <p style={{ fontSize: 14, marginBottom: 24 }}>Create your first column to start organizing tasks.</p>
                {isAdmin && (
                  <button onClick={() => setIsColModal(true)} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 12, padding: "10px 24px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    Add First Column
                  </button>
                )}
              </div>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start", height: "100%" }}>
                {boards.map((board) => {
                  const bid = normalizeId(board._id);
                  const boardTasks = tasks.filter(t => normalizeId(t.board) === bid);
                  const doneCnt = boardTasks.filter(t => t.status === "done").length;
                  const pct = boardTasks.length ? Math.round((doneCnt / boardTasks.length) * 100) : 0;
                  const isTemp = board._temp;

                  return (
                    <div key={bid} style={{
                      flexShrink: 0, width: 300,
                      background: "rgba(255,255,255,0.03)",
                      border: isTemp ? "1px dashed rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 16, display: "flex", flexDirection: "column",
                      maxHeight: "calc(100vh - 120px)", opacity: isTemp ? 0.6 : 1,
                      transition: "opacity 0.3s"
                    }}>
                      {/* Column header */}
                      <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{board.name}</span>
                            <span style={{ fontSize: 12, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)" }}>{boardTasks.length}</span>
                          </div>
                          {isAdmin && !isTemp && (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => openAddTask(board._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4, borderRadius: 6, display: "flex", transition: "color 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.color = "#818cf8"}
                                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                                title="Add task"
                              ><IconPlus size={14}/></button>
                              <button onClick={() => deleteBoard(board._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", padding: 4, borderRadius: 6, display: "flex", transition: "color 0.15s" }}
                                onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
                                title="Delete column"
                              ><IconTrash/></button>
                            </div>
                          )}
                        </div>
                        {/* Per-column progress bar */}
                        {boardTasks.length > 0 && (
                          <div>
                            <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? "#34d399" : "#6366f1", borderRadius: 3, transition: "width 0.4s ease" }}/>
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, textAlign: "right" }}>{pct}% complete</div>
                          </div>
                        )}
                      </div>

                      {/* Tasks */}
                      <Droppable droppableId={bid}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={{
                              flex: 1, overflowY: "auto", padding: "8px 10px",
                              background: snapshot.isDraggingOver ? "rgba(99,102,241,0.04)" : "transparent",
                              borderRadius: 10, transition: "background 0.2s",
                              display: "flex", flexDirection: "column", gap: 8,
                              minHeight: 60
                            }}
                          >
                            {boardTasks.map((task, index) => {
                              const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                              const overdue = isOverdue(task.dueDate);
                              const statusStep = STATUS_STEPS.find(s => s.key === task.status) || STATUS_STEPS[0];
                              return (
                                <Draggable key={task._id} draggableId={task._id} index={index}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      onClick={() => openEditTask(task)}
                                      style={{
                                        ...provided.draggableProps.style,
                                        background: snapshot.isDragging ? "rgba(30,33,50,0.98)" : "rgba(255,255,255,0.04)",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                        borderRadius: 12, padding: "12px 12px",
                                        cursor: "pointer", transition: snapshot.isDragging ? "none" : "all 0.15s",
                                        boxShadow: snapshot.isDragging ? "0 20px 50px rgba(0,0,0,0.6)" : "none",
                                        transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} rotate(1.5deg)` : provided.draggableProps.style?.transform,
                                      }}
                                      onMouseEnter={e => { if (!snapshot.isDragging) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(99,102,241,0.3)"; }}
                                      onMouseLeave={e => { if (!snapshot.isDragging) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
                                    >
                                      {/* Header: Priority + Actions */}
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                          <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: pCfg.bg, color: pCfg.color, textTransform: "uppercase", letterSpacing: "0.08em" }}>{pCfg.label}</span>
                                          <span style={{ fontSize: 10, fontWeight: 600, color: statusStep.color }}>{statusStep.icon} {statusStep.label}</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 2 }} onClick={e => e.stopPropagation()}>
                                          <button onClick={() => openEditTask(task)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 3, borderRadius: 5, transition: "color 0.15s" }}
                                            onMouseEnter={e => e.currentTarget.style.color = "#818cf8"}
                                            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                                          ><IconEdit/></button>
                                          {isAdmin && (
                                            <button onClick={() => deleteTask(task._id)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 3, borderRadius: 5, transition: "color 0.15s" }}
                                              onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                                              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
                                            ><IconTrash/></button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Title */}
                                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", lineHeight: 1.45, marginBottom: task.description ? 6 : 0 }}>{task.title}</div>

                                      {/* Description */}
                                      {task.description && (
                                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, marginBottom: 8 }}>
                                          {task.description.length > 70 ? task.description.slice(0, 70) + "…" : task.description}
                                        </div>
                                      )}

                                      {/* Footer: Avatar + Due date */}
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                                        {task.assignedTo?.name ? (
                                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                                              {task.assignedTo.name[0].toUpperCase()}
                                            </div>
                                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{task.assignedTo.name}</span>
                                          </div>
                                        ) : <span/>}

                                        {task.dueDate && (
                                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: overdue ? "#f87171" : "rgba(255,255,255,0.4)" }}>
                                            <IconCalendar/> {formatDate(task.dueDate)}{overdue && " ⚠"}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}

                            {boardTasks.length === 0 && !snapshot.isDraggingOver && (
                              <div style={{ padding: "16px 0", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>
                                Drop tasks here
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>

                      {/* Add Task button */}
                      {!isTemp && (
                        <button onClick={() => openAddTask(board._id)}
                          style={{ margin: "8px 10px 10px", background: "none", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px", color: "rgba(255,255,255,0.35)", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.15s" }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.color = "#818cf8"; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
                        >
                          <IconPlus size={12}/> Add Task
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Ghost add column */}
                {isAdmin && (
                  <button onClick={() => setIsColModal(true)} style={{ flexShrink: 0, width: 200, height: 100, background: "none", border: "1.5px dashed rgba(255,255,255,0.08)", borderRadius: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", cursor: "pointer", gap: 8, fontSize: 12, transition: "all 0.2s", alignSelf: "flex-start" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)"; e.currentTarget.style.color = "#818cf8"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; }}
                  >
                    <IconPlus size={18}/> Add Column
                  </button>
                )}
              </div>
            </DragDropContext>
          )}
        </div>

        {/* ── Sidebars ── */}
        {showMembers && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setShowMembers(false)}>
            <div style={{ position: "absolute", right: 0, top: 0, width: 380, height: "100vh", background: "rgba(10,13,22,0.98)", borderLeft: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }} onClick={e => e.stopPropagation()}>
              <MembersSidebar workspaceId={project?.workspace} members={members} userRole={userRole} showMembers={showMembers}
                onUpdate={() => fetchMembers(project?.workspace)} onClose={() => setShowMembers(false)} onInviteOpen={() => { setShowMembers(false); setShowInvite(true); }}/>
            </div>
          </div>
        )}

        {showActivity && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200 }} onClick={() => setShowActivity(false)}>
            <div style={{ position: "absolute", right: 0, top: 0, width: 380, height: "100vh", background: "rgba(10,13,22,0.98)", borderLeft: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", padding: 24, boxSizing: "border-box", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>Activity</h3>
                <button onClick={() => setShowActivity(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: 20 }}>×</button>
              </div>
              <ActivityLog workspaceId={project?.workspace}/>
            </div>
          </div>
        )}

        {showInvite && (
          <InviteModal workspaceId={project?.workspace} onClose={() => setShowInvite(false)} onInviteSent={() => fetchMembers(project?.workspace)}/>
        )}

        {/* ── Create Column Modal ── */}
        {isColModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }} onClick={() => setIsColModal(false)}>
            <div style={{ background: "rgba(10,13,22,0.99)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: 380, boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 6, fontFamily: "Figtree, sans-serif" }}>New Column</div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>Add a new stage to your project workflow.</p>
              <form onSubmit={createBoardHandler}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Column name</label>
                <input
                  autoFocus required value={colName} onChange={e => setColName(e.target.value)}
                  placeholder="e.g. In Progress, Review…"
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 20, fontFamily: "inherit" }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button type="button" onClick={() => setIsColModal(false)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "8px 16px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
                  <button type="submit" disabled={colLoading} style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, padding: "8px 20px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                    {colLoading ? "Adding…" : "Add Column"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Task Modal ── */}
        {taskModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300 }} onClick={() => setTaskModal(null)}>
            <div style={{ background: "rgba(10,13,22,0.99)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4, fontFamily: "Figtree, sans-serif" }}>
                {taskModal.mode === "add" ? "New Task" : "Edit Task"}
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
                {taskModal.mode === "add" ? "Create a new task in this column." : "Update task details and status."}
              </p>
              <form onSubmit={submitTaskModal}>

                {/* Status Stepper — edit mode only */}
                {taskModal.mode === "edit" && taskModal.task?._id && (
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</label>
                    <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, border: "1px solid rgba(255,255,255,0.07)" }}>
                      {STATUS_STEPS.map((s) => {
                        const isActive = (taskModal.task?.status || taskForm.status) === s.key;
                        const stepIdx = STATUS_STEPS.findIndex(x => x.key === (taskModal.task?.status || taskForm.status));
                        const isPast  = STATUS_STEPS.findIndex(x => x.key === s.key) < stepIdx;
                        return (
                          <button key={s.key} type="button" onClick={() => updateTaskStatus(taskModal.task._id, s.key)}
                            style={{ flex: 1, border: "none", borderRadius: 9, padding: "8px 4px", cursor: "pointer", fontWeight: isActive ? 700 : 500, fontSize: 11, transition: "all 0.2s",
                              background: isActive ? s.color + "25" : "transparent",
                              color: isActive ? s.color : isPast ? s.color + "90" : "rgba(255,255,255,0.3)",
                              borderBottom: isActive ? `2px solid ${s.color}` : "2px solid transparent",
                              display: "flex", flexDirection: "column", alignItems: "center", gap: 2
                            }}>
                            <span style={{ fontSize: 18 }}>{s.icon}</span>
                            <span>{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {/* Progress bar */}
                    {(() => {
                      const idx = STATUS_STEPS.findIndex(s => s.key === (taskModal.task?.status || taskForm.status));
                      const pct = Math.round(((idx + 1) / STATUS_STEPS.length) * 100);
                      const col = STATUS_STEPS[idx]?.color || "#94a3b8";
                      return (
                        <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: col, borderRadius: 4, transition: "width 0.4s ease" }}/>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Title *</label>
                <input autoFocus required value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title…"
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 16, fontFamily: "inherit" }}/>

                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Description</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description…" rows={3}
                  style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 16, fontFamily: "inherit" }}/>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Priority</label>
                    <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", cursor: "pointer" }}>
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>Due Date</label>
                    <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))}
                      style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none", colorScheme: "dark", boxSizing: "border-box" }}/>
                  </div>
                </div>

                {isAdmin && (
                  <>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Assign To</label>
                    <AssignDropdown members={members} selectedId={taskForm.assignedTo} onSelect={uid => setTaskForm(f => ({ ...f, assignedTo: uid }))}/>
                    <div style={{ marginBottom: 8 }}/>
                  </>
                )}

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
                  <button type="button" onClick={() => setTaskModal(null)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "9px 18px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Cancel</button>
                  <button type="submit" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", borderRadius: 10, padding: "9px 20px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                    {taskModal.mode === "add" ? "Create Task" : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
          select option { background: #0f1117; }
        `}</style>
      </div>
    </AppShell>
  );
};

export default Board;
