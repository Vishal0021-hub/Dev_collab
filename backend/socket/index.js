const { Server } = require("socket.io");
const jwt        = require("jsonwebtoken");
const User       = require("../models/User");
const Workspace  = require("../models/workspace");

let _io = null;

/* ── Cursor colours assigned per snippet session ─────────────────
   Each connected user gets a stable colour within a snippet room.
   ─────────────────────────────────────────────────────────────── */
const CURSOR_COLORS = [
  "#E24B4A", "#1D9E75", "#378ADD",
  "#EF9F27", "#7F77DD", "#D85A30",
];

/**
 * Deterministic colour index from userId string
 * so the same user always gets the same colour.
 */
function colorForUser(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return CURSOR_COLORS[hash % CURSOR_COLORS.length];
}

/* ── Online presence tracking ────────────────────────────────────
   Map<workspaceId, Set<userId>>  — kept in-process memory.
   ─────────────────────────────────────────────────────────────── */
const onlineByWorkspace = new Map();

function markOnline(workspaceId, userId) {
  if (!onlineByWorkspace.has(workspaceId)) {
    onlineByWorkspace.set(workspaceId, new Set());
  }
  onlineByWorkspace.get(workspaceId).add(userId.toString());
}

function markOffline(workspaceId, userId) {
  onlineByWorkspace.get(workspaceId)?.delete(userId.toString());
}

/* ── Initialise Socket.IO on the HTTP server ─────────────────── */
function initSocket(httpServer) {
  _io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.CLIENT_URL,
        process.env.SOCKET_CORS_ORIGIN,
        "http://localhost:5173",
        "http://127.0.0.1:5173"
      ].filter(Boolean),
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  /* ── JWT auth middleware ────────────────────────────────────── */
  _io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        console.warn("[Socket] ✗ Auth failed: No token provided");
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select("_id name avatar email");
      if (!user) {
        console.warn("[Socket] ✗ Auth failed: User not found in DB");
        return next(new Error("User not found"));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.warn("[Socket] ✗ Auth failed: Invalid token", err.message);
      next(new Error("Invalid token"));
    }
  });

  /* ── Connection handler ─────────────────────────────────────── */
  _io.on("connection", (socket) => {
    console.log(`[Socket] ✓ ${socket.user.name} connected  (${socket.id})`);

    /* ════════════════════════════════════════════════════════════
       WORKSPACE ROOMS + ONLINE PRESENCE
       ════════════════════════════════════════════════════════════ */
    socket.on("join:workspace", async (workspaceId) => {
      try {
        const room = `ws:${workspaceId}`;
        socket.join(room);

        markOnline(workspaceId, socket.user._id);

        // Broadcast to everyone else in the workspace
        socket.to(room).emit("user:online", {
          userId:      socket.user._id.toString(),
          name:        socket.user.name,
          workspaceId,
        });

        // Tell this socket who is already online
        const online = [...(onlineByWorkspace.get(workspaceId) || [])];
        socket.emit("workspace:onlineUsers", { workspaceId, userIds: online });
      } catch (err) {
        console.error("[Socket] join:workspace error:", err.message);
      }
    });

    /* ════════════════════════════════════════════════════════════
       CHANNEL ROOMS
       ════════════════════════════════════════════════════════════ */
    socket.on("join:channel", (channelId) => {
      socket.join(`ch:${channelId}`);
    });

    socket.on("leave:channel", (channelId) => {
      socket.leave(`ch:${channelId}`);
    });

    /* ════════════════════════════════════════════════════════════
       DM ROOMS
       ════════════════════════════════════════════════════════════ */
    socket.on("join:dm", ({ myId, recipientId }) => {
      const dmKey = [myId, recipientId].sort().join(":");
      socket.join(`dm:${dmKey}`);
    });

    /* ════════════════════════════════════════════════════════════
       CHANNEL TYPING INDICATORS
       ════════════════════════════════════════════════════════════ */
    socket.on("typing:start", ({ channelId }) => {
      socket.to(`ch:${channelId}`).emit("user:typing", {
        userId: socket.user._id.toString(),
        name:   socket.user.name,
        channelId,
        isTyping: true,
      });
    });

    socket.on("typing:stop", ({ channelId }) => {
      socket.to(`ch:${channelId}`).emit("user:stopTyping", {
        userId: socket.user._id.toString(),
        channelId,
        isTyping: false,
      });
    });

    /* DM typing */
    socket.on("typing:start:dm", ({ recipientId }) => {
      const dmKey = [socket.user._id.toString(), recipientId].sort().join(":");
      socket.to(`dm:${dmKey}`).emit("user:typing:dm", {
        userId: socket.user._id.toString(),
        name:   socket.user.name,
        isTyping: true,
      });
    });

    socket.on("typing:stop:dm", ({ recipientId }) => {
      const dmKey = [socket.user._id.toString(), recipientId].sort().join(":");
      socket.to(`dm:${dmKey}`).emit("user:stopTyping:dm", {
        userId: socket.user._id.toString(),
        isTyping: false,
      });
    });



    /* ════════════════════════════════════════════════════════════
       TASK EVENTS (emitted from controllers via getIO())
       ════════════════════════════════════════════════════════════ */
    // task:statusChanged and task:assigned are emitted by the task controller.
    // No socket.on() needed here — those are server-initiated, not client-initiated.

    /* ════════════════════════════════════════════════════════════
       DISCONNECT
       ════════════════════════════════════════════════════════════ */
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] ✗ ${socket.user.name} disconnected (${reason})`);

      // Broadcast offline to all workspace rooms this socket was in
      socket.rooms.forEach((room) => {
        if (room.startsWith("ws:")) {
          const workspaceId = room.slice(3);
          markOffline(workspaceId, socket.user._id);
          socket.to(room).emit("user:offline", {
            userId:      socket.user._id.toString(),
            workspaceId,
          });
        }


      });
    });
  });

  return _io;
}

/* ── Getter — use in controllers to emit events ──────────────── */
function getIO() {
  if (!_io) throw new Error("[Socket] Not initialized — call initSocket first");
  return _io;
}

module.exports = { initSocket, getIO };
