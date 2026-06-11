const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ["participant", "organizer", "admin"],
      default: "participant",
    },
    college: { type: String, trim: true },
    course: { type: String, trim: true },
    year: { type: String },
    gender: { type: String, enum: ["Male", "Female", "Other", "Prefer not to say"] },
    profileImage: { type: String, default: "" },
    googleId: { type: String },
    authProvider: {
      type: String,
      enum: ["local", "google", "phone"],
      default: "local",
    },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    emailVerificationToken: String,
    emailVerificationExpiry: Date,
    passwordResetToken: String,
    passwordResetExpiry: Date,
    phoneOtp: String,
    phoneOtpExpiry: Date,
    lastLogin: Date,
    // Organizer specific
    organization: { type: String },
    bio: { type: String, maxlength: 500 },
    socialLinks: {
      linkedin: String,
      twitter: String,
      github: String,
      website: String,
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  delete obj.phoneOtp;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
