import { useState } from "react";
import { toast } from "react-hot-toast";
import API from "../services/api";

const InviteModal = ({ workspaceId, onClose, onInviteSent }) => {
  const [email, setEmail]     = useState("");
  const [role, setRole]       = useState("member");
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    const loadingToast = toast.loading("Sending invitation...");
    try {
      setLoading(true);
      const res = await API.post(`/workspaces/${workspaceId}/invite`, {
        email: email.trim(),
        role,
      });

      if (res.data.emailSent) {
        toast.success(`Invitation sent to ${email}`, { id: loadingToast });
      } else {
        toast.success(`User invited, but email failed to send`, { id: loadingToast });
      }
      onInviteSent();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invitation", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "fadeIn 0.15s ease-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#0a0c14",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 28,
          padding: "40px 40px 36px",
          boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(99,102,241,0.1)",
          animation: "modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.25))",
            border: "1px solid rgba(99,102,241,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
            boxShadow: "0 8px 24px rgba(99,102,241,0.2)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.5">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>

        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
            marginBottom: 6,
            letterSpacing: "-0.02em",
          }}
        >
          Invite a Member
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 28, lineHeight: 1.5 }}>
          They must already have a DevCollab account. Enter their registered email address.
        </p>

        <form onSubmit={handleInvite}>
          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 12,
            }}
          >
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
            required
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              color: "#fff",
              fontSize: 14,
              marginBottom: 24,
            }}
          />

          <label
            style={{
              display: "block",
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 12,
            }}
          >
            Assign Role
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
            <button
              type="button"
              onClick={() => setRole("member")}
              style={{
                padding: "12px",
                borderRadius: 14,
                background: role === "member" ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${role === "member" ? "var(--indigo)" : "var(--border)"}`,
                color: role === "member" ? "#fff" : "var(--text-3)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>👤</span> Member
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              style={{
                padding: "12px",
                borderRadius: 14,
                background: role === "admin" ? "rgba(129,140,248,0.1)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${role === "admin" ? "var(--indigo)" : "var(--border)"}`,
                color: role === "admin" ? "#fff" : "var(--text-3)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>🛡️</span> Admin
            </button>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.15)",
              fontSize: 11,
              color: "var(--text-3)",
              marginBottom: 24,
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--indigo)"
              strokeWidth="2.5"
              style={{ marginTop: 1, flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              {role === "admin"
                ? "Admins can invite others, create projects, and manage tasks."
                : "Members can view projects and manage tasks assigned to them."}
            </span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                color: "var(--text-3)",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = "var(--text-3)";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: "12px 20px",
                borderRadius: 12,
                background: loading ? "rgba(99,102,241,0.3)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "var(--font-display)",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: loading ? "none" : "0 4px 16px rgba(99,102,241,0.35)",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              {loading ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="8" />
                  </svg>
                  Sending…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Send Invite
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.92) translateY(16px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default InviteModal;
