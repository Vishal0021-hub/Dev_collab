/**
 * GitHub Webhook Handler
 *
 * IMPORTANT: This route uses express.raw() — it must be registered
 * BEFORE the global express.json() middleware in server.js so the raw
 * body bytes are preserved for HMAC signature verification.
 *
 * POST /api/github/webhook
 */

const express    = require("express");
const crypto     = require("crypto");
const router     = express.Router();
const Task       = require("../models/Task");
const Workspace  = require("../models/workspace");
const { logActivity } = require("../utils/activityLogger");
const { getIO }       = require("../socket");

/* ── Signature verification helper ─────────────────────────── */
function verifySignature(rawBody, sigHeader) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[Webhook] GITHUB_WEBHOOK_SECRET not set — skipping verification");
    return true;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const received = (sigHeader || "").replace(/^sha256=/, "");
  if (!received) return false;

  // Constant-time comparison
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(received, "hex")
    );
  } catch {
    return false;
  }
}

/* ── Route — raw body parsing is applied via router-level middleware */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig   = req.headers["x-hub-signature-256"];
    const event = req.headers["x-github-event"];
    const rawBody = req.body; // Buffer when using express.raw()

    // 1. Verify signature
    if (!verifySignature(rawBody, sig)) {
      console.warn("[Webhook] Signature mismatch — rejecting request");
      return res.status(401).json({ message: "Signature verification failed" });
    }

    // Parse the body (raw buffer → object)
    let payload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).json({ message: "Invalid JSON payload" });
    }

    /* ── Handle push events ─────────────────────────────────── */
    if (event === "push") {
      try {
        const branchName = (payload.ref || "").replace("refs/heads/", "");
        const commits    = payload.commits || [];

        if (!branchName || commits.length === 0) return res.sendStatus(200);

        // Find the task associated with this branch
        const task = await Task.findOne({ "github.branch": branchName });
        if (!task) return res.sendStatus(200);

        // Find the workspace for Socket.IO emission
        const board = await require("../models/Board").findById(task.board).populate("project");
        const workspaceId = board?.project?.workspace?.toString();

        // Map commits
        const newCommits = commits.map((c) => ({
          sha:       c.id,
          shortSha:  c.id?.slice(0, 7),
          message:   c.message,
          author: {
            name:      c.author?.name,
            avatarUrl: c.author?.username
              ? `https://github.com/${c.author.username}.png`
              : null,
          },
          url:         c.url,
          committedAt: c.timestamp ? new Date(c.timestamp) : new Date(),
        }));

        // Prepend & cap at 20
        const allCommits = [...newCommits, ...(task.github?.commits || [])].slice(0, 20);
        task.github.commits = allCommits;
        await task.save();

        // Socket.IO
        if (workspaceId) {
          try {
            getIO().to(`ws:${workspaceId}`).emit("github:sync", {
              taskId:  task._id.toString(),
              github:  task.github,
            });
          } catch {}

          await logActivity(
            workspaceId,
            null,
            "github_commit_pushed",
            { commitCount: newCommits.length, branch: branchName },
            { entityType: "task", entityId: task._id }
          );
        }
      } catch (err) {
        console.error("[Webhook] push handler error:", err.message);
      }
    }

    /* ── Handle pull_request events ─────────────────────────── */
    if (event === "pull_request") {
      try {
        const { action, pull_request: pr } = payload;
        const handledActions = ["opened", "closed", "reopened", "synchronize"];
        if (!handledActions.includes(action)) return res.sendStatus(200);

        const headBranch = pr.head?.ref;
        if (!headBranch) return res.sendStatus(200);

        const task = await Task.findOne({ "github.branch": headBranch });
        if (!task) return res.sendStatus(200);

        const board = await require("../models/Board").findById(task.board).populate("project");
        const workspaceId = board?.project?.workspace?.toString();

        let state = pr.state; // "open" | "closed"
        if (action === "closed" && pr.merged) state = "merged";

        task.github.pr = {
          number:   pr.number,
          title:    pr.title,
          url:      pr.html_url,
          state,
          openedAt: task.github.pr?.openedAt || new Date(pr.created_at),
        };
        await task.save();

        if (workspaceId) {
          try {
            getIO().to(`ws:${workspaceId}`).emit("github:sync", {
              taskId: task._id.toString(),
              github: task.github,
            });
          } catch {}
        }
      } catch (err) {
        console.error("[Webhook] pull_request handler error:", err.message);
      }
    }

    res.sendStatus(200);
  }
);

module.exports = router;
