const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/authmiddleware");
const { globalSearch } = require("../controllers/searchController");

// GET /api/search?q=hello&workspaceId=xxx&type=tasks
router.get("/", protect, globalSearch);

module.exports = router;
