const express=require('express')
const router = express.Router();

const {registerUser} = require("../controllers/authController.js");
const {loginUser} = require("../controllers/authController.js");

router.post("/register",registerUser);
router.post("/login",loginUser)

module.exports = router;