const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
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
      required: true,
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    markedAt: { type: Date, default: Date.now },
    checkInMethod: {
      type: String,
      enum: ["manual", "qr_scan", "bulk"],
      default: "manual",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

attendanceSchema.index({ event: 1, participant: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
