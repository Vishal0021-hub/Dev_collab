/* ── Skeleton loader primitives ────────────────────────────────
   Usage:
     <SkeletonLine />                      → single shimmer line
     <SkeletonLine width="60%" />          → shorter line
     <SkeletonBox height={120} />          → rectangle block
     <BoardSkeleton />                     → full kanban board
     <DashboardSkeleton />                 → dashboard cards
     <MessageSkeleton count={5} />         → chat message rows
────────────────────────────────────────────────────────────── */

const shimmer = {
  background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.6s ease-in-out infinite",
  borderRadius: 8,
};

export const SkeletonLine = ({ width = "100%", height = 14, style = {} }) => (
  <div style={{ ...shimmer, width, height, borderRadius: 6, ...style }} />
);

export const SkeletonBox = ({ height = 80, width = "100%", style = {} }) => (
  <div style={{ ...shimmer, height, width, borderRadius: 12, ...style }} />
);

export const SkeletonCircle = ({ size = 36 }) => (
  <div style={{ ...shimmer, width: size, height: size, borderRadius: "50%", flexShrink: 0 }} />
);

/* ── Board / Kanban skeleton ── */
export const BoardSkeleton = () => (
  <div style={{ display: "flex", gap: 18, padding: 24, overflowX: "auto" }}>
    {[1, 2, 3, 4].map(col => (
      <div key={col} style={{
        width: 280, flexShrink: 0,
        background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 16, padding: 16,
      }}>
        {/* Column header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <SkeletonCircle size={10}/>
          <SkeletonLine width="55%" height={14}/>
          <div style={{ marginLeft: "auto" }}>
            <SkeletonBox width={22} height={22}/>
          </div>
        </div>
        {/* Task cards */}
        {[1, 2, col === 1 ? 3 : null].filter(Boolean).map(card => (
          <div key={card} style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12, padding: 14, marginBottom: 10,
          }}>
            <SkeletonLine width="80%" style={{ marginBottom: 8 }}/>
            <SkeletonLine width="55%" height={11} style={{ marginBottom: 14 }}/>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SkeletonLine width={60} height={20} style={{ borderRadius: 20 }}/>
              <SkeletonCircle size={26}/>
            </div>
          </div>
        ))}
        {/* Add button placeholder */}
        <SkeletonBox height={36} style={{ borderRadius: 10, marginTop: 4 }}/>
      </div>
    ))}
    <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
  </div>
);

/* ── Dashboard stats skeleton ── */
export const DashboardSkeleton = () => (
  <div style={{ padding: 24 }}>
    {/* Header */}
    <SkeletonLine width={220} height={28} style={{ marginBottom: 8 }}/>
    <SkeletonLine width={340} height={14} style={{ marginBottom: 32 }}/>

    {/* Stat cards */}
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20 }}>
          <SkeletonLine width={90} height={11} style={{ marginBottom: 12 }}/>
          <SkeletonLine width={60} height={32} style={{ marginBottom: 8 }}/>
          <SkeletonLine width={100} height={10}/>
        </div>
      ))}
    </div>

    {/* Two columns */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20 }}>
        <SkeletonLine width={140} height={16} style={{ marginBottom: 20 }}/>
        {[80, 55, 70, 40, 90].map((w, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <SkeletonLine width={`${w}%`} height={28} style={{ borderRadius: 8 }}/>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20 }}>
        <SkeletonLine width={160} height={16} style={{ marginBottom: 20 }}/>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <SkeletonCircle size={32}/>
            <div style={{ flex: 1 }}>
              <SkeletonLine width="60%" style={{ marginBottom: 6 }}/>
              <SkeletonLine width="40%" height={11}/>
            </div>
          </div>
        ))}
      </div>
    </div>
    <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
  </div>
);

/* ── Channel / DM message skeleton ── */
export const MessageSkeleton = ({ count = 6 }) => (
  <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <SkeletonCircle size={36}/>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <SkeletonLine width={90} height={12}/>
            <SkeletonLine width={50} height={10}/>
          </div>
          <SkeletonLine width={`${50 + (i * 17) % 40}%`} style={{ marginBottom: 5 }}/>
          {i % 3 === 0 && <SkeletonLine width="35%" height={12}/>}
        </div>
      </div>
    ))}
    <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
  </div>
);

/* ── Projects list skeleton ── */
export const ProjectsSkeleton = () => (
  <div style={{ padding: 24 }}>
    <SkeletonLine width={180} height={26} style={{ marginBottom: 8 }}/>
    <SkeletonLine width={280} height={13} style={{ marginBottom: 28 }}/>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
      {[1,2,3,4,5,6].map(i => (
        <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 20, height: 140 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <SkeletonBox width={40} height={40} style={{ borderRadius: 10 }}/>
            <SkeletonLine width="60%" height={16}/>
          </div>
          <SkeletonLine width="85%" style={{ marginBottom: 8 }}/>
          <SkeletonLine width="50%" height={11} style={{ marginBottom: 16 }}/>
          <SkeletonLine width="30%" height={24} style={{ borderRadius: 20 }}/>
        </div>
      ))}
    </div>
    <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
  </div>
);
