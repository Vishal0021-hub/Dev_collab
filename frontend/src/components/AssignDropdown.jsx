import { useState, useRef, useEffect } from "react";

const AVATAR_PALETTES = [
  ["#6366f1","#4f46e5"], ["#8b5cf6","#7c3aed"], ["#06b6d4","#0891b2"],
  ["#10b981","#059669"], ["#f59e0b","#d97706"], ["#f43f5e","#e11d48"],
];

const MiniAvatar = ({ name, index, size = 24 }) => {
  const [a, b] = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${a}, ${b})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.45, fontWeight: 700, color: "#fff",
      flexShrink: 0
    }}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
};

const AssignDropdown = ({ members, selectedId, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedMember = members.find(m => m.user._id === selectedId || m.user === selectedId);
  const filteredMembers = members.filter(m => 
    m.user.name.toLowerCase().includes(search.toLowerCase()) ||
    m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={dropdownRef} style={{ position: "relative", width: "100%" }}>
      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%", padding: "12px 16px",
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${isOpen ? "var(--indigo)" : "var(--border)"}`,
          borderRadius: 14, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12,
          transition: "all 0.2s",
          boxShadow: isOpen ? "0 0 0 4px rgba(99,102,241,0.1)" : "none",
        }}
      >
        {selectedMember ? (
          <>
            <MiniAvatar name={selectedMember.user.name} index={members.indexOf(selectedMember)} />
            <span style={{ fontSize: 14, color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedMember.user.name}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 14, color: "var(--text-3)", flex: 1 }}>Unassigned</span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* Menu */}
      {isOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0,
          background: "#0f111a",
          border: "1px solid var(--border)",
          borderRadius: 18, zIndex: 1000,
          boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
          padding: 8,
          animation: "dropdownIn 0.2s ease-out",
        }}>
          {/* Search */}
          <div style={{ padding: "4px 8px 8px" }}>
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search members..."
              style={{
                width: "100%", padding: "8px 12px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid var(--border)",
                borderRadius: 10, color: "#fff", fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {/* Unassign option */}
            <div
              onClick={() => { onSelect(""); setIsOpen(false); }}
              style={{
                padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12,
                background: !selectedId ? "rgba(99,102,241,0.1)" : "transparent",
                transition: "all 0.2s",
              }}
              className="dc-dropdown-item"
            >
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </div>
              <span style={{ fontSize: 13, color: !selectedId ? "#fff" : "var(--text-3)" }}>Unassigned</span>
            </div>

            {filteredMembers.map((m, idx) => (
              <div
                key={m.user._id}
                onClick={() => { onSelect(m.user._id); setIsOpen(false); }}
                style={{
                  padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 12,
                  background: selectedId === m.user._id ? "rgba(99,102,241,0.1)" : "transparent",
                  transition: "all 0.2s",
                }}
                className="dc-dropdown-item"
              >
                <MiniAvatar name={m.user.name} index={idx} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.user.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {m.user.email}
                  </div>
                </div>
                {selectedId === m.user._id && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            ))}

            {filteredMembers.length === 0 && (
              <div style={{ padding: "20px", textAlign: "center", fontSize: 12, color: "var(--text-3)" }}>
                No members found
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .dc-dropdown-item:hover {
          background: rgba(255,255,255,0.05) !important;
        }
      `}</style>
    </div>
  );
};

export default AssignDropdown;
