const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OTP = require("../models/OTP");
const { sendEmail } = require("../utils/email");

// Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id, user.role);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      isEmailVerified: user.isEmailVerified,
    },
  });
};

// @route  POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, college } = req.body;

    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: "Email already registered." });
    }

    const validRoles = ["participant", "organizer"];
    const assignedRole = validRoles.includes(role) ? role : "participant";

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: assignedRole,
      college,
      authProvider: "local",
    });

    // Send verification email (non-blocking)
    const verifyToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto.createHash("sha256").update(verifyToken).digest("hex");
    user.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
    sendEmail({
      to: email,
      subject: "Verify your EventSphere account",
      html: `<p>Hi ${name},</p><p>Click <a href="${verifyUrl}">here</a> to verify your email. This link expires in 24 hours.</p>`,
    }).catch(console.error);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Please provide email and password." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account deactivated. Contact support." });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @route  GET /api/auth/google — handled by passport, final callback:
exports.googleCallback = async (req, res) => {
  try {
    const token = generateToken(req.user._id, req.user.role);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&role=${req.user.role}`);
  } catch (error) {
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?error=google_auth_failed`);
  }
};

// @route  POST /api/auth/send-otp
exports.sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone number required." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await OTP.findOneAndDelete({ phone });
    await OTP.create({ phone, otp, expiresAt });

    // In production, send via Twilio
    // await twilioClient.messages.create({ body: `Your EventSphere OTP is ${otp}`, from: process.env.TWILIO_PHONE_NUMBER, to: phone });

    // Dev: return OTP in response (remove in production)
    const responseData = { success: true, message: "OTP sent successfully." };
    if (process.env.NODE_ENV === "development") {
      responseData.devOtp = otp;
    }

    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/verify-otp
exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp, name, role } = req.body;

    const record = await OTP.findOne({ phone, otp, verified: false });
    if (!record) {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }
    if (new Date() > record.expiresAt) {
      await record.deleteOne();
      return res.status(400).json({ success: false, message: "OTP has expired." });
    }

    record.verified = true;
    await record.save();

    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        name: name || `User${phone.slice(-4)}`,
        phone,
        role: role || "participant",
        authProvider: "phone",
        isPhoneVerified: true,
        email: `${phone}@phone.eventsphere.io`,
      });
    } else {
      user.isPhoneVerified = true;
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ success: true, message: "If this email exists, a reset link has been sent." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpiry = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendEmail({
      to: email,
      subject: "EventSphere Password Reset",
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Valid for 1 hour.</p>`,
    });

    res.json({ success: true, message: "Password reset link sent to your email." });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset token." });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/verify-email/:token
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification link." });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    res.json({ success: true, message: "Email verified successfully!" });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("+password");
    const { currentPassword, newPassword } = req.body;

    if (user.password && !(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};
