import { useState, useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";
import API from "../services/api";
import { toast } from "react-hot-toast";
import { useWorkspace } from "../context/WorkspaceContext";
import { useSocket } from "../context/SocketContext";

/* ─── Icons ─────────────────────────────────────────────────── */
const IconRun = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>;
const IconSave = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;
const IconShare = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>;
const IconClose = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const IconClear = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>;
const IconCopy = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>;
const IconHistory = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const IconRestore = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" /></svg>;

/* ─── Language config ───────────────────────────────────────── */
// runner: "sandbox" = in-browser JS | "html" = iframe preview
//         "json"    = local validate | "info" = save-only (no runner)
//         null      = markup/config (no runner)
const LANGUAGES = [
  {
    value: "javascript", label: "JavaScript", monacoLang: "javascript", runner: "sandbox",
    starter: 'console.log("Hello, World!");\nconsole.log("2 + 2 =", 2 + 2);\n\n// Arrays & objects work too\nconst arr = [1, 2, 3];\nconsole.log("Sum:", arr.reduce((a, b) => a + b, 0));'
  },
  {
    value: "typescript", label: "TypeScript", monacoLang: "typescript", runner: "sandbox",
    starter: '// TypeScript types are stripped before running\nconst greet = (name: string): string => `Hello, ${name}!`;\nconsole.log(greet("World"));\n\ninterface User { name: string; age: number; }\nconst user: User = { name: "Dev", age: 25 };\nconsole.log("User:", user);'
  },
  {
    value: "python", label: "Python", monacoLang: "python", runner: "judge0",
    starter: 'print("Hello, World!")\nfor i in range(5):\n    print(f"Count: {i}")'
  },
  {
    value: "go", label: "Go", monacoLang: "go", runner: "judge0",
    starter: 'package main\nimport "fmt"\nfunc main() {\n\tfmt.Println("Hello, World!")\n}'
  },
  {
    value: "rust", label: "Rust", monacoLang: "rust", runner: "judge0",
    starter: 'fn main() {\n    println!("Hello, World!");\n}'
  },
  {
    value: "java", label: "Java", monacoLang: "java", runner: "judge0",
    starter: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}'
  },
  {
    value: "cpp", label: "C++", monacoLang: "cpp", runner: "judge0",
    starter: '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}'
  },
  {
    value: "bash", label: "Bash", monacoLang: "shell", runner: "judge0",
    starter: 'echo "Hello, World!"\nfor i in 1 2 3; do echo "Count: $i"; done'
  },
  {
    value: "html", label: "HTML", monacoLang: "html", runner: "html",
    starter: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Preview</title>\n  <style>\n    body { font-family: sans-serif; background: #1a1a2e; color: #fff; padding: 24px; }\n    h1   { color: #818cf8; }\n    .card { background: rgba(255,255,255,0.06); border-radius: 12px; padding: 16px; margin-top: 16px; }\n  </style>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <div class="card">Edit this HTML and click <strong>Run ▶</strong> to live preview</div>\n</body>\n</html>'
  },
  {
    value: "css", label: "CSS", monacoLang: "css", runner: null,
    starter: 'body {\n  font-family: sans-serif;\n  background: #1a1a2e;\n  color: white;\n}'
  },
  {
    value: "json", label: "JSON", monacoLang: "json", runner: "json",
    starter: '{\n  "message": "Hello, World!",\n  "version": 1,\n  "tags": ["dev", "collab"]\n}'
  },
  {
    value: "sql", label: "SQL", monacoLang: "sql", runner: null,
    starter: 'SELECT "Hello, World!" AS message;'
  },
  {
    value: "yaml", label: "YAML", monacoLang: "yaml", runner: null,
    starter: 'message: Hello, World!\nversion: 1'
  },
  {
    value: "markdown", label: "Markdown", monacoLang: "markdown", runner: null,
    starter: '# Hello World\n\nThis is **markdown** with `inline code`.\n\n- Item 1\n- Item 2'
  },
  { value: "plaintext", label: "Plain Text", monacoLang: "plaintext", runner: null, starter: "" },
];

const LANG_COLORS = {
  javascript: "#f7df1e", typescript: "#3178c6", python: "#3776ab", go: "#00add8",
  rust: "#ce422b", java: "#ed8b00", cpp: "#00589e", bash: "#4eaa25",
  html: "#e34f26", css: "#264de4", json: "#5c5c5c", sql: "#f29111",
  yaml: "#cb171e", markdown: "#083fa1", plaintext: "#94a3b8",
};

/* ─── In-browser sandboxed JS runner ───────────────────────── */
// Runs JS/TS fully client-side using a sandboxed iframe + postMessage.
// No external API needed — works offline, no auth, instant.
function runJsSandbox(code) {
  // Strip TypeScript type annotations so TS runs as JS
  // (simple approach: remove ": type" patterns and "interface/type" blocks)
  const jsCode = code
    // Remove multi-line interface and type definitions
    .replace(/^(export\s+)?(interface|type)\s+\w+[\s\S]*?\{[\s\S]*?\}/gm, "")
    // Remove single-line type aliases
    .replace(/^(export\s+)?type\s+\w+\s*=[\s\S]*?;/gm, "")
    // Remove type annotations on variables and function params
    .replace(/:\s*(string|number|boolean|any|void|never|unknown|object|null|undefined|User|Task|Snippet)(\[\])?/gi, "")
    // Remove access modifiers and 'readonly'
    .replace(/\b(public|private|protected|readonly)\b\s+/g, "")
    // Remove generics <T>
    .replace(/<[A-Z][a-zA-Z0-9]*>/g, "");

  return new Promise((resolve) => {
    const logs = [], errs = [];
    let done = false;
    const t0 = performance.now();

    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener("message", handler);
      if (iframe.parentNode) document.body.removeChild(iframe);
      resolve({
        stdout: logs.join("\n"),
        stderr: errs.join("\n"),
        exitCode: errs.length > 0 ? 1 : 0,
        time: ((performance.now() - t0) / 1000).toFixed(3),
      });
    };

    const handler = ({ data: d }) => {
      if (!d || d.__src !== "devspace_runner") return;
      if (d.t === "log") logs.push(d.v);
      if (d.t === "error") errs.push(d.v);
      if (d.t === "done") finish();
    };

    window.addEventListener("message", handler);
    setTimeout(finish, 8000); // 8 second execution timeout

    const iframe = document.createElement("iframe");
    iframe.sandbox = "allow-scripts";
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    // Serialise any value to a readable string
    const fmtVal = `(x)=>{if(x===null)return"null";if(x===undefined)return"undefined";if(typeof x==="object"){try{return JSON.stringify(x,null,2)}catch{return String(x)}}return String(x)}`;

    const scriptBody = `
const __fmt=${fmtVal};
const __s=(t,v)=>window.parent.postMessage({__src:"devspace_runner",t,v},"*");
const console={
  log:(...a)=>__s("log",a.map(__fmt).join(" ")),
  error:(...a)=>__s("error",a.map(String).join(" ")),
  warn:(...a)=>__s("log","⚠ "+a.map(String).join(" ")),
  info:(...a)=>__s("log","ℹ "+a.map(String).join(" ")),
  table:(d)=>__s("log",JSON.stringify(d,null,2)),
  dir:(d)=>__s("log",JSON.stringify(d,null,2)),
  assert:(c,...a)=>{if(!c)__s("error","Assertion failed: "+a.join(" "));},
};
try{
${jsCode}
}catch(e){__s("error",e.toString()+(e.stack?"\\n"+e.stack.split("\\n").slice(1,4).join("\\n"):""));}
__s("done",null);`;

    const html = `<!doctype html><html><head></head><body><script>${scriptBody.replace(/<\/script>/g, "<\\/script>")}<\/script></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    iframe.onload = () => URL.revokeObjectURL(url);
    iframe.src = url;
  });
}

/* ─── Component ─────────────────────────────────────────────── */
export default function CodeEditorModal({ taskId, taskTitle, onClose, onSnippetSaved }) {
  const { channels } = useWorkspace();
  const { socket } = useSocket();

  const firstLang = LANGUAGES[0];
  const [code, setCode] = useState(firstLang?.starter || "");
  const [language, setLanguage] = useState("javascript");
  const [title, setTitle] = useState("");
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [shareChannel, setShareChannel] = useState("");
  const [showShare, setShowShare] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [savedSnippet, setSavedSnippet] = useState(null);
  // Collab / versioning
  const [version, setVersion] = useState(null);   // null = unsaved
  const [autoSaving, setAutoSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const [restoring, setRestoring] = useState(null);   // version being restored
  const editorRef = useRef(null);
  const autoSaveTimer = useRef(null);

  const langCfg = LANGUAGES.find(l => l.value === language) || LANGUAGES[0];
  const canRun = langCfg.runner !== null;
  const langColor = LANG_COLORS[language] || "#94a3b8";

  /* ── Load existing snippet for this task on mount ── */
  useEffect(() => {
    if (!taskId) return;
    const fetchExisting = async () => {
      try {
        const res = await API.get(`/snippets/task/${taskId}`);
        if (res.data) {
          console.log("[Snippet] Found existing snippet:", res.data._id);
          setSavedSnippet(res.data);
          setCode(res.data.code || "");
          setTitle(res.data.title || "");
          setLanguage(res.data.language || "javascript");
          setVersion(res.data.version);
        }
      } catch (err) { /* ignore */ }
    };
    fetchExisting();
  }, [taskId]);

  useEffect(() => {
    if (editorRef.current && savedSnippet?.code) {
      editorRef.current.setValue(savedSnippet.code);
    }
  }, [savedSnippet?._id]);

  /* ── Socket: join/leave snippet room ── */
  useEffect(() => {
    if (!socket || !savedSnippet?._id) return;
    console.log("[Socket] Joining snippet room:", savedSnippet._id);
    socket.emit("snippet:join", { snippetId: savedSnippet._id });

    // Listen for remote code changes
    const onRemoteCode = ({ code: remoteCode, userId }) => {
      console.log("[Socket] Remote code received from:", userId);
      const userStr = localStorage.getItem("user");
      const myId = userStr ? JSON.parse(userStr)._id : null;
      if (userId && userId === myId) return;  // ignore own echo
      setCode(remoteCode);
      if (editorRef.current) editorRef.current.setValue(remoteCode);
    };
    const onRemoteSaved = ({ version: v, savedByName }) => {
      console.log("[Socket] Remote save detected, new version:", v);
      setVersion(v);
      toast(`💾 v${v} saved by ${savedByName}`, { icon: "✅", duration: 2000 });
    };

    socket.on("snippet:codeChange", onRemoteCode);
    socket.on("snippet:saved", onRemoteSaved);

    // ── Cursor Presence ──
    const onCursorMove = ({ userId, name, color, line, column }) => {
      if (!editorRef.current || !monacoRef.current) return;
      const userStr = localStorage.getItem("user");
      const myId = userStr ? JSON.parse(userStr)._id : null;
      if (userId && userId === myId) return;

      const styleId = `cursor-style-${userId}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.innerHTML = `
          .remote-cursor-${userId} { border-left: 2px solid ${color} !important; }
          .remote-cursor-widget-${userId}::after {
            content: "${name}";
            position: absolute; top: -14px; left: 0;
            background: ${color}; color: #fff;
            font-size: 9px; padding: 0 4px; border-radius: 2px;
            white-space: nowrap; pointer-events: none; z-index: 10;
          }
        `;
        document.head.appendChild(style);
      }

      const decoration = {
        range: new monacoRef.current.Range(line, column, line, column),
        options: {
          className: `remote-cursor-${userId}`,
          beforeContentClassName: `remote-cursor-widget-${userId}`,
          hoverMessage: { value: name }
        }
      };

      const oldDecor = editorRef.current._remoteCursors?.[userId] || [];
      const newDecor = editorRef.current.deltaDecorations(oldDecor, [decoration]);
      if (!editorRef.current._remoteCursors) editorRef.current._remoteCursors = {};
      editorRef.current._remoteCursors[userId] = newDecor;
    };
    socket.on("snippet:cursorMove", onCursorMove);

    return () => {
      socket.emit("snippet:leave", { snippetId: savedSnippet._id });
      socket.off("snippet:codeChange", onRemoteCode);
      socket.off("snippet:saved", onRemoteSaved);
      socket.off("snippet:cursorMove", onCursorMove);
    };
  }, [socket, savedSnippet?._id]);

  /* ── Sync listener for snippet creation (handles first-time save sync) ── */
  useEffect(() => {
    if (!socket || !taskId) return;

    const onSnippetCreated = ({ taskId: tid, snippetId, title: t, language: l }) => {
      if (tid === taskId && !savedSnippet?._id) {
        console.log("[Socket] Teammate created snippet for this task, syncing ID:", snippetId);
        setSavedSnippet({ _id: snippetId });
        setTitle(t || "");
        setLanguage(l || "javascript");
        toast("Teammate started this code pad! Syncing...", { icon: "🔗" });
      }
    };

    socket.on("snippet:created", onSnippetCreated);
    return () => socket.off("snippet:created", onSnippetCreated);
  }, [socket, taskId, savedSnippet?._id]);

  /* ── Auto-save via PATCH (2 s debounce, only after first save) ── */
  const scheduleAutoSave = useCallback((newCode) => {
    if (!savedSnippet?._id) return;
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      setAutoSaving(true);
      try {
        const res = await API.patch(`/snippets/${savedSnippet._id}`, {
          code: newCode, title, language, silent: true
        });
        // Silent update doesn't bump version, but returns the object
      } catch { /* silent */ }
      finally { setAutoSaving(false); }
    }, 2000);
  }, [savedSnippet?._id, title, language]);

  /* ── Load history ── */
  const loadHistory = async () => {
    if (!savedSnippet?._id) return;
    setHistLoading(true);
    try {
      const res = await API.get(`/snippets/${savedSnippet._id}/history`);
      setHistory(res.data.history || []);
    } catch { toast.error("Could not load history"); }
    finally { setHistLoading(false); }
  };

  /* ── Restore snapshot ── */
  const restoreVersion = async (v) => {
    if (!savedSnippet?._id) return;
    setRestoring(v);
    const tid = toast.loading(`Restoring v${v}…`);
    try {
      const res = await API.post(`/snippets/${savedSnippet._id}/restore/${v}`);
      setCode(res.data.code);
      if (editorRef.current) editorRef.current.setValue(res.data.code);
      setVersion(res.data.currentVersion);
      toast.success(`Restored to v${v} → now v${res.data.currentVersion}`, { id: tid });
      setShowHistory(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Restore failed", { id: tid });
    } finally { setRestoring(null); }
  };


  /* ── Language switch ── */
  const switchLanguage = (lang) => {
    const cfg = LANGUAGES.find(l => l.value === lang);
    setLanguage(lang);
    setOutput(null);
    if (cfg?.starter) setCode(cfg.starter);
  };

  /* ── Monaco setup — suppress error popups while typing ── */
  const handleBeforeMount = (monaco) => {
    // Suppress TypeScript/JS semantic errors (type-checking)
    // These show red squiggles on valid code and cause "error" popups while typing
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,  // no type errors (e.g. "Cannot find name 'x'")
      noSyntaxValidation: false,   // keep real syntax errors
    });
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      noLib: true,
      allowNonTsExtensions: true,
    });
  };

  const monacoRef = useRef(null);
  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.focus();

    editor.onDidChangeCursorPosition(e => {
      if (socket && savedSnippet?._id) {
        socket.emit("snippet:cursorMove", {
          snippetId: savedSnippet._id,
          line: e.position.lineNumber,
          column: e.position.column
        });
      }
    });
  };

  /* ── Run code ── */
  const runCode = async () => {
    if (!code.trim()) { toast.error("Write some code first"); return; }

    // HTML → live iframe preview
    if (langCfg.runner === "html") {
      const blob = new Blob([code], { type: "text/html" });
      setOutput({ html: URL.createObjectURL(blob), exitCode: 0 });
      return;
    }

    // JSON → local validation
    if (langCfg.runner === "json") {
      try {
        const parsed = JSON.parse(code);
        const keys = Object.keys(parsed).length;
        setOutput({ stdout: `✅ Valid JSON\n${keys} key${keys !== 1 ? "s" : ""} at root level`, stderr: "", exitCode: 0, time: "0.000" });
      } catch (e) {
        setOutput({ stdout: "", stderr: `❌ Invalid JSON:\n${e.message}`, exitCode: 1, time: "0.000" });
      }
      return;
    }

    // JS/TS → sandboxed in-browser runner (no API needed)
    if (langCfg.runner === "sandbox") {
      setRunning(true);
      setOutput(null);
      try {
        const result = await runJsSandbox(code);
        setOutput(result);
      } catch (err) {
        setOutput({ stdout: "", stderr: `Runner error: ${err.message}`, exitCode: -1, time: null });
      } finally {
        setRunning(false);
      }
      return;
    }

    // Backend Execution via Judge0
    if (langCfg.runner === "judge0") {
      setRunning(true);
      setOutput(null);
      try {
        const res = await API.post("/snippets/execute", { code, language: langCfg.value });
        setOutput(res.data);
      } catch (err) {
        setOutput({ stdout: "", stderr: err.response?.data?.message || "Execution failed", exitCode: -1, time: null });
      } finally {
        setRunning(false);
      }
    }
  };

  /* ── Save snippet ── */
  const saveSnippet = async () => {
    if (!title.trim()) { toast.error("Enter a snippet title"); return; }
    if (!code.trim()) { toast.error("Write some code first"); return; }
    setSaving(true);
    const tid = toast.loading(savedSnippet?._id ? "Creating snapshot..." : "Saving...");
    try {
      let res;
      if (savedSnippet?._id) {
        // Manual update -> creates snapshot/version bump
        res = await API.patch(`/snippets/${savedSnippet._id}`, {
          taskId, title: title.trim(), language, code, silent: false
        });
      } else {
        // First time create
        res = await API.post("/snippets", { taskId, title: title.trim(), language, code });
      }

      setSavedSnippet(res.data);
      setVersion(res.data.version || 1);
      toast.success(savedSnippet?._id ? `Version v${res.data.version} created!` : "Snippet saved! ✓", { id: tid });
      if (onSnippetSaved) onSnippetSaved(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save", { id: tid });
    } finally { setSaving(false); }
  };

  /* ── Share snippet ── */
  const shareSnippet = async () => {
    if (!shareChannel) { toast.error("Select a channel"); return; }
    setSharing(true);
    const tid = toast.loading("Sharing…");
    try {
      await API.post(`/snippets/${showShare}/share`, { channelId: shareChannel });
      toast.success("Shared to channel!", { id: tid });
      setShowShare(null); setShareChannel("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to share", { id: tid });
    } finally { setSharing(false); }
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8, padding: "7px 12px", color: "#fff", fontSize: 13,
    outline: "none", fontFamily: "inherit",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      background: "#07090f",
      display: "flex", flexDirection: "column",
      fontFamily: "Figtree, Inter, sans-serif",
    }}>

      {/* ══ TOP BAR ═════════════════════════════════════════════ */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, padding: "0 20px",
        height: 54, flexShrink: 0,
        background: "rgba(10,13,22,0.97)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(16px)",
      }}>
        {/* Task label */}
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
          {taskTitle || "Task"}
        </div>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)" }} />

        {/* Snippet title input */}
        <input
          placeholder="Snippet name…"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ ...inputStyle, width: 200 }}
        />

        {/* Language picker */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "5px 10px", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: langColor, flexShrink: 0 }} />
          <select value={language} onChange={e => switchLanguage(e.target.value)}
            style={{ background: "transparent", border: "none", color: "#fff", fontSize: 13, outline: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            {LANGUAGES.map(l => (
              <option key={l.value} value={l.value} style={{ background: "#0d0f18" }}>{l.label}</option>
            ))}
          </select>
        </div>

        {/* Version badge */}
        {version !== null && (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(52,211,153,0.12)", color: "#34d399", fontWeight: 700 }}>
            v{version}{autoSaving ? " 💾…" : ""}
          </span>
        )}

        {/* Runner badge */}
        {langCfg.runner === "sandbox" && (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(52,211,153,0.12)", color: "#34d399", fontWeight: 700 }}>
            ⚡ In-browser
          </span>
        )}
        {langCfg.runner === "html" && (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(99,102,241,0.12)", color: "#818cf8", fontWeight: 700 }}>
            🖼 Live Preview
          </span>
        )}
        {langCfg.runner === "judge0" && (
          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(245,158,11,0.12)", color: "#fbbf24", fontWeight: 700 }}>
            ☁ Server
          </span>
        )}

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {/* Run button */}
          {canRun && (
            <button onClick={runCode} disabled={running}
              style={{
                background: running ? "rgba(52,211,153,0.2)" : "linear-gradient(135deg,#10b981,#059669)",
                border: "none", borderRadius: 8, padding: "7px 16px",
                color: "#fff", fontSize: 13, fontWeight: 700,
                cursor: running ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 6,
                boxShadow: "0 2px 12px rgba(16,185,129,0.25)",
              }}
            >
              <IconRun /> {running ? "Running…" : "Run ▶"}
            </button>
          )}

          {/* Save */}
          <button onClick={saveSnippet} disabled={saving}
            style={{
              background: saving ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
              border: "none", borderRadius: 8, padding: "7px 14px",
              color: "#fff", fontSize: 13, fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <IconSave /> {saving ? "Saving…" : "Save"}
          </button>

          {/* History — only after saving */}
          {savedSnippet && (
            <button onClick={() => { setShowHistory(p => !p); if (!showHistory) loadHistory(); }}
              style={{ background: showHistory ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px", color: showHistory ? "#818cf8" : "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <IconHistory /> History
            </button>
          )}

          {/* Share — only after saving */}
          {savedSnippet && (
            <button onClick={() => { setShowShare(savedSnippet._id); setShareChannel(""); }}
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "7px 14px", color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              <IconShare /> Share
            </button>
          )}

          {/* Close */}
          <button onClick={onClose}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}
          >
            <IconClose />
          </button>
        </div>
      </div>

      {/* ══ EDITOR + OUTPUT ══════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Monaco editor — 60% */}
        <div style={{ flex: "0 0 60%", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <Editor
              height="100%"
              language={langCfg.monacoLang}
              value={code}
              onChange={v => {
                const newCode = v || "";
                setCode(newCode);
                // Immediate socket relay
                if (savedSnippet?._id) {
                  socket?.emit("snippet:codeChange", { snippetId: savedSnippet._id, code: newCode });
                }
                scheduleAutoSave(newCode);
              }}
              theme="vs-dark"
              beforeMount={handleBeforeMount}
              onMount={handleEditorMount}
              options={{
                fontSize: 14,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                lineNumbers: "on",
                renderLineHighlight: "line",
                padding: { top: 16, bottom: 16 },
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontLigatures: true,
                wordWrap: "on",
                automaticLayout: true,
                tabSize: 2,
                bracketPairColorization: { enabled: true },
                hover: { enabled: true, delay: 1000 },       // delay hover popups
                quickSuggestions: { other: true, comments: false, strings: false },
                inlineSuggest: { enabled: false },
                codeLens: false,
              }}
            />
          </div>

          {/* VS Code-style status bar */}
          <div style={{
            height: 24, background: "rgba(99,102,241,0.75)",
            display: "flex", alignItems: "center", padding: "0 14px", gap: 16,
            fontSize: 11, color: "rgba(255,255,255,0.85)", flexShrink: 0,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: langColor }} />
              {langCfg.label}
            </span>
            {savedSnippet && (
              <span style={{ color: "#86efac" }}>✓ "{savedSnippet.title}" saved</span>
            )}
            {langCfg.runner === "sandbox" && (
              <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.6)" }}>
                Runs in browser · No network needed
              </span>
            )}
            {langCfg.runner === "judge0" && (
              <span style={{ marginLeft: "auto", color: "#fef08a" }}>
                Server execution · Runs remotely via Judge0
              </span>
            )}
            {langCfg.runner === null && (
              <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.6)" }}>
                No execution available for this format
              </span>
            )}
          </div>
        </div>

        {/* Output panel — 40% */}
        <div style={{ flex: "0 0 40%", display: "flex", flexDirection: "column", background: "#090c14" }}>

          {/* Output toolbar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0, height: 42,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Output
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {output && !output.html && (
                <>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700,
                    background: output.exitCode === 0 ? "rgba(52,211,153,0.15)" : "rgba(239,68,68,0.15)",
                    color: output.exitCode === 0 ? "#34d399" : "#f87171",
                  }}>
                    {output.exitCode === 0 ? "✓ OK" : `✗ Error`}
                  </span>
                  {output.time && (
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{output.time}s</span>
                  )}
                  <button
                    onClick={() => navigator.clipboard.writeText((output.stdout || "") + (output.stderr || ""))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex", padding: 4 }}
                    title="Copy output"
                  ><IconCopy /></button>
                  <button
                    onClick={() => setOutput(null)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", display: "flex", padding: 4 }}
                    title="Clear"
                  ><IconClear /></button>
                </>
              )}
            </div>
          </div>

          {/* Output content */}
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>

            {/* Empty state */}
            {!output && !running && langCfg.runner === "sandbox" && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", gap: 12 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                <div style={{ fontSize: 13 }}>Click <strong style={{ color: "#34d399" }}>Run ▶</strong> to execute</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", textAlign: "center" }}>
                  JavaScript runs directly in your browser<br />No internet connection needed
                </div>
              </div>
            )}

            {/* HTML empty */}
            {!output && !running && langCfg.runner === "html" && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", gap: 12 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                <div style={{ fontSize: 13 }}>Click <strong style={{ color: "#818cf8" }}>Run ▶</strong> to preview</div>
              </div>
            )}

            {/* Judge0 execution empty state */}
            {!output && !running && langCfg.runner === "judge0" && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", gap: 12 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                <div style={{ fontSize: 13 }}>Click <strong style={{ color: "#fbbf24" }}>Run ▶</strong> to execute on server</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", textAlign: "center" }}>
                  Code is executed remotely via Judge0<br />Requires an internet connection
                </div>
              </div>
            )}

            {/* No runner (CSS, SQL, YAML etc.) */}
            {!output && !running && langCfg.runner === null && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.2)" }}>
                <div style={{ fontSize: 13, marginBottom: 8 }}>{langCfg.label} is a markup/config format</div>
                <div style={{ fontSize: 11 }}>You can save and share this snippet — it cannot be executed</div>
              </div>
            )}

            {/* Loading */}
            {running && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, color: "rgba(255,255,255,0.5)" }}>
                <div style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.08)", borderTop: "3px solid #10b981", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                <div style={{ fontSize: 13 }}>Running…</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Executing in sandboxed browser context</div>
              </div>
            )}

            {/* HTML iframe preview */}
            {output?.html && (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>🖼 Live HTML Preview</span>
                  <button onClick={() => setOutput(null)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11 }}>Clear ×</button>
                </div>
                <iframe
                  src={output.html}
                  style={{ flex: 1, border: "1px solid rgba(255,255,255,0.1)", background: "#fff", borderRadius: 10 }}
                  sandbox="allow-scripts"
                  title="HTML Preview"
                />
              </div>
            )}

            {/* Text output */}
            {output && !output.html && (
              <div style={{ fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13, lineHeight: 1.8 }}>
                {output.stdout && (
                  <pre style={{ margin: 0, color: "#e2e8f0", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {output.stdout}
                  </pre>
                )}
                {output.stderr && (
                  <pre style={{ margin: 0, color: "#f87171", whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: output.stdout ? 12 : 0, padding: "10px 12px", background: "rgba(239,68,68,0.06)", borderRadius: 8, borderLeft: "3px solid #f87171" }}>
                    {output.stderr}
                  </pre>
                )}
                {!output.stdout && !output.stderr && output.exitCode === 0 && (
                  <div style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                    Program ran successfully with no output
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom hint bar */}
          <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", display: "flex", gap: 16 }}>
              <span>Esc → close</span>
              {langCfg.runner === "sandbox" && <span style={{ color: "rgba(52,211,153,0.5)" }}>⚡ Runs in your browser — no server needed</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ══ SHARE MODAL ══════════════════════════════════════════ */}
      {showShare && (
        <div
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 600 }}
          onClick={() => setShowShare(null)}
        >
          <div
            style={{ background: "rgba(10,13,22,0.99)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: 28, width: 360 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 6 }}>Share to Channel</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 18, lineHeight: 1.6 }}>
              A formatted code message will be posted to the selected channel.
            </p>
            <select
              value={shareChannel}
              onChange={e => setShareChannel(e.target.value)}
              style={{ ...inputStyle, width: "100%", marginBottom: 16, boxSizing: "border-box", cursor: "pointer" }}
            >
              <option value="">Select a channel…</option>
              {channels.map(ch => (
                <option key={ch._id} value={ch._id} style={{ background: "#0d0f18" }}>#{ch.name}</option>
              ))}
            </select>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowShare(null)}
                style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 16px", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
              >Cancel</button>
              <button onClick={shareSnippet} disabled={sharing || !shareChannel}
                style={{ background: shareChannel ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "8px 18px", color: "#fff", cursor: shareChannel ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}
              >
                <IconShare /> {sharing ? "Sharing…" : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ HISTORY PANEL ═════════════════════════════════════════ */}
      {showHistory && (
        <div style={{ position: "absolute", top: 54, right: 0, bottom: 0, width: 300, background: "rgba(7,9,15,0.98)", borderLeft: "1px solid rgba(255,255,255,0.08)", zIndex: 600, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>🕓 Version History</span>
            <button onClick={() => setShowHistory(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            {histLoading && <div style={{ textAlign: "center", padding: 24, color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Loading…</div>}
            {!histLoading && history.length === 0 && (
              <div style={{ textAlign: "center", padding: 24, color: "rgba(255,255,255,0.25)", fontSize: 13 }}>No history yet — save the snippet to create a version.</div>
            )}
            {!histLoading && history.map((snap, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#818cf8" }}>v{snap.version}</span>
                  <button onClick={() => restoreVersion(snap.version)} disabled={restoring === snap.version}
                    style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 6, padding: "3px 8px", color: "#818cf8", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <IconRestore /> {restoring === snap.version ? "Restoring…" : "Restore"}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                  {snap.savedBy?.name || "You"} · {snap.savedAt ? new Date(snap.savedAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                </div>
                <pre style={{ margin: "6px 0 0", fontSize: 10, fontFamily: "Fira Code,Consolas,monospace", color: "#94a3b8", background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: "6px 8px", overflow: "hidden", maxHeight: 60, whiteSpace: "pre", textOverflow: "ellipsis" }}>
                  {(snap.code || "").split("\n").slice(0, 4).join("\n")}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
