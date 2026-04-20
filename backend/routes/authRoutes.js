const express = require("express");
const router  = express.Router();

const { registerUser, loginUser } = require("../controllers/authController.js");
const { authLimiter } = require("../middleware/securityMiddleware");

// Apply strict rate limit to auth endpoints (10 req / 15 min per IP)
router.post("/register", authLimiter, registerUser);
router.post("/login",    authLimiter, loginUser);

module.exports = router;