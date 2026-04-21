import { useState, useRef } from "react";
import API from "../services/api";
import { toast } from "react-hot-toast";

/* ─── Icons ────────────────────────────────────────────────────── */
const IconUpload  = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
const IconFile    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;
const IconImg     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
const IconTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>;
const IconDown    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

const ACCEPTED = ["image/jpeg","image/jpg","image/png","image/gif","image/webp","application/pdf"];

const fmtSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
};

const mimeIcon = (mime) => mime?.startsWith("image/") ? <IconImg/> : <IconFile/>;

export default function AttachmentPanel({ taskId, isAdmin }) {
  const [attachments, setAttachments]   = useState([]);
  const [loaded,      setLoaded]        = useState(false);
  const [dragging,    setDragging]      = useState(false);
  const [uploading,   setUploading]     = useState(false);
  const [progress,    setProgress]      = useState(0);
  const inputRef = useRef(null);

  /* Load once when panel mounts */
  const load = async () => {
    if (loaded) return;
    try {
      const res = await API.get(`/tasks/${taskId}/attachments`);
      setAttachments(res.data);
      setLoaded(true);
    } catch { toast.error("Could not load attachments"); }
  };

  /* Called on first render of this panel */
  if (!loaded && taskId) load();

  const uploadFile = async (file) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Only images (jpg, png, gif, webp) and PDFs are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large — max 10 MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    setProgress(0);
    const tid = toast.loading(`Uploading ${file.name}…`);
    try {
      const res = await API.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => setProgress(Math.round((e.loaded / e.total) * 100)),
      });
      setAttachments(prev => [...prev, res.data.attachment]);
      toast.success("Uploaded!", { id: tid });
    } catch (err) {
      const msg = err.response?.data?.message || "Upload failed";
      toast.error(msg.includes("credentials") || msg.includes("Cloudinary")
        ? "⚠️ Cloudinary not configured yet — add credentials to .env"
        : msg,
        { id: tid, duration: 5000 }
      );
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleDelete = async (att) => {
    if (!window.confirm(`Delete "${att.filename}"?`)) return;
    const tid = toast.loading("Deleting…");
    try {
      await API.delete(`/tasks/${taskId}/attachments`, {
        params: { publicId: att.publicId }
      });
      setAttachments(prev => prev.filter(a => a._id !== att._id));
      toast.success("Deleted", { id: tid });
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed", { id: tid });
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Drop zone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#6366f1" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 14,
          padding: "32px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          cursor: uploading ? "not-allowed" : "pointer",
          background: dragging ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.02)",
          transition: "all 0.2s",
          userSelect: "none",
        }}
      >
        <div style={{ color: dragging ? "#818cf8" : "rgba(255,255,255,0.3)", transition: "color 0.2s" }}>
          <IconUpload/>
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
          {uploading ? `Uploading… ${progress}%` : "Drop file here or click to browse"}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          Images (jpg, png, gif, webp) · PDF · Max 10 MB
        </div>

        {/* Progress bar */}
        {uploading && (
          <div style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progress}%`,
              background: "linear-gradient(90deg,#6366f1,#8b5cf6)",
              borderRadius: 4, transition: "width 0.3s ease"
            }}/>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          style={{ display: "none" }}
          onChange={(e) => uploadFile(e.target.files[0])}
        />
      </div>

      {/* ── Attachment list ── */}
      {attachments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "12px 0", fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
          No attachments yet
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {attachments.map((att) => {
            const isImage = att.mimetype?.startsWith("image/");
            return (
              <div key={att._id || att.publicId} style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                overflow: "hidden",
              }}>
                {/* Image preview */}
                {isImage && (
                  <div style={{ width: "100%", maxHeight: 140, overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <img src={att.url} alt={att.filename}
                      style={{ width: "100%", objectFit: "cover", maxHeight: 140, display: "block" }}
                    />
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
                  {/* Icon */}
                  <div style={{ color: isImage ? "#818cf8" : "#94a3b8", flexShrink: 0 }}>
                    {mimeIcon(att.mimetype)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {att.filename}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                      {fmtSize(att.size)} · {att.mimetype?.split("/")[1]?.toUpperCase()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <a href={att.url} target="_blank" rel="noreferrer"
                      style={{ background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 8, padding: "5px 8px", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex", alignItems: "center", textDecoration: "none" }}
                      title="Download"
                    >
                      <IconDown/>
                    </a>
                    {isAdmin && (
                      <button onClick={() => handleDelete(att)}
                        style={{ background: "rgba(239,68,68,0.1)", border: "none", borderRadius: 8, padding: "5px 8px", color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center" }}
                        title="Delete"
                      >
                        <IconTrash/>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
