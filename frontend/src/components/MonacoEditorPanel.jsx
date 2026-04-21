import { useState, useEffect } from "react";
import API from "../services/api";
import { toast } from "react-hot-toast";
import CodeEditorModal from "./CodeEditorModal";

/* ─── Icons ─────────────────────────────────────────────────── */
const IconCode   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>;
const IconCopy   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const IconTrash  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconShare  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;

const LANG_COLORS = {
  javascript:"#f7df1e", typescript:"#3178c6", python:"#3776ab", go:"#00add8",
  rust:"#ce422b",       java:"#ed8b00",       cpp:"#00589e",    bash:"#4eaa25",
  html:"#e34f26",       css:"#264de4",        json:"#5c5c5c",   sql:"#f29111",
  yaml:"#cb171e",       markdown:"#083fa1",   plaintext:"#94a3b8",
};

export default function MonacoEditorPanel({ taskId, taskTitle }) {
  const [snippets,   setSnippets]   = useState([]);
  const [loaded,     setLoaded]     = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [copiedId,   setCopiedId]   = useState(null);

  useEffect(() => {
    if (taskId) loadSnippets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const loadSnippets = async () => {
    try {
      const res = await API.get(`/snippets/task/${taskId}`);
      setSnippets(res.data);
      setLoaded(true);
    } catch { toast.error("Could not load snippets"); }
  };

  const deleteSnippet = async (id) => {
    if (!window.confirm("Delete this snippet?")) return;
    const tid = toast.loading("Deleting…");
    try {
      await API.delete(`/snippets/${id}`);
      setSnippets(prev => prev.filter(s => s._id !== id));
      toast.success("Deleted", { id: tid });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed", { id: tid });
    }
  };

  const copyCode = (s) => {
    navigator.clipboard.writeText(s.code).then(() => {
      setCopiedId(s._id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Copied!");
    });
  };

  return (
    <>
      {/* ── Open Editor button ── */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: "28px 20px",
        background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))",
        border: "1px dashed rgba(99,102,241,0.3)",
        borderRadius: 14, gap: 12, marginBottom: 16,
      }}>
        <div style={{ color: "#818cf8" }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>
            Open Full-Screen Editor
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.5 }}>
            Monaco editor · Multi-language compiler · Run &amp; test your code
          </div>
        </div>
        <button
          onClick={() => setEditorOpen(true)}
          style={{
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: "none", borderRadius: 10, padding: "10px 24px",
            color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";    e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.3)"; }}
        >
          <IconCode/> Open Code Editor
        </button>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          Supports JS · TS · Python · Go · Rust · Java · C++ · Bash · HTML
        </div>
      </div>

      {/* ── Saved snippets list ── */}
      {loaded && snippets.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
            Saved Snippets ({snippets.length})
          </div>
          {snippets.map(s => {
            const langColor = LANG_COLORS[s.language] || "#94a3b8";
            return (
              <div key={s._id} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, overflow: "hidden",
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: langColor, flexShrink: 0 }}/>
                  <span style={{ fontSize: 11, fontWeight: 700, color: langColor }}>
                    {s.language?.toUpperCase()}
                  </span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.title}
                  </span>
                  {s.sharedToChannel && (
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "rgba(52,211,153,0.12)", color: "#34d399" }}>
                      Shared ✓
                    </span>
                  )}
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => copyCode(s)}
                      style={{ background: copiedId === s._id ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)", border: "none", borderRadius: 6, padding: "4px 8px", color: copiedId === s._id ? "#34d399" : "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <IconCopy/> {copiedId === s._id ? "Copied!" : "Copy"}
                    </button>
                    <button onClick={() => deleteSnippet(s._id)}
                      style={{ background: "rgba(239,68,68,0.08)", border: "none", borderRadius: 6, padding: "4px 7px", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center" }}
                    >
                      <IconTrash/>
                    </button>
                  </div>
                </div>
                {/* Code preview */}
                <pre style={{
                  margin: 0, padding: "10px 14px",
                  fontSize: 12, fontFamily: "'Fira Code', Consolas, monospace",
                  color: "#94a3b8", background: "rgba(0,0,0,0.15)",
                  overflow: "auto", maxHeight: 100, whiteSpace: "pre", lineHeight: 1.6,
                }}>
                  {s.code.split("\n").slice(0, 6).join("\n")}
                  {s.code.split("\n").length > 6 ? "\n…" : ""}
                </pre>
              </div>
            );
          })}
        </div>
      )}

      {loaded && snippets.length === 0 && (
        <div style={{ textAlign: "center", padding: "4px 0 8px", fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
          No snippets saved yet — open the editor to write one
        </div>
      )}

      {/* ── Full-screen editor modal ── */}
      {editorOpen && (
        <CodeEditorModal
          taskId={taskId}
          taskTitle={taskTitle}
          onClose={() => setEditorOpen(false)}
          onSnippetSaved={(s) => setSnippets(prev => [s, ...prev])}
        />
      )}
    </>
  );
}
