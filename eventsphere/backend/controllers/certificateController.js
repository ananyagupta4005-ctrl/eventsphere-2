const Certificate = require("../models/Certificate");
const Registration = require("../models/Registration");
const Event = require("../models/Event");
const QRCode = require("qrcode");
const PDFDocument = require("pdfkit");
const { cloudinary } = require("../config/cloudinary");

// @route  POST /api/certificates/generate  (organizer/admin only)
exports.generateCertificate = async (req, res, next) => {
  try {
    const { registrationId, type } = req.body;

    const registration = await Registration.findById(registrationId)
      .populate("event")
      .populate("participant", "name email college");

    if (!registration) {
      return res.status(404).json({ success: false, message: "Registration not found." });
    }

    // Verify authorization
    const isOrganizer =
      registration.event.organizer.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only organizers and admins can generate certificates.",
      });
    }

    // Check if certificate already exists
    const existing = await Certificate.findOne({
      event: registration.event._id,
      participant: registration.participant._id,
      type,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Certificate already generated for this participant and type.",
        data: existing,
      });
    }

    // Generate certificate ID
    const certId = `CERT-ES-${new Date().getFullYear()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;

    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${certId}`;

    // Generate QR code
    const qrCode = await QRCode.toDataURL(verificationUrl);

    // Create certificate record
    const certificate = await Certificate.create({
      certificateId: certId,
      event: registration.event._id,
      participant: registration.participant._id,
      registration: registration._id,
      type,
      generatedBy: req.user.id,
      recipientName: registration.fullName,
      eventName: registration.event.name,
      eventDate: new Date(registration.event.startDate).toDateString(),
      collegeName: registration.collegeName,
      qrCode,
      verificationUrl,
    });

    // Mark registration as certificate generated
    registration.certificateGenerated = true;
    registration.certificate = certificate._id;
    await registration.save();

    await certificate.populate([
      { path: "event", select: "name startDate" },
      { path: "participant", select: "name email" },
      { path: "generatedBy", select: "name" },
    ]);

    res.status(201).json({ success: true, data: certificate, message: "Certificate generated!" });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/certificates/my (participant)
exports.getMyCertificates = async (req, res, next) => {
  try {
    const certificates = await Certificate.find({
      participant: req.user.id,
      isValid: true,
    })
      .populate("event", "name startDate type bannerImage")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: certificates });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/certificates/event/:eventId (organizer/admin)
exports.getEventCertificates = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    if (event.organizer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized." });
    }

    const certificates = await Certificate.find({ event: req.params.eventId })
      .populate("participant", "name email profileImage")
      .populate("generatedBy", "name")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: certificates });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/certificates/:id/download (participant - only their own)
exports.downloadCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate("event", "name startDate venue")
      .populate("participant", "name");

    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found." });
    }

    // Participants can only download their own
    if (
      certificate.participant._id.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "organizer"
    ) {
      return res.status(403).json({ success: false, message: "Not authorized to download this certificate." });
    }

    // Generate PDF certificate
    const doc = new PDFDocument({ layout: "landscape", size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="EventSphere_${certificate.certificateId}.pdf"`
    );

    doc.pipe(res);

    // Certificate design
    const colors = {
      Participation: "#7C5CFF",
      Winner: "#FFD700",
      "Runner Up": "#2DD4BF",
      Volunteer: "#7C5CFF",
      Speaker: "#FF6B5B",
      Organizer: "#2DD4BF",
    };
    const accentColor = colors[certificate.type] || "#7C5CFF";

    // Background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0A0A0F");
    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke(accentColor);

    // Header
    doc.fontSize(28).fillColor(accentColor).text("EventSphere", 0, 60, { align: "center" });
    doc.fontSize(14).fillColor("#8A8A9E").text("Certificate of Achievement", 0, 96, { align: "center" });
    doc.moveDown();

    // Type
    doc.fontSize(22).fillColor(accentColor).text(`Certificate of ${certificate.type}`, 0, 130, { align: "center" });

    // Recipient
    doc.fontSize(14).fillColor("#F5F5F7").text("This is to certify that", 0, 180, { align: "center" });
    doc.fontSize(32).fillColor("#FFFFFF").text(certificate.recipientName, 0, 200, { align: "center" });
    if (certificate.collegeName) {
      doc.fontSize(12).fillColor("#8A8A9E").text(`from ${certificate.collegeName}`, 0, 240, { align: "center" });
    }

    doc.fontSize(14).fillColor("#F5F5F7").text(
      `has successfully participated in`,
      0, 270, { align: "center" }
    );
    doc.fontSize(20).fillColor(accentColor).text(certificate.eventName, 0, 292, { align: "center" });
    doc.fontSize(12).fillColor("#8A8A9E").text(`held on ${certificate.eventDate}`, 0, 320, { align: "center" });

    // Certificate ID
    doc.fontSize(9).fillColor("#8A8A9E")
      .text(`Certificate ID: ${certificate.certificateId}`, 60, doc.page.height - 70)
      .text(`Verification: ${certificate.verificationUrl}`, 60, doc.page.height - 55);

    doc.end();

    // Track download
    certificate.downloadCount += 1;
    certificate.lastDownloadedAt = new Date();
    await certificate.save();
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/certificates/verify/:certId (public)
exports.verifyCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({ certificateId: req.params.certId })
      .populate("event", "name startDate type")
      .populate("participant", "name");

    if (!certificate) {
      return res.json({ success: false, valid: false, message: "Certificate not found or invalid." });
    }

    res.json({
      success: true,
      valid: certificate.isValid,
      data: {
        certificateId: certificate.certificateId,
        recipientName: certificate.recipientName,
        type: certificate.type,
        eventName: certificate.eventName,
        eventDate: certificate.eventDate,
        issuedAt: certificate.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/certificates/:id/revoke (admin)
exports.revokeCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      { isValid: false },
      { new: true }
    );

    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found." });
    }

    res.json({ success: true, message: "Certificate revoked.", data: certificate });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/certificates/all (admin)
exports.getAllCertificates = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [certs, total] = await Promise.all([
      Certificate.find()
        .populate("event", "name")
        .populate("participant", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Certificate.countDocuments(),
    ]);

    res.json({
      success: true,
      data: certs,
      pagination: { current: parseInt(page), pages: Math.ceil(total / parseInt(limit)), total },
    });
  } catch (error) {
    next(error);
  }
};
