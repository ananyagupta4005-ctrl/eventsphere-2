const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const {
  register, login, getMe, googleCallback,
  sendOTP, verifyOTP, forgotPassword, resetPassword,
  verifyEmail, changePassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiter");

// Email/Password
router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

// Email verification
router.post("/verify-email/:token", verifyEmail);

// Password reset
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", authLimiter, resetPassword);

// Google OAuth
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_failed`, session: false }),
  googleCallback
);

// Phone OTP
router.post("/send-otp", otpLimiter, sendOTP);
router.post("/verify-otp", authLimiter, verifyOTP);

module.exports = router;
