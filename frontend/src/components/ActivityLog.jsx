import { useEffect, useState } from "react";
import API from "../services/api";

const ActivityLog = ({ workspaceId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspaceId) {
      fetchActivities();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/activities/${workspaceId}`);
      setActivities(res.data);
    } catch (err) {
      console.error("Error fetching activities:", err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "task_created":  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
      case "task_moved":    return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="9 18 15 12 9 6"/></svg>;
      case "task_assigned": return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
      case "member_invited": return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;
      case "role_changed":  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
      case "task_deleted":  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>;
      default: return null;
    }
  };

  const getActivityMessage = (activity) => {
    const { type, details, user } = activity;
    const userName = <strong style={{color: '#fff'}}>{user?.name || "Someone"}</strong>;

    switch (type) {
      case "task_created":
        return <>{userName} created task <span className="highlight-text">{details.taskTitle}</span></>;
      case "task_moved":
        return <>{userName} moved <span className="highlight-text">{details.taskTitle}</span> from <span style={{opacity: 0.8}}>{details.fromBoard}</span> to <span style={{opacity: 0.8}}>{details.toBoard}</span></>;
      case "task_assigned":
        return <>{userName} assigned <span className="highlight-text">{details.taskTitle}</span> to <span style={{color: 'var(--indigo)'}}>{details.assignedToName === user?.name ? 'themselves' : details.assignedToName}</span></>;
      case "member_invited":
        return <>{userName} invited <span className="highlight-text">{details.invitedEmail}</span></>;
      case "role_changed":
        return <>{userName} changed <span style={{opacity: 0.8}}>{details.assignedToName}</span> to <span className="highlight-text">{details.newRole}</span></>;
      case "project_created":
        return <>{userName} created project <span className="highlight-text">{details.projectName}</span></>;
      case "task_deleted":
        return <>{userName} deleted task <span className="highlight-text">{details.taskTitle}</span></>;
      default:
        return <>{userName} performed an action</>;
    }
  };

  if (loading) return <div className="dc-skeleton" style={{ height: 200, borderRadius: 16 }} />;

  return (
    <div>
      <div className="dc-activity-list">
        {activities.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', marginTop: 40 }}>No activities yet.</p>
        ) : (
          activities.map((a) => (
            <div key={a._id} className="dc-activity-item" style={{ marginBottom: 24, position: 'relative' }}>
              <div className="dc-activity-dot" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, marginTop: 0, left: -6 }}>
                {getActivityIcon(a.type)}
              </div>
              <div className="dc-activity-content" style={{ paddingLeft: 8 }}>
                <div className="dc-activity-msg" style={{ fontSize: 13 }}>{getActivityMessage(a)}</div>
                <div className="dc-activity-time" style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>
                  {new Date(a.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
