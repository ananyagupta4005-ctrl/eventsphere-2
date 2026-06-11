const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      unique: true,
      default: () => `CERT-ES-${new Date().getFullYear()}-${uuidv4().slice(0, 6).toUpperCase()}`,
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
    },
    type: {
      type: String,
      enum: ["Participation", "Winner", "Runner Up", "Volunteer", "Speaker", "Organizer"],
      required: true,
    },
    // Only organizer/admin can generate
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Participant's details at time of generation (snapshot)
    recipientName: { type: String, required: true },
    eventName: { type: String, required: true },
    eventDate: { type: String },
    collegeName: { type: String },
    // Certificate file
    certificateUrl: { type: String },
    qrCode: { type: String },
    // Verification
    isValid: { type: Boolean, default: true },
    verificationUrl: { type: String },
    // Download tracking
    downloadCount: { type: Number, default: 0 },
    lastDownloadedAt: { type: Date },
  },
  { timestamps: true }
);

// One certificate per participant per event per type
certificateSchema.index({ event: 1, participant: 1, type: 1 }, { unique: true });

module.exports = mongoose.model("Certificate", certificateSchema);
