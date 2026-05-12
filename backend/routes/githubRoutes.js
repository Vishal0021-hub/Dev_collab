const express  = require("express");
const router   = express.Router();
const { protect } = require("../middleware/authmiddleware");
const { isOwner } = require("../middleware/roleMiddleware");
const ctrl = require("../controllers/githubController");

/* ── OAuth ──────────────────────────────────────────────────── */
router.get("/oauth/url",        protect, ctrl.getOAuthUrl);
router.get("/oauth/callback",           ctrl.oauthCallback);     // public — GitHub redirects here
router.delete("/oauth/disconnect", protect, ctrl.disconnectGitHub);

/* ── User repos ─────────────────────────────────────────────── */
router.get("/repos", protect, ctrl.listRepos);
router.get("/me",    protect, ctrl.getGitHubProfile);

/* ── Workspace repo link / unlink ───────────────────────────── */
router.patch("/workspaces/:workspaceId/github/link",   protect, isOwner, ctrl.linkRepo);
router.delete("/workspaces/:workspaceId/github/unlink", protect, isOwner, ctrl.unlinkRepo);

module.exports = router;
