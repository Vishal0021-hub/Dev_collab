const express = require("express");
const router = express.Router();

const { createWorkspace, getWorkspaces, inviteToWorkspace, joinWorkspace, getWorkspaceMembers, changeRole } = require("../controllers/workspaceController");
const { protect } = require("../middleware/authmiddleware");
const { authorize, isAdmin, isOwner } = require("../middleware/roleMiddleware");

router.post("/", protect, createWorkspace);
router.get("/", protect, getWorkspaces);

// get members - Any member can view
router.get("/:workspaceId/members", protect, authorize(["owner", "admin", "member"]), getWorkspaceMembers);

// invite - Only Owner and Admin
router.post("/:workspaceId/invite", protect, isAdmin, inviteToWorkspace);

// join workspace via invite token
router.post("/join/:token", protect, joinWorkspace);

router.put(
  "/:workspaceId/role/:userId",
  protect,
  isOwner,
  changeRole,
);
module.exports = router;