import React, { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Save, User, Mail, Phone, BookOpen, Link as LinkIcon } from "lucide-react";
import { userAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const inputClass = "w-full px-4 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#2A2A3A] text-sm text-[#F5F5F7] placeholder-[#8A8A9E] focus:border-[#7C5CFF]/60 focus:outline-none transition-colors";
const labelClass = "block text-xs text-[#8A8A9E] mb-1.5 font-mono uppercase tracking-wider";

const ProfilePage = () => {
  const { user, saveAuth, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.profileImage || "");
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    college: user?.college || "",
    course: user?.course || "",
    year: user?.year || "",
    gender: user?.gender || "",
    bio: user?.bio || "",
    organization: user?.organization || "",
    linkedin: user?.socialLinks?.linkedin || "",
    twitter: user?.socialLinks?.twitter || "",
    github: user?.socialLinks?.github || "",
    website: user?.socialLinks?.website || "",
  });

  const handleChange = (field, val) => setForm(p => ({ ...p, [field]: val }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (["linkedin","twitter","github","website"].includes(k)) return;
        if (v) fd.append(k, v);
      });
      fd.append("socialLinks[linkedin]", form.linkedin || "");
      fd.append("socialLinks[twitter]", form.twitter || "");
      fd.append("socialLinks[github]", form.github || "");
      fd.append("socialLinks[website]", form.website || "");
      if (imageFile) fd.append("profileImage", imageFile);

      const { data } = await userAPI.updateProfile(fd);
      saveAuth(token, data.data);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const roleColors = { admin: "#FF6B5B", organizer: "#7C5CFF", participant: "#2DD4BF" };
  const roleColor = roleColors[user?.role] || "#7C5CFF";

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="font-display text-4xl text-[#F5F5F7] mb-8">My Profile</h1>

        <form onSubmit={handleSubmit}>
          {/* Avatar */}
          <div className="rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-6 mb-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 bg-[#0A0A0F]" style={{ borderColor: `${roleColor}50` }}>
                  {imagePreview
                    ? <img src={imagePreview} alt={user?.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center" style={{ background: `${roleColor}14` }}>
                        <User size={32} style={{ color: roleColor, opacity: 0.6 }} />
                      </div>
                  }
                </div>
                <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-[#7C5CFF] flex items-center justify-center cursor-pointer hover:bg-[#6B4EE8] transition-colors">
                  <Camera size={13} className="text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              <div>
                <div className="font-display text-xl text-[#F5F5F7]">{user?.name}</div>
                <div className="text-sm text-[#8A8A9E]">{user?.email}</div>
                <div className="mt-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border capitalize" style={{ color: roleColor, borderColor: `${roleColor}40`, background: `${roleColor}14` }}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-6 mb-6 space-y-4">
            <h2 className="font-display text-lg text-[#F5F5F7] mb-4">Personal Information</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}><User size={11} className="inline mr-1" />Full Name</label>
                <input className={inputClass} value={form.name} onChange={e => handleChange("name", e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label className={labelClass}><Phone size={11} className="inline mr-1" />Phone</label>
                <input className={inputClass} value={form.phone} onChange={e => handleChange("phone", e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <select className={inputClass} value={form.gender} onChange={e => handleChange("gender", e.target.value)}>
                  <option value="">Select Gender</option>
                  {["Male","Female","Other","Prefer not to say"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}><BookOpen size={11} className="inline mr-1" />College</label>
                <input className={inputClass} value={form.college} onChange={e => handleChange("college", e.target.value)} placeholder="Your college" />
              </div>
              <div>
                <label className={labelClass}>Course</label>
                <input className={inputClass} value={form.course} onChange={e => handleChange("course", e.target.value)} placeholder="B.Tech, MBA..." />
              </div>
              <div>
                <label className={labelClass}>Year</label>
                <select className={inputClass} value={form.year} onChange={e => handleChange("year", e.target.value)}>
                  <option value="">Select Year</option>
                  {["1st Year","2nd Year","3rd Year","4th Year","5th Year","Alumni"].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            {user?.role === "organizer" && (
              <div>
                <label className={labelClass}>Organization / Club</label>
                <input className={inputClass} value={form.organization} onChange={e => handleChange("organization", e.target.value)} placeholder="e.g. Google Developer Students Club" />
              </div>
            )}
            <div>
              <label className={labelClass}>Bio</label>
              <textarea className={`${inputClass} h-24 resize-none`} value={form.bio} onChange={e => handleChange("bio", e.target.value)} placeholder="Tell us a bit about yourself..." maxLength={500} />
            </div>
          </div>

          {/* Social Links */}
          <div className="rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-6 mb-6 space-y-4">
            <h2 className="font-display text-lg text-[#F5F5F7] mb-4"><LinkIcon size={16} className="inline mr-2" />Social Links</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[["linkedin","LinkedIn","linkedin.com/in/..."],["twitter","Twitter","twitter.com/..."],["github","GitHub","github.com/..."],["website","Website","https://..."]].map(([key,label,ph]) => (
                <div key={key}>
                  <label className={labelClass}>{label}</label>
                  <input className={inputClass} value={form[key]} onChange={e => handleChange(key, e.target.value)} placeholder={ph} />
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-semibold text-[#0A0A0F] disabled:opacity-70"
            style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}>
            {loading
              ? <div className="w-4 h-4 border-2 border-[#0A0A0F] border-t-transparent rounded-full animate-spin" />
              : <><Save size={16} /> Save Changes</>
            }
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
