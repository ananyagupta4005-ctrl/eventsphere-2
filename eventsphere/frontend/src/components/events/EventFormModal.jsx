import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, ArrowRight } from "lucide-react";
import { eventsAPI } from "../../api";
import toast from "react-hot-toast";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#2A2A3A] text-sm text-[#F5F5F7] placeholder-[#8A8A9E] focus:border-[#7C5CFF]/60 focus:outline-none transition-colors";
const labelClass = "block text-xs text-[#8A8A9E] mb-1.5 font-mono uppercase tracking-wider";

const EVENT_TYPES = [
  "Hackathon","Workshop","Tech Fest","Cultural Fest","Sports Event",
  "Seminar","Startup Competition","Coding Challenge","Webinar","Conference",
  "Music Event","Photography Contest","Other",
];
const CATEGORIES = [
  "Hackathons","Workshops","Tech Fests","Cultural Events","Sports Events",
  "Seminars","Startup Competitions","Coding Challenges","Webinars","Conferences",
];

const toDatetimeLocal = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().slice(0, 16);
};

const EventFormModal = ({ event, onClose, onSuccess }) => {
  const isEdit = !!event;
  const [loading, setLoading] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(event?.bannerImage || "");
  const [form, setForm] = useState({
    name: event?.name || "",
    type: event?.type || "Hackathon",
    category: event?.category || "Hackathons",
    description: event?.description || "",
    shortDescription: event?.shortDescription || "",
    venue: event?.venue || "",
    startDate: toDatetimeLocal(event?.startDate),
    endDate: toDatetimeLocal(event?.endDate),
    registrationDeadline: toDatetimeLocal(event?.registrationDeadline),
    seatsAvailable: event?.seatsAvailable || "",
    prizePool: event?.prizePool || "",
    entryFee: event?.entryFee || 0,
    certificateAvailable: event?.certificateAvailable ?? true,
    teamEvent: event?.teamEvent || false,
    minTeamSize: event?.minTeamSize || 1,
    maxTeamSize: event?.maxTeamSize || 4,
    eligibility: event?.eligibility || "",
    status: event?.status || "draft",
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
  };

  const handleBanner = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Event name required.";
    if (!form.description.trim()) errs.description = "Description required.";
    if (!form.venue.trim()) errs.venue = "Venue required.";
    if (!form.startDate) errs.startDate = "Start date required.";
    if (!form.endDate) errs.endDate = "End date required.";
    if (!form.registrationDeadline) errs.registrationDeadline = "Deadline required.";
    if (!form.seatsAvailable || form.seatsAvailable < 1) errs.seatsAvailable = "Seats required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) fd.append(k, v);
      });
      if (bannerFile) fd.append("bannerImage", bannerFile);

      let res;
      if (isEdit) {
        res = await eventsAPI.update(event._id, fd);
      } else {
        res = await eventsAPI.create(fd);
      }
      toast.success(isEdit ? "Event updated!" : "Event created!");
      onSuccess(res.data.data);
    } catch (err) {
      toast.error(err.message || "Failed to save event.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0A0A0F]/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#1F1F2E] bg-[#13131C]"
        >
          <div className="sticky top-0 bg-[#13131C] border-b border-[#1F1F2E] px-8 pt-8 pb-5 z-10">
            <button onClick={onClose} className="absolute top-5 right-5 text-[#8A8A9E] hover:text-[#F5F5F7]"><X size={18} /></button>
            <h2 className="font-display text-2xl text-[#F5F5F7]">{isEdit ? "Edit Event" : "Create New Event"}</h2>
            <p className="text-sm text-[#8A8A9E] mt-1">{isEdit ? "Update event details." : "Fill in the details to create your event."}</p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
            {/* Banner */}
            <div>
              <label className={labelClass}>Banner Image</label>
              <div
                className="relative rounded-2xl border border-dashed border-[#2A2A3A] overflow-hidden cursor-pointer hover:border-[#7C5CFF]/60 transition-colors"
                style={{ height: 160 }}
              >
                {bannerPreview ? (
                  <img src={bannerPreview} alt="banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#8A8A9E] gap-2">
                    <Upload size={24} />
                    <span className="text-sm">Click to upload banner (1200×630 recommended)</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleBanner} />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className={labelClass}>Event Name *</label>
              <input className={`${inputClass} ${errors.name ? "border-[#FF6B5B]" : ""}`} placeholder="e.g. HackNova 7.0" value={form.name} onChange={e => handleChange("name", e.target.value)} />
              {errors.name && <p className="text-xs text-[#FF6B5B] mt-1">{errors.name}</p>}
            </div>

            {/* Type + Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Event Type *</label>
                <select className={inputClass} value={form.type} onChange={e => handleChange("type", e.target.value)}>
                  {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Category *</label>
                <select className={inputClass} value={form.category} onChange={e => handleChange("category", e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Short description */}
            <div>
              <label className={labelClass}>Short Description (max 200 chars)</label>
              <input className={inputClass} placeholder="Brief tagline for the event..." value={form.shortDescription} onChange={e => handleChange("shortDescription", e.target.value)} maxLength={200} />
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Full Description *</label>
              <textarea className={`${inputClass} ${errors.description ? "border-[#FF6B5B]" : ""} h-28 resize-none`} placeholder="Describe your event in detail..." value={form.description} onChange={e => handleChange("description", e.target.value)} />
              {errors.description && <p className="text-xs text-[#FF6B5B] mt-1">{errors.description}</p>}
            </div>

            {/* Venue */}
            <div>
              <label className={labelClass}>Venue *</label>
              <input className={`${inputClass} ${errors.venue ? "border-[#FF6B5B]" : ""}`} placeholder="e.g. Auditorium, Block A, NIET" value={form.venue} onChange={e => handleChange("venue", e.target.value)} />
              {errors.venue && <p className="text-xs text-[#FF6B5B] mt-1">{errors.venue}</p>}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Start Date & Time *</label>
                <input type="datetime-local" className={`${inputClass} ${errors.startDate ? "border-[#FF6B5B]" : ""}`} value={form.startDate} onChange={e => handleChange("startDate", e.target.value)} />
                {errors.startDate && <p className="text-xs text-[#FF6B5B] mt-1">{errors.startDate}</p>}
              </div>
              <div>
                <label className={labelClass}>End Date & Time *</label>
                <input type="datetime-local" className={`${inputClass} ${errors.endDate ? "border-[#FF6B5B]" : ""}`} value={form.endDate} onChange={e => handleChange("endDate", e.target.value)} />
                {errors.endDate && <p className="text-xs text-[#FF6B5B] mt-1">{errors.endDate}</p>}
              </div>
              <div>
                <label className={labelClass}>Registration Deadline *</label>
                <input type="datetime-local" className={`${inputClass} ${errors.registrationDeadline ? "border-[#FF6B5B]" : ""}`} value={form.registrationDeadline} onChange={e => handleChange("registrationDeadline", e.target.value)} />
                {errors.registrationDeadline && <p className="text-xs text-[#FF6B5B] mt-1">{errors.registrationDeadline}</p>}
              </div>
            </div>

            {/* Seats + Prize + Fee */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Seats Available *</label>
                <input type="number" min="1" className={`${inputClass} ${errors.seatsAvailable ? "border-[#FF6B5B]" : ""}`} placeholder="e.g. 200" value={form.seatsAvailable} onChange={e => handleChange("seatsAvailable", e.target.value)} />
                {errors.seatsAvailable && <p className="text-xs text-[#FF6B5B] mt-1">{errors.seatsAvailable}</p>}
              </div>
              <div>
                <label className={labelClass}>Prize Pool</label>
                <input className={inputClass} placeholder="e.g. ₹2,50,000" value={form.prizePool} onChange={e => handleChange("prizePool", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Entry Fee (₹)</label>
                <input type="number" min="0" className={inputClass} placeholder="0 = free" value={form.entryFee} onChange={e => handleChange("entryFee", e.target.value)} />
              </div>
            </div>

            {/* Eligibility */}
            <div>
              <label className={labelClass}>Eligibility Criteria</label>
              <input className={inputClass} placeholder="e.g. Open to all B.Tech students" value={form.eligibility} onChange={e => handleChange("eligibility", e.target.value)} />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-xl border border-[#2A2A3A] px-4 py-3">
                <span className="text-sm text-[#F5F5F7]">Certificate Available</span>
                <button type="button" onClick={() => handleChange("certificateAvailable", !form.certificateAvailable)} className={`w-10 h-5 rounded-full transition-colors relative ${form.certificateAvailable ? "bg-[#7C5CFF]" : "bg-[#2A2A3A]"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.certificateAvailable ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-[#2A2A3A] px-4 py-3">
                <span className="text-sm text-[#F5F5F7]">Team Event</span>
                <button type="button" onClick={() => handleChange("teamEvent", !form.teamEvent)} className={`w-10 h-5 rounded-full transition-colors relative ${form.teamEvent ? "bg-[#7C5CFF]" : "bg-[#2A2A3A]"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.teamEvent ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            {form.teamEvent && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Min Team Size</label>
                  <input type="number" min="1" max="20" className={inputClass} value={form.minTeamSize} onChange={e => handleChange("minTeamSize", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Max Team Size</label>
                  <input type="number" min="1" max="20" className={inputClass} value={form.maxTeamSize} onChange={e => handleChange("maxTeamSize", e.target.value)} />
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <label className={labelClass}>Status</label>
              <div className="grid grid-cols-2 gap-2">
                {["draft", "published"].map(s => (
                  <button key={s} type="button" onClick={() => handleChange("status", s)}
                    className={`py-2 rounded-xl border text-sm font-medium capitalize transition-colors ${form.status === s ? "border-[#7C5CFF] bg-[#7C5CFF]/10 text-[#F5F5F7]" : "border-[#2A2A3A] text-[#8A8A9E]"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold text-[#0A0A0F] disabled:opacity-70"
              style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}>
              {loading ? <div className="w-4 h-4 border-2 border-[#0A0A0F] border-t-transparent rounded-full animate-spin" /> : <>{isEdit ? "Update Event" : "Create Event"} <ArrowRight size={16} /></>}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EventFormModal;
