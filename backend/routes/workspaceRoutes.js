
const express = require("express");
const router = express.Router();

const { createWorkspace } = require("../controllers/workspaceController");
const { protect } = require("../middelware/authmiddleware")

router.post("/", protect, createWorkspace);

module.exports = router;