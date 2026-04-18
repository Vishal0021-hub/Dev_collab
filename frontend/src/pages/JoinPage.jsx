import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "react-hot-toast";

const JoinPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const joinWorkspace = async () => {
      try {
        // Check if user is logged in
        const user = localStorage.getItem("user");
        if (!user) {
          // Redirect to login with redirect param
          navigate(`/login?redirect=/join/${token}`);
          return;
        }

        const res = await API.post(`/workspaces/join/${token}`);
        toast.success("Successfully joined workspace!");
        navigate(`/projects/${res.data.workspace._id}`);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to join workspace");
      } finally {
        setLoading(false);
      }
    };

    joinWorkspace();
  }, [token, navigate]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0c14"
      }}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>Joining Workspace...</div>
          <div style={{ width: 40, height: 40, border: "4px solid #6366f1", borderTop: "4px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0c14",
        padding: 24
      }}>
        <div style={{
          background: "#1a1d2e",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 16,
          padding: 40,
          textAlign: "center",
          maxWidth: 400,
          color: "#fff"
        }}>
          <div style={{ fontSize: 24, marginBottom: 16 }}>Unable to Join</div>
          <div style={{ color: "#f87171", marginBottom: 24 }}>{error}</div>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "#6366f1",
              color: "#fff",
              border: "none",
              padding: "12px 24px",
              borderRadius: 8,
              cursor: "pointer"
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default JoinPage;
