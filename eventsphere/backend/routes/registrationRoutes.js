const express = require("express");
const router = express.Router();
const {
  registerForEvent, getMyRegistrations, getEventRegistrations,
  getRegistration, cancelRegistration, markAttendance, getAllRegistrations,
} = require("../controllers/registrationController");
const { protect, authorize } = require("../middleware/auth");
const { uploadResume } = require("../config/cloudinary");

// Participant
router.post("/", protect, uploadResume.single("resume"), registerForEvent);
router.get("/my", protect, getMyRegistrations);
router.put("/:id/cancel", protect, cancelRegistration);

// Organizer/Admin
router.get("/event/:eventId", protect, authorize("organizer", "admin"), getEventRegistrations);
router.put("/:id/attendance", protect, authorize("organizer", "admin"), markAttendance);

// Admin only
router.get("/all", protect, authorize("admin"), getAllRegistrations);

// Any authenticated user (with permission check in controller)
router.get("/:id", protect, getRegistration);

module.exports = router;
