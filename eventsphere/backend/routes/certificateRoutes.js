const express = require("express");
const router = express.Router();
const {
  generateCertificate, getMyCertificates, getEventCertificates,
  downloadCertificate, verifyCertificate, revokeCertificate, getAllCertificates,
} = require("../controllers/certificateController");
const { protect, authorize } = require("../middleware/auth");

// Public verification
router.get("/verify/:certId", verifyCertificate);

// Participant
router.get("/my", protect, getMyCertificates);
router.get("/:id/download", protect, downloadCertificate);

// Organizer/Admin generate
router.post("/generate", protect, authorize("organizer", "admin"), generateCertificate);
router.get("/event/:eventId", protect, authorize("organizer", "admin"), getEventCertificates);

// Admin
router.get("/all", protect, authorize("admin"), getAllCertificates);
router.put("/:id/revoke", protect, authorize("admin"), revokeCertificate);

module.exports = router;
