import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

/* ── Provider — wraps entire app in App.jsx ─────────────────── */
export function SocketProvider({ children }) {
  const [socket,      setSocket]      = useState(null);
  const [connected,   setConnected]   = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set()); // Set<userId>
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // don't connect if not logged in

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

    const s = io(SOCKET_URL, {
      auth:       { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
    });

    s.on("connect", () => {
      console.log("[Socket] ✓ Connected");
      setConnected(true);
    });

    s.on("disconnect", (reason) => {
      console.log("[Socket] ✗ Disconnected:", reason);
      setConnected(false);
    });

    s.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
    });

    // ── Online presence ──
    s.on("user:online",  ({ userId }) => setOnlineUsers(prev => new Set([...prev, userId])));
    s.on("user:offline", ({ userId }) => setOnlineUsers(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    }));

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, connected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}

/* ── Hook ───────────────────────────────────────────────────── */
export const useSocket = () => useContext(SocketContext);
