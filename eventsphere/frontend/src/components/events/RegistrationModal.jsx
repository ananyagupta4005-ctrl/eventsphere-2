import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, User, Mail, Phone, BookOpen, GraduationCap, Users, ArrowRight } from "lucide-react";
import { registrationAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#2A2A3A] text-sm text-[#F5F5F7] placeholder-[#8A8A9E] focus:border-[#7C5CFF]/60 focus:outline-none transition-colors";
const labelClass = "block text-xs text-[#8A8A9E] mb-1.5 font-mono uppercase tracking-wider";

const RegistrationModal = ({ event, onClose, onSuccess }) => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    collegeName: user?.college || "",
    course: user?.course || "",
    year: user?.year || "",
    gender: user?.gender || "",
    teamName: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required.";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "Valid email required.";
    if (!form.phone.match(/^\+?[6-9]\d{9}$/)) errs.phone = "Valid phone number required.";
    if (!form.collegeName.trim()) errs.collegeName = "College name is required.";
    if (!form.course.trim()) errs.course = "Course is required.";
    if (!form.year) errs.year = "Year is required.";
    if (!form.gender) errs.gender = "Gender is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to register for events.");
      return;
    }
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("eventId", event._id);
      Object.entries(form).forEach(([k, v]) => v && formData.append(k, v));
      if (resumeFile) formData.append("resume", resumeFile);

      const { data } = await registrationAPI.register(formData);
      toast.success("🎉 Registration successful!");
      onSuccess?.(data.data);
      onClose();
    } catch (err) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0A0A0F]/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#1F1F2E] bg-[#13131C] shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 bg-[#13131C] border-b border-[#1F1F2E] px-8 pt-8 pb-5 z-10">
            <button onClick={onClose} className="absolute top-5 right-5 text-[#8A8A9E] hover:text-[#F5F5F7]">
              <X size={18} />
            </button>
            <div
              className="h-1 w-full rounded-full mb-5"
              style={{ background: `linear-gradient(90deg, ${event.color || "#7C5CFF"}, transparent)` }}
            />
            <h2 className="font-display text-2xl text-[#F5F5F7]">Register for Event</h2>
            <p className="text-sm text-[#8A8A9E] mt-1">{event.name}</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            {/* Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name *</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A9E]" />
                  <input
                    className={`${inputClass} pl-9 ${errors.fullName ? "border-[#FF6B5B]" : ""}`}
                    placeholder="Your full name"
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                  />
                </div>
                {errors.fullName && <p className="text-xs text-[#FF6B5B] mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className={labelClass}>Email *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A9E]" />
                  <input
                    type="email"
                    className={`${inputClass} pl-9 ${errors.email ? "border-[#FF6B5B]" : ""}`}
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
                {errors.email && <p className="text-xs text-[#FF6B5B] mt-1">{errors.email}</p>}
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Phone Number *</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A9E]" />
                  <input
                    className={`${inputClass} pl-9 ${errors.phone ? "border-[#FF6B5B]" : ""}`}
                    placeholder="+91 9876543210"
                    value={form.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
                {errors.phone && <p className="text-xs text-[#FF6B5B] mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className={labelClass}>College Name *</label>
                <div className="relative">
                  <BookOpen size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A9E]" />
                  <input
                    className={`${inputClass} pl-9 ${errors.collegeName ? "border-[#FF6B5B]" : ""}`}
                    placeholder="Your college name"
                    value={form.collegeName}
                    onChange={(e) => handleChange("collegeName", e.target.value)}
                  />
                </div>
                {errors.collegeName && <p className="text-xs text-[#FF6B5B] mt-1">{errors.collegeName}</p>}
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Course *</label>
                <div className="relative">
                  <GraduationCap size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A9E]" />
                  <input
                    className={`${inputClass} pl-9 ${errors.course ? "border-[#FF6B5B]" : ""}`}
                    placeholder="B.Tech, MBA..."
                    value={form.course}
                    onChange={(e) => handleChange("course", e.target.value)}
                  />
                </div>
                {errors.course && <p className="text-xs text-[#FF6B5B] mt-1">{errors.course}</p>}
              </div>

              <div>
                <label className={labelClass}>Year *</label>
                <select
                  className={`${inputClass} ${errors.year ? "border-[#FF6B5B]" : ""}`}
                  value={form.year}
                  onChange={(e) => handleChange("year", e.target.value)}
                >
                  <option value="">Select Year</option>
                  {["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Alumni"].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {errors.year && <p className="text-xs text-[#FF6B5B] mt-1">{errors.year}</p>}
              </div>

              <div>
                <label className={labelClass}>Gender *</label>
                <select
                  className={`${inputClass} ${errors.gender ? "border-[#FF6B5B]" : ""}`}
                  value={form.gender}
                  onChange={(e) => handleChange("gender", e.target.value)}
                >
                  <option value="">Select Gender</option>
                  {["Male", "Female", "Other", "Prefer not to say"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                {errors.gender && <p className="text-xs text-[#FF6B5B] mt-1">{errors.gender}</p>}
              </div>
            </div>

            {/* Optional fields */}
            {event.teamEvent && (
              <div>
                <label className={labelClass}>
                  <Users size={12} className="inline mr-1" />Team Name (Optional)
                </label>
                <input
                  className={inputClass}
                  placeholder="Your team name"
                  value={form.teamName}
                  onChange={(e) => handleChange("teamName", e.target.value)}
                />
              </div>
            )}

            <div>
              <label className={labelClass}>
                <Upload size={12} className="inline mr-1" />Resume (Optional — PDF only)
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  id="resume-upload"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />
                <label
                  htmlFor="resume-upload"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0A0A0F] border border-dashed border-[#2A2A3A] text-sm text-[#8A8A9E] cursor-pointer hover:border-[#7C5CFF]/60 transition-colors"
                >
                  <Upload size={16} className="text-[#7C5CFF]" />
                  {resumeFile ? (
                    <span className="text-[#F5F5F7]">{resumeFile.name}</span>
                  ) : (
                    <span>Click to upload your resume</span>
                  )}
                </label>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-semibold text-[#0A0A0F] overflow-hidden disabled:opacity-70"
                style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[#0A0A0F] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Complete Registration <ArrowRight size={16} /></>
                  )}
                </span>
                {!loading && (
                  <span className="absolute inset-0 bg-gradient-to-r from-[#FF6B5B] to-[#7C5CFF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </button>
            </div>

            <p className="text-xs text-center text-[#8A8A9E]">
              By registering, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RegistrationModal;
