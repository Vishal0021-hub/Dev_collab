import { useEffect, useState } from "react";
import API from "../services/api";

const ActivityLog = ({ workspaceId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspaceId) {
      fetchActivities();
    }
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

  const getActivityMessage = (activity) => {
    const { type, details, user } = activity;
    const userName = <strong style={{color: 'var(--text-1)'}}>{user?.name || "Someone"}</strong>;

    switch (type) {
      case "task_created":
        return <>{userName} created task <span className="highlight-text">{details.taskTitle}</span></>;
      case "task_moved":
        return <>{userName} moved <span className="highlight-text">{details.taskTitle}</span> from {details.fromBoard} to {details.toBoard}</>;
      case "task_assigned":
        return <>{userName} assigned <span className="highlight-text">{details.taskTitle}</span> to {details.assignedToName}</>;
      case "member_invited":
        return <>{userName} invited <span className="highlight-text">{details.invitedEmail}</span> to the workspace</>;
      case "role_changed":
        return <>{userName} changed {details.assignedToName}'s role from {details.oldRole} to {details.newRole}</>;
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
    <div className="dc-activity-log">
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, marginBottom: 20, color: 'var(--text-2)' }}>Latest Activity</h3>
      <div className="dc-activity-list">
        {activities.length === 0 ? (
          <p style={{ color: 'var(--text-3)', fontSize: 13 }}>No activities yet.</p>
        ) : (
          activities.map((a) => (
            <div key={a._id} className="dc-activity-item">
              <div className="dc-activity-dot" />
              <div className="dc-activity-content">
                <div className="dc-activity-msg">{getActivityMessage(a)}</div>
                <div className="dc-activity-time">{new Date(a.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
