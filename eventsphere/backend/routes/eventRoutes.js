const express = require("express");
const router = express.Router();
const {
  getEvents, getEvent, createEvent, updateEvent, deleteEvent,
  publishEvent, getMyEvents, getEventsByCategory, getEventStats,
} = require("../controllers/eventController");
const { protect, authorize, optionalAuth } = require("../middleware/auth");
const { uploadBanner } = require("../config/cloudinary");

// Public
router.get("/", optionalAuth, getEvents);
router.get("/category/:category", getEventsByCategory);

// Organizer/Admin
router.get("/organizer/my-events", protect, authorize("organizer", "admin"), getMyEvents);
router.get("/stats/overview", protect, authorize("admin"), getEventStats);

// Single event (public read)
router.get("/:id", optionalAuth, getEvent);

// Organizer creates
router.post("/", protect, authorize("organizer", "admin"), uploadBanner.single("bannerImage"), createEvent);

// Update/delete/publish (auth required)
router.put("/:id", protect, authorize("organizer", "admin"), uploadBanner.single("bannerImage"), updateEvent);
router.delete("/:id", protect, authorize("organizer", "admin"), deleteEvent);
router.put("/:id/publish", protect, authorize("organizer", "admin"), publishEvent);

module.exports = router;
