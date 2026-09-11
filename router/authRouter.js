const express = require("express");
const { sendOtp, verifyOtp, createAuth, refreshToken, logout, googleAuth, protect, completeOnboarding } = require("../controller/authController");
const authLimiter = require("../utils/rateLimits");

const router = express.Router();


router.post("/send-otp", authLimiter, sendOtp);
router.post("/verify-otp", authLimiter, verifyOtp, createAuth);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/google/callback", authLimiter, googleAuth);
router.post("/complete-onboarding", protect, completeOnboarding);


module.exports = router;
