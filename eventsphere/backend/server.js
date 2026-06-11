require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const passport = require("passport");

const connectDB = require("./config/db");
require("./config/passport"); // Initialize passport strategies

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const registrationRoutes = require("./routes/registrationRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [process.env.FRONTEND_URL || "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Passport
app.use(passport.initialize());

// Global rate limit
app.use("/api", apiLimiter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "EventSphere API",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// Global error handler
app.use(errorHandler);

// Admin seed (run once)
const seedAdmin = async () => {
  const User = require("./models/User");
  const bcrypt = require("bcryptjs");
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPass) return;

  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    await User.create({
      name: "EventSphere Admin",
      email: adminEmail,
      password: adminPass,
      role: "admin",
      isEmailVerified: true,
      authProvider: "local",
    });
    console.log("✅ Admin user seeded:", adminEmail);
  }
};

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 EventSphere API running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
  await seedAdmin();
});

module.exports = app;
