const express = require("express");
const router = express.Router();
const {
  getProfile, updateProfile, getDashboardStats,
  getAllUsers, getUserById, updateUser, deleteUser, getAnalytics,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");
const { uploadProfile } = require("../config/cloudinary");

// Authenticated user
router.get("/profile", protect, getProfile);
router.put("/profile", protect, uploadProfile.single("profileImage"), updateProfile);
router.get("/dashboard-stats", protect, getDashboardStats);

// Admin only
router.get("/analytics", protect, authorize("admin"), getAnalytics);
router.get("/", protect, authorize("admin"), getAllUsers);
router.get("/:id", protect, authorize("admin"), getUserById);
router.put("/:id", protect, authorize("admin"), updateUser);
router.delete("/:id", protect, authorize("admin"), deleteUser);

module.exports = router;
