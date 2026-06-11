const Registration = require("../models/Registration");
const Event = require("../models/Event");
const { sendEmail } = require("../utils/email");
const QRCode = require("qrcode");

// @route  POST /api/registrations
exports.registerForEvent = async (req, res, next) => {
  try {
    const {
      eventId, fullName, email, phone, collegeName,
      course, year, gender, teamName,
    } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    if (event.status !== "published") {
      return res.status(400).json({ success: false, message: "Event is not accepting registrations." });
    }

    if (new Date() > event.registrationDeadline) {
      return res.status(400).json({ success: false, message: "Registration deadline has passed." });
    }

    if (event.seatsLeft <= 0) {
      return res.status(400).json({ success: false, message: "No seats available." });
    }

    // Check duplicate
    const existing = await Registration.findOne({ event: eventId, participant: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: "You are already registered for this event." });
    }

    // Build registration
    const regData = {
      event: eventId,
      participant: req.user.id,
      fullName,
      email,
      phone,
      collegeName,
      course,
      year,
      gender,
      teamName,
    };

    if (req.file) {
      regData.resumeUrl = req.file.path;
    }

    const registration = await Registration.create(regData);

    // Generate QR code for check-in
    const qrData = JSON.stringify({
      registrationId: registration.registrationId,
      eventId,
      participantId: req.user.id,
    });
    const qrCode = await QRCode.toDataURL(qrData);
    registration.qrCode = qrCode;
    await registration.save();

    // Update seat count
    await Event.findByIdAndUpdate(eventId, { $inc: { seatsBooked: 1 } });

    // Send confirmation email (non-blocking)
    sendEmail({
      to: email,
      subject: `✅ Registration Confirmed — ${event.name}`,
      html: `
        <h2>You're registered for ${event.name}!</h2>
        <p>Registration ID: <strong>${registration.registrationId}</strong></p>
        <p>Event Date: ${new Date(event.startDate).toDateString()}</p>
        <p>Venue: ${event.venue}</p>
        <p>Keep this ID handy for check-in.</p>
      `,
    }).catch(console.error);

    await registration.populate([
      { path: "event", select: "name startDate venue bannerImage" },
      { path: "participant", select: "name email" },
    ]);

    res.status(201).json({ success: true, data: registration, message: "Registration successful!" });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/registrations/my
exports.getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ participant: req.user.id })
      .populate("event", "name startDate endDate venue bannerImage status type college")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: registrations });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/registrations/event/:eventId  (organizer/admin)
exports.getEventRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    const registrations = await Registration.find({ event: req.params.eventId })
      .populate("participant", "name email profileImage")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: registrations, total: registrations.length });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/registrations/:id
exports.getRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate("event", "name startDate endDate venue bannerImage organizer")
      .populate("participant", "name email profileImage");

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found." });
    }

    // Only participant themselves, the event organizer, or admin can view
    const isParticipant = registration.participant._id.toString() === req.user.id;
    const isOrganizer =
      registration.event.organizer &&
      registration.event.organizer.toString() === req.user.id;

    if (!isParticipant && !isOrganizer && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    res.json({ success: true, data: registration });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/registrations/:id/cancel
exports.cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found." });
    }

    if (registration.participant.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    if (registration.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Already cancelled." });
    }

    registration.status = "cancelled";
    await registration.save();

    // Free up the seat
    await Event.findByIdAndUpdate(registration.event, { $inc: { seatsBooked: -1 } });

    res.json({ success: true, message: "Registration cancelled." });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/registrations/:id/attendance  (organizer/admin)
exports.markAttendance = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id).populate("event");

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found." });
    }

    if (
      registration.event.organizer.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    registration.attended = req.body.attended !== undefined ? req.body.attended : true;
    registration.attendanceMarkedAt = new Date();
    registration.attendanceMarkedBy = req.user.id;
    await registration.save();

    res.json({ success: true, data: registration, message: "Attendance updated." });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/registrations/all (admin)
exports.getAllRegistrations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [registrations, total] = await Promise.all([
      Registration.find()
        .populate("event", "name type")
        .populate("participant", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Registration.countDocuments(),
    ]);

    res.json({
      success: true,
      data: registrations,
      pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total },
    });
  } catch (error) {
    next(error);
  }
};
