const Event = require("../models/Event");
const Registration = require("../models/Registration");

// @route  GET /api/events
exports.getEvents = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, category, type, status, search,
      sortBy = "createdAt", order = "desc", featured,
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (status) filter.status = status;
    else filter.status = "published"; // default to published only
    if (featured) filter.featured = featured === "true";
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { college: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "desc" ? -1 : 1;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate("organizer", "name email profileImage college")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: events,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/events/:id
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate(
      "organizer",
      "name email profileImage college bio"
    );

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    // Increment views
    await Event.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/events
exports.createEvent = async (req, res, next) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user.id,
      college: req.user.college,
    };

    if (req.file) {
      eventData.bannerImage = req.file.path;
    }

    const event = await Event.create(eventData);
    await event.populate("organizer", "name email profileImage");

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/events/:id
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    // Only organizer who created or admin can update
    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to update this event." });
    }

    if (req.file) {
      req.body.bannerImage = req.file.path;
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("organizer", "name email profileImage");

    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/events/:id
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized to delete this event." });
    }

    await event.deleteOne();
    res.json({ success: true, message: "Event deleted successfully." });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/events/:id/publish
exports.publishEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    event.status = event.status === "published" ? "draft" : "published";
    await event.save();

    res.json({ success: true, data: event, message: `Event ${event.status}.` });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/events/organizer/my-events
exports.getMyEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organizer: req.user.id })
      .sort({ createdAt: -1 });

    // Get registration counts for each event
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const registrationCount = await Registration.countDocuments({ event: event._id });
        const attendedCount = await Registration.countDocuments({ event: event._id, attended: true });
        return {
          ...event.toJSON(),
          registrationCount,
          attendedCount,
        };
      })
    );

    res.json({ success: true, data: eventsWithStats });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/events/category/:category
exports.getEventsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { page = 1, limit = 12 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
      Event.find({ category, status: "published" })
        .populate("organizer", "name profileImage college")
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Event.countDocuments({ category, status: "published" }),
    ]);

    res.json({
      success: true,
      data: events,
      category,
      pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total },
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/events/stats/overview (admin)
exports.getEventStats = async (req, res, next) => {
  try {
    const [total, published, draft, cancelled, totalRegs] = await Promise.all([
      Event.countDocuments(),
      Event.countDocuments({ status: "published" }),
      Event.countDocuments({ status: "draft" }),
      Event.countDocuments({ status: "cancelled" }),
      Registration.countDocuments(),
    ]);

    const byCategory = await Event.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: { total, published, draft, cancelled, totalRegistrations: totalRegs, byCategory },
    });
  } catch (error) {
    next(error);
  }
};
