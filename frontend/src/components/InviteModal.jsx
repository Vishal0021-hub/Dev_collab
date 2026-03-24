import { useState } from "react";
import API from "../services/api";

const InviteModal = ({ workspaceId, onClose, onInviteSent }) => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      setLoading(true);
      await API.post(`/workspaces/${workspaceId}/invite`, { email, role });
      onInviteSent();
      onClose();
    } catch (err) {
      console.error("Invite failed:", err);
      alert(err.response?.data?.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dc-overlay" onClick={onClose}>
      <div className="dc-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#fff' }}>Invite Member</h3>
          <button onClick={onClose} className="dc-nav-btn ghost">×</button>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 24 }}>
          Send an invitation to join your workspace. They will receive an email with instructions.
        </p>

        <form onSubmit={handleInvite}>
          <label className="dc-field-label">Email Address</label>
          <input 
            type="email" 
            required 
            autoFocus
            className="dc-input" 
            placeholder="colleague@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />

          <label className="dc-field-label">Default Role</label>
          <select 
            className="dc-input"
            value={role}
            onChange={e => setRole(e.target.value)}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>

          <div className="dc-modal-actions" style={{ marginTop: 24 }}>
            <button type="button" className="dc-btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="dc-btn-submit" disabled={loading}>
              {loading ? "Sending..." : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteModal;
