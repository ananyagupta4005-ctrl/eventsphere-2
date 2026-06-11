import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Calendar, Users, Award, Edit2, Trash2, Eye, ToggleLeft,
  ToggleRight, CheckCircle2, XCircle, Download, ChevronDown, ChevronUp,
} from "lucide-react";
import { eventsAPI, registrationAPI, certificateAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import EventFormModal from "../components/events/EventFormModal";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}1A` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <span className="text-sm text-[#8A8A9E]">{label}</span>
    </div>
    <div className="font-display text-3xl text-[#F5F5F7]">{value}</div>
  </motion.div>
);

const statusColor = { draft: "#8A8A9E", published: "#2DD4BF", cancelled: "#FF6B5B", completed: "#7C5CFF" };

const EventRow = ({ event, onEdit, onDelete, onPublish, onViewRegistrations }) => (
  <motion.div
    whileHover={{ y: -2 }}
    className="rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
  >
    {event.bannerImage && (
      <img src={event.bannerImage} alt={event.name} className="w-full sm:w-24 h-16 object-cover rounded-xl flex-shrink-0" />
    )}
    <div className="flex-1 min-w-0">
      <div className="flex items-start gap-2 flex-wrap">
        <span className="font-display text-base text-[#F5F5F7] truncate">{event.name}</span>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase"
          style={{ color: statusColor[event.status], borderColor: `${statusColor[event.status]}40`, background: `${statusColor[event.status]}14` }}
        >
          {event.status}
        </span>
      </div>
      <div className="flex flex-wrap gap-3 mt-1 text-xs text-[#8A8A9E] font-mono">
        <span className="flex items-center gap-1"><Calendar size={11} />{new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        <span className="flex items-center gap-1"><Users size={11} />{event.registrationCount ?? 0} registered</span>
        <span className="flex items-center gap-1"><CheckCircle2 size={11} />{event.attendedCount ?? 0} attended</span>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      <button onClick={() => onViewRegistrations(event)} className="p-2 rounded-xl border border-[#2A2A3A] text-[#8A8A9E] hover:text-[#F5F5F7] hover:border-[#7C5CFF]/50 transition-colors" title="View Registrations">
        <Eye size={15} />
      </button>
      <button onClick={() => onPublish(event._id, event.status)} className="p-2 rounded-xl border border-[#2A2A3A] text-[#8A8A9E] hover:text-[#2DD4BF] hover:border-[#2DD4BF]/50 transition-colors" title={event.status === "published" ? "Unpublish" : "Publish"}>
        {event.status === "published" ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
      </button>
      <button onClick={() => onEdit(event)} className="p-2 rounded-xl border border-[#2A2A3A] text-[#8A8A9E] hover:text-[#7C5CFF] hover:border-[#7C5CFF]/50 transition-colors" title="Edit">
        <Edit2 size={15} />
      </button>
      <button onClick={() => onDelete(event._id)} className="p-2 rounded-xl border border-[#2A2A3A] text-[#8A8A9E] hover:text-[#FF6B5B] hover:border-[#FF6B5B]/50 transition-colors" title="Delete">
        <Trash2 size={15} />
      </button>
    </div>
  </motion.div>
);

const RegistrationsPanel = ({ event, onClose }) => {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certType, setCertType] = useState("Participation");

  useEffect(() => {
    registrationAPI.getEventRegistrations(event._id)
      .then(({ data }) => setRegs(data.data))
      .catch(() => toast.error("Failed to load registrations."))
      .finally(() => setLoading(false));
  }, [event._id]);

  const handleAttendance = async (regId, attended) => {
    try {
      await registrationAPI.markAttendance(regId, attended);
      setRegs((prev) => prev.map((r) => r._id === regId ? { ...r, attended } : r));
      toast.success(`Attendance ${attended ? "marked" : "removed"}.`);
    } catch { toast.error("Failed to update attendance."); }
  };

  const handleGenerateCert = async (regId) => {
    try {
      await certificateAPI.generate({ registrationId: regId, type: certType });
      setRegs((prev) => prev.map((r) => r._id === regId ? { ...r, certificateGenerated: true } : r));
      toast.success("Certificate generated!");
    } catch (err) { toast.error(err.message || "Failed to generate certificate."); }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-[#0A0A0F]/80 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-[#1F1F2E] bg-[#13131C]" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[#13131C] border-b border-[#1F1F2E] px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl text-[#F5F5F7]">{event.name}</h2>
            <p className="text-sm text-[#8A8A9E]">{regs.length} registrations</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={certType}
              onChange={e => setCertType(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#0A0A0F] border border-[#2A2A3A] text-xs text-[#F5F5F7] outline-none"
            >
              {["Participation", "Winner", "Runner Up", "Volunteer", "Speaker", "Organizer"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button onClick={onClose} className="text-[#8A8A9E] hover:text-[#F5F5F7]"><XCircle size={18} /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#7C5CFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : regs.length === 0 ? (
          <div className="text-center py-16 text-[#8A8A9E]">No registrations yet.</div>
        ) : (
          <div className="p-6 space-y-3">
            {regs.map((reg) => (
              <div key={reg._id} className="rounded-xl border border-[#1F1F2E] p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-[#F5F5F7]">{reg.fullName}</div>
                  <div className="text-xs text-[#8A8A9E] font-mono">{reg.email} · {reg.collegeName}</div>
                  <div className="text-xs text-[#8A8A9E] font-mono mt-0.5">{reg.course} · {reg.year} · {reg.gender}</div>
                  {reg.teamName && <div className="text-xs text-[#7C5CFF] mt-0.5">Team: {reg.teamName}</div>}
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <button
                    onClick={() => handleAttendance(reg._id, !reg.attended)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-colors ${
                      reg.attended
                        ? "border-[#2DD4BF]/50 bg-[#2DD4BF]/10 text-[#2DD4BF]"
                        : "border-[#2A2A3A] text-[#8A8A9E] hover:border-[#2DD4BF]/50"
                    }`}
                  >
                    {reg.attended ? <><CheckCircle2 size={12} /> Attended</> : "Mark Attended"}
                  </button>
                  {reg.attended && !reg.certificateGenerated && (
                    <button
                      onClick={() => handleGenerateCert(reg._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#7C5CFF]/50 bg-[#7C5CFF]/10 text-[#7C5CFF] text-xs hover:bg-[#7C5CFF]/20 transition-colors"
                    >
                      <Award size={12} /> Generate Cert
                    </button>
                  )}
                  {reg.certificateGenerated && (
                    <span className="text-xs text-[#2DD4BF] flex items-center gap-1"><Award size={12} /> Cert Issued</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [viewRegsEvent, setViewRegsEvent] = useState(null);

  const fetchData = async () => {
    try {
      const [evRes, statsRes] = await Promise.all([
        eventsAPI.getMyEvents(),
        userAPI.getDashboardStats ? userAPI.getDashboardStats() : Promise.resolve({ data: { data: {} } }),
      ]);
      setEvents(evRes.data.data);
    } catch { toast.error("Failed to load data."); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line
  const userAPI = require("../../api").userAPI;

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    try {
      await eventsAPI.delete(id);
      setEvents(prev => prev.filter(e => e._id !== id));
      toast.success("Event deleted.");
    } catch (err) { toast.error(err.message); }
  };

  const handlePublish = async (id, currentStatus) => {
    try {
      const { data } = await eventsAPI.publish(id);
      setEvents(prev => prev.map(e => e._id === id ? { ...e, status: data.data.status } : e));
      toast.success(data.message);
    } catch (err) { toast.error(err.message); }
  };

  const handleFormSuccess = (saved) => {
    if (editEvent) {
      setEvents(prev => prev.map(e => e._id === saved._id ? { ...saved, registrationCount: e.registrationCount, attendedCount: e.attendedCount } : e));
    } else {
      setEvents(prev => [{ ...saved, registrationCount: 0, attendedCount: 0 }, ...prev]);
    }
    setShowForm(false);
    setEditEvent(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7C5CFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const published = events.filter(e => e.status === "published").length;
  const totalRegs = events.reduce((s, e) => s + (e.registrationCount || 0), 0);
  const totalCerts = events.reduce((s, e) => s + (e.attendedCount || 0), 0);

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl text-[#F5F5F7]">Organizer Dashboard</h1>
            <p className="text-[#8A8A9E] text-sm mt-1">Manage your events, registrations, and certificates.</p>
          </div>
          <button
            onClick={() => { setEditEvent(null); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold text-[#0A0A0F]"
            style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}
          >
            <Plus size={16} /> Create Event
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Calendar} label="Total Events" value={events.length} color="#7C5CFF" />
          <StatCard icon={ToggleRight} label="Published" value={published} color="#2DD4BF" />
          <StatCard icon={Users} label="Registrations" value={totalRegs} color="#FF6B5B" />
          <StatCard icon={Award} label="Attended" value={totalCerts} color="#7C5CFF" />
        </div>

        <h2 className="font-display text-2xl text-[#F5F5F7] mb-4">Your Events</h2>
        {events.length === 0 ? (
          <div className="text-center py-16 text-[#8A8A9E] border border-dashed border-[#2A2A3A] rounded-2xl">
            <Calendar size={40} className="mx-auto mb-4 opacity-40" />
            <p>No events yet. Create your first event!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(ev => (
              <EventRow
                key={ev._id}
                event={ev}
                onEdit={(e) => { setEditEvent(e); setShowForm(true); }}
                onDelete={handleDelete}
                onPublish={handlePublish}
                onViewRegistrations={setViewRegsEvent}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <EventFormModal
          event={editEvent}
          onClose={() => { setShowForm(false); setEditEvent(null); }}
          onSuccess={handleFormSuccess}
        />
      )}
      {viewRegsEvent && (
        <RegistrationsPanel event={viewRegsEvent} onClose={() => setViewRegsEvent(null)} />
      )}
    </div>
  );
};

export default OrganizerDashboard;
