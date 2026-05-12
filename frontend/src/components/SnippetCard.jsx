import Editor from "@monaco-editor/react";

const LANG_COLORS = {
  javascript:"#f7df1e", typescript:"#3178c6", python:"#3776ab", go:"#00add8",
  rust:"#ce422b", java:"#ed8b00", cpp:"#00589e", bash:"#4eaa25",
  html:"#e34f26", css:"#264de4", json:"#5c5c5c", sql:"#f29111",
  yaml:"#cb171e", markdown:"#083fa1", plaintext:"#94a3b8",
};

export default function SnippetCard({ snippet }) {
  if (!snippet) return null;
  const langColor = LANG_COLORS[snippet.language] || "#94a3b8";

  return (
    <div style={{
      background: "rgba(10,13,22,0.9)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 14, overflow: "hidden",
      marginTop: 8,
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", gap:8,
        padding:"10px 14px",
        background:"rgba(255,255,255,0.03)",
        borderBottom:"1px solid rgba(255,255,255,0.07)",
      }}>
        <span style={{ width:8, height:8, borderRadius:"50%", background:langColor, flexShrink:0 }}/>
        <span style={{ fontSize:11, fontWeight:700, color:langColor }}>
          {snippet.language?.toUpperCase()}
        </span>
        <span style={{ flex:1, fontSize:13, fontWeight:600, color:"#e2e8f0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {snippet.title}
        </span>
        {snippet.version && (
          <span style={{ fontSize:10, padding:"2px 7px", borderRadius:20, background:"rgba(99,102,241,0.12)", color:"#818cf8" }}>
            v{snippet.version}
          </span>
        )}
      </div>

      {/* Code preview — read-only Monaco, 160px tall */}
      <div style={{ height:160 }}>
        <Editor
          height="160px"
          language={snippet.language || "plaintext"}
          value={snippet.code || ""}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            lineNumbers: "off",
            scrollBeyondLastLine: false,
            fontSize: 12,
            padding: { top:8, bottom:8 },
            fontFamily:"'Fira Code',Consolas,monospace",
            scrollbar: { vertical:"hidden", horizontal:"hidden" },
            overviewRulerLanes: 0,
            renderLineHighlight: "none",
            folding: false,
          }}
        />
      </div>

      {/* Footer */}
      <div style={{
        padding:"6px 14px",
        borderTop:"1px solid rgba(255,255,255,0.05)",
        display:"flex", alignItems:"center", gap:10,
        fontSize:11, color:"rgba(255,255,255,0.3)",
      }}>
        <span>📎 Code snippet</span>
        {snippet.createdBy?.name && <span>by {snippet.createdBy.name}</span>}
        <button
          onClick={() => navigator.clipboard.writeText(snippet.code || "")}
          style={{
            marginLeft:"auto", background:"rgba(255,255,255,0.06)",
            border:"1px solid rgba(255,255,255,0.1)", borderRadius:6,
            padding:"2px 8px", color:"rgba(255,255,255,0.5)",
            cursor:"pointer", fontSize:11,
          }}
        >
          Copy
        </button>
      </div>
    </div>
  );
}
