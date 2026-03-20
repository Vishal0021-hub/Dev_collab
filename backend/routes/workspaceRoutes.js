const express = require("express");
const router = express.Router();

const { createWorkspace, getWorkspaces } = require("../controllers/workspaceController");
const { protect } = require("../middelware/authmiddleware")

router.post("/", protect, createWorkspace);
router.get("/", protect, getWorkspaces);

module.exports = router;