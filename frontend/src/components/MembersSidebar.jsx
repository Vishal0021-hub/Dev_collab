import { useState } from "react";
import API from "../services/api";

const MembersSidebar = ({ workspaceId, members, userRole, showMembers, onUpdate, onClose, onInviteOpen }) => {
  const [updating, setUpdating] = useState(null);

  const handleChangeRole = async (userId, newRole) => {
    try {
      setUpdating(userId);
      await API.put(`/workspaces/${workspaceId}/role/${userId}`, { role: newRole });
      onUpdate();
    } catch (err) {
      console.error("Change role failed:", err);
      alert(err.response?.data?.message || "Failed to change role");
    } finally {
      setUpdating(null);
    }
  };

  const getBadgeClass = (role) => {
    switch (role) {
      case "owner": return "dc-badge-owner";
      case "admin": return "dc-badge-admin";
      default: return "dc-badge-member";
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#fff' }}>Workspace Members</h3>
        <button onClick={onClose} className="dc-nav-btn ghost">×</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {members.map((m, idx) => (
          <div key={m.user._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 14, border: '1px solid var(--border)' }}>
            <div className="dc-mini-avatar" style={{ 
              width: 36, height: 36, fontSize: 13, fontWeight: 700,
              background: m.role === 'owner' ? 'var(--indigo)' : ['rgba(99,102,241,0.2)', 'rgba(139,92,246,0.2)', 'rgba(14,165,233,0.2)'][idx % 3],
              color: '#fff', border: m.role === 'owner' ? '1px solid var(--indigo)' : '1px solid var(--border)'
            }}>
              {m.user.name[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{m.user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.user.email}</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <span className={`dc-badge ${getBadgeClass(m.role)}`}>{m.role}</span>
              
              {userRole === "owner" && m.role !== "owner" && (
                <select 
                  className="dc-input" 
                  style={{ padding: '4px 8px', fontSize: 10, marginBottom: 0, width: 'auto', height: 'auto', background: 'rgba(0,0,0,0.2)' }}
                  value={m.role}
                  disabled={updating === m.user._id}
                  onChange={(e) => handleChangeRole(m.user._id, e.target.value)}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>

      {(userRole === "owner" || userRole === "admin") && (
        <button 
          className="dc-cta" 
          style={{ width: '100%', marginTop: 24, justifyContent: 'center' }}
          onClick={onInviteOpen}
        >
          Invite Member
        </button>
      )}
    </div>
  );
};

export default MembersSidebar;
