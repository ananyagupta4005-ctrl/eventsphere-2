const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const registrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      unique: true,
      default: () => `REG-${uuidv4().slice(0, 8).toUpperCase()}`,
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
    // Form fields
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    collegeName: { type: String, required: true },
    course: { type: String, required: true },
    year: { type: String, required: true },
    gender: { type: String, required: true },
    teamName: { type: String },
    resumeUrl: { type: String },
    // Status
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "waitlisted"],
      default: "confirmed",
    },
    paymentStatus: {
      type: String,
      enum: ["free", "pending", "paid", "refunded"],
      default: "free",
    },
    paymentId: { type: String },
    // Attendance
    attended: { type: Boolean, default: false },
    attendanceMarkedAt: { type: Date },
    attendanceMarkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // QR code for check-in
    qrCode: { type: String },
    // Certificate
    certificateGenerated: { type: Boolean, default: false },
    certificate: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate" },
  },
  { timestamps: true }
);

// Prevent duplicate registration
registrationSchema.index({ event: 1, participant: 1 }, { unique: true });

module.exports = mongoose.model("Registration", registrationSchema);
