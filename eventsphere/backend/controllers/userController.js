const User = require("../models/User");
const Registration = require("../models/Registration");
const Certificate = require("../models/Certificate");

// @route  GET /api/users/profile
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ["name", "phone", "college", "course", "year", "gender", "bio", "socialLinks", "organization"];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.file) updates.profileImage = req.file.path;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true, runValidators: true,
    });

    res.json({ success: true, data: user, message: "Profile updated." });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/users/dashboard-stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    if (req.user.role === "participant") {
      const [registrations, certificates, upcoming] = await Promise.all([
        Registration.countDocuments({ participant: userId }),
        Certificate.countDocuments({ participant: userId }),
        Registration.find({ participant: userId, attended: false })
          .populate("event", "name startDate venue type bannerImage status")
          .sort({ "event.startDate": 1 })
          .limit(5),
      ]);

      return res.json({
        success: true,
        data: { registrations, certificates, upcomingEvents: upcoming },
      });
    }

    if (req.user.role === "organizer") {
      const Event = require("../models/Event");
      const [events, totalRegs, totalAttended, certsGenerated] = await Promise.all([
        Event.countDocuments({ organizer: userId }),
        Registration.countDocuments({ event: { $in: await Event.find({ organizer: userId }).distinct("_id") } }),
        Registration.countDocuments({
          event: { $in: await Event.find({ organizer: userId }).distinct("_id") },
          attended: true,
        }),
        Certificate.countDocuments({
          generatedBy: userId,
        }),
      ]);

      return res.json({
        success: true,
        data: { events, totalRegistrations: totalRegs, totalAttended, certificatesGenerated: certsGenerated },
      });
    }

    // Admin stats
    const [users, events, registrations, certificates] = await Promise.all([
      User.countDocuments(),
      require("../models/Event").countDocuments(),
      Registration.countDocuments(),
      Certificate.countDocuments(),
    ]);

    res.json({ success: true, data: { users, events, registrations, certificates } });
  } catch (error) {
    next(error);
  }
};

// ========== ADMIN ROUTES ==========

// @route  GET /api/users  (admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total },
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/users/:id  (admin)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/users/:id  (admin)
exports.updateUser = async (req, res, next) => {
  try {
    const allowedFields = ["name", "email", "role", "isActive", "college", "phone"];
    const updates = {};
    allowedFields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    res.json({ success: true, data: user, message: "User updated." });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/users/:id  (admin)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Prevent deleting own account
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account." });
    }

    await user.deleteOne();
    res.json({ success: true, message: "User deleted." });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/users/analytics (admin)
exports.getAnalytics = async (req, res, next) => {
  try {
    const Event = require("../models/Event");

    const [
      usersByRole,
      usersByMonth,
      eventsByType,
      regsByMonth,
    ] = await Promise.all([
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
      User.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
      Event.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      Registration.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
    ]);

    res.json({
      success: true,
      data: { usersByRole, usersByMonth, eventsByType, regsByMonth },
    });
  } catch (error) {
    next(error);
  }
};
