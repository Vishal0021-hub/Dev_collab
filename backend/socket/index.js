const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let _io = null;

/* ── Initialise Socket.IO on the HTTP server ─────────────────── */
function initSocket(httpServer) {
  _io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  /* ── JWT auth middleware ── */
  _io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id name avatar");
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  /* ── Connection handler ── */
  _io.on("connection", (socket) => {
    console.log(`[Socket] ✓ ${socket.user.name} connected (${socket.id})`);

    // ── Room joins ──────────────────────────────────────────────
    socket.on("join:workspace", (workspaceId) => {
      socket.join(`ws:${workspaceId}`);
      // Broadcast online status to workspace
      socket.to(`ws:${workspaceId}`).emit("user:online", {
        userId: socket.user._id,
        name:   socket.user.name,
      });
    });

    socket.on("join:channel", (channelId) => {
      socket.join(`ch:${channelId}`);
    });

    socket.on("leave:channel", (channelId) => {
      socket.leave(`ch:${channelId}`);
    });

    socket.on("join:dm", ({ myId, recipientId }) => {
      const dmKey = [myId, recipientId].sort().join(":");
      socket.join(`dm:${dmKey}`);
    });

    // ── Typing indicators ───────────────────────────────────────
    socket.on("typing:start", ({ channelId }) => {
      socket.to(`ch:${channelId}`).emit("user:typing", {
        userId: socket.user._id.toString(),
        name:   socket.user.name,
      });
    });

    socket.on("typing:stop", ({ channelId }) => {
      socket.to(`ch:${channelId}`).emit("user:stopTyping", {
        userId: socket.user._id.toString(),
      });
    });

    socket.on("typing:start:dm", ({ recipientId }) => {
      const dmKey = [socket.user._id.toString(), recipientId].sort().join(":");
      socket.to(`dm:${dmKey}`).emit("user:typing:dm", {
        userId: socket.user._id.toString(),
        name:   socket.user.name,
      });
    });

    socket.on("typing:stop:dm", ({ recipientId }) => {
      const dmKey = [socket.user._id.toString(), recipientId].sort().join(":");
      socket.to(`dm:${dmKey}`).emit("user:stopTyping:dm", {
        userId: socket.user._id.toString(),
      });
    });

    // ── Disconnect ──────────────────────────────────────────────
    socket.on("disconnect", (reason) => {
      console.log(`[Socket] ✗ ${socket.user.name} disconnected (${reason})`);
      // Broadcast offline to all rooms this socket was in
      socket.rooms.forEach((room) => {
        if (room.startsWith("ws:")) {
          socket.to(room).emit("user:offline", {
            userId: socket.user._id.toString(),
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
