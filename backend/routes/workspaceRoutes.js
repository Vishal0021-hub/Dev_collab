const express = require("express");
const router = express.Router();

const { createWorkspace, getWorkspaces ,inviteToWorkspace} = require("../controllers/workspaceController");
const { protect } = require("../middelware/authmiddleware")


router.post("/", protect, createWorkspace);
router.get("/", protect, getWorkspaces);
router.post("/:workspaceId/invite",protect,inviteToWorkspace);

module.exports = router;