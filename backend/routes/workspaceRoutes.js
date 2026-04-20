const express = require("express");
const router = express.Router();

const {
  createWorkspace,
  getWorkspaces,
  inviteToWorkspace,
  joinWorkspace,
  getWorkspaceMembers,
  changeRole,
  getDashboard
} = require("../controllers/workspaceController");
const { protect } = require("../middleware/authmiddleware");
const { authorize, isAdmin, isOwner, isMember } = require("../middleware/roleMiddleware");
const { inviteLimiter } = require("../middleware/securityMiddleware");

router.post("/", protect, createWorkspace);
router.get("/", protect, getWorkspaces);

// get members - Any member can view
router.get("/:workspaceId/members", protect, authorize(["owner", "admin", "member"]), getWorkspaceMembers);

// invite - Only Owner and Admin, rate limited (10 req / 15 min)
router.post("/:workspaceId/invite", protect, isAdmin, inviteLimiter, inviteToWorkspace);

// join workspace via invite token
router.post("/join/:token", protect, joinWorkspace);

// change member role - Only Owner
router.put("/:workspaceId/role/:userId", protect, isOwner, changeRole);

// dashboard — any member
router.get("/:workspaceId/dashboard", protect, isMember, getDashboard);

module.exports = router;