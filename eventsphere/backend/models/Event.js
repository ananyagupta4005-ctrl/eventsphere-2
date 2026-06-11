const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    type: {
      type: String,
      required: true,
      enum: [
        "Hackathon",
        "Workshop",
        "Tech Fest",
        "Cultural Fest",
        "Sports Event",
        "Seminar",
        "Startup Competition",
        "Coding Challenge",
        "Webinar",
        "Conference",
        "Music Event",
        "Photography Contest",
        "Other",
      ],
    },
    category: {
      type: String,
      enum: [
        "Hackathons",
        "Workshops",
        "Tech Fests",
        "Cultural Events",
        "Sports Events",
        "Seminars",
        "Startup Competitions",
        "Coding Challenges",
        "Webinars",
        "Conferences",
      ],
    },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 200 },
    bannerImage: { type: String },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    college: { type: String },
    venue: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },
    seatsAvailable: { type: Number, required: true, min: 1 },
    seatsBooked: { type: Number, default: 0 },
    prizePool: { type: String },
    entryFee: { type: Number, default: 0 },
    certificateAvailable: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed"],
      default: "draft",
    },
    tags: [{ type: String }],
    teamEvent: { type: Boolean, default: false },
    minTeamSize: { type: Number, default: 1 },
    maxTeamSize: { type: Number, default: 1 },
    eligibility: { type: String },
    schedule: [
      {
        time: String,
        activity: String,
      },
    ],
    judges: [
      {
        name: String,
        designation: String,
        image: String,
      },
    ],
    sponsors: [
      {
        name: String,
        logo: String,
        tier: String,
      },
    ],
    socialLinks: {
      website: String,
      instagram: String,
      linkedin: String,
    },
    views: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Auto-generate slug
eventSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .concat("-", Date.now().toString().slice(-5));
  }
  next();
});

// Virtual: seats left
eventSchema.virtual("seatsLeft").get(function () {
  return Math.max(0, this.seatsAvailable - this.seatsBooked);
});

// Virtual: registration open
eventSchema.virtual("isRegistrationOpen").get(function () {
  return (
    this.status === "published" &&
    new Date() < this.registrationDeadline &&
    this.seatsLeft > 0
  );
});

eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Event", eventSchema);
