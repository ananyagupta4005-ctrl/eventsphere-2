import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Award, Users, Clock, MapPin, Download, CheckCircle2, XCircle, Ticket } from "lucide-react";
import { registrationAPI, certificateAPI, userAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-6"
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}1A` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <span className="text-sm text-[#8A8A9E]">{label}</span>
    </div>
    <div className="font-display text-3xl text-[#F5F5F7]">{value}</div>
  </motion.div>
);

const RegistrationCard = ({ reg, onCancel }) => {
  const event = reg.event;
  const isUpcoming = event && new Date(event.startDate) > new Date();

  return (
    <motion.div whileHover={{ y: -3 }} className="rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-display text-base text-[#F5F5F7]">{event?.name || "Event"}</div>
          <div className="text-xs text-[#8A8A9E] font-mono">{reg.registrationId}</div>
        </div>
        <span className={`text-[10px] font-mono px-2 py-1 rounded-full border uppercase ${
          reg.status === "confirmed"
            ? "text-[#2DD4BF] border-[#2DD4BF]/40 bg-[#2DD4BF]/10"
            : "text-[#FF6B5B] border-[#FF6B5B]/40 bg-[#FF6B5B]/10"
        }`}>
          {reg.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-[#8A8A9E] font-mono mb-4">
        {event?.startDate && (
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[#7C5CFF]" />
            {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        )}
        {event?.venue && (
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-[#7C5CFF]" />
            <span className="truncate">{event.venue}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          {reg.attended ? (
            <><CheckCircle2 size={12} className="text-[#2DD4BF]" /> <span className="text-[#2DD4BF]">Attended</span></>
          ) : (
            <><Clock size={12} /> {isUpcoming ? "Upcoming" : "Not attended"}</>
          )}
        </div>
        {reg.certificateGenerated && (
          <div className="flex items-center gap-1.5 text-[#2DD4BF]">
            <Award size={12} /> Certificate Ready
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {reg.status === "confirmed" && isUpcoming && (
          <button
            onClick={() => onCancel(reg._id)}
            className="flex-1 py-2 text-xs rounded-xl border border-[#FF6B5B]/40 text-[#FF6B5B] hover:bg-[#FF6B5B]/10 transition-colors"
          >
            Cancel Registration
          </button>
        )}
        {reg.certificateGenerated && reg.certificate && (
          <button
            onClick={() => {/* navigate to certificate */}}
            className="flex-1 py-2 text-xs rounded-xl border border-[#2DD4BF]/40 text-[#2DD4BF] hover:bg-[#2DD4BF]/10 transition-colors flex items-center justify-center gap-1"
          >
            <Download size={12} /> Download Cert
          </button>
        )}
      </div>
    </motion.div>
  );
};

const CertificateCard = ({ cert, onDownload }) => {
  const colors = {
    Participation: "#7C5CFF",
    Winner: "#FFD700",
    "Runner Up": "#2DD4BF",
    Volunteer: "#7C5CFF",
    Speaker: "#FF6B5B",
    Organizer: "#2DD4BF",
  };
  const color = colors[cert.type] || "#7C5CFF";

  return (
    <motion.div whileHover={{ y: -4 }} className="relative rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-5 overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20" style={{ background: color }} />
      <div className="rounded-xl border border-dashed p-4 mb-4" style={{ borderColor: `${color}55`, background: `${color}10` }}>
        <div className="flex items-center justify-between mb-3">
          <Award size={18} style={{ color }} />
          <span className="font-mono text-[9px] text-[#8A8A9E]">EventSphere</span>
        </div>
        <div className="font-display text-sm text-[#F5F5F7] text-center">Certificate of</div>
        <div className="font-display text-base text-center" style={{ color }}>{cert.type}</div>
        <div className="mt-3 flex items-center justify-between text-[9px] font-mono text-[#8A8A9E]">
          <span>{cert.certificateId}</span>
          <span>Verified ✓</span>
        </div>
      </div>
      <div className="font-medium text-sm text-[#F5F5F7] mb-1">{cert.eventName}</div>
      <div className="text-xs text-[#8A8A9E] mb-3">{cert.eventDate}</div>
      <button
        onClick={() => onDownload(cert._id)}
        className="w-full py-2 rounded-xl border border-[#2A2A3A] text-xs text-[#F5F5F7] hover:border-[#7C5CFF]/50 hover:bg-[#7C5CFF]/10 transition-colors flex items-center justify-center gap-1.5"
      >
        <Download size={12} /> Download PDF
      </button>
    </motion.div>
  );
};

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("registrations");
  const [registrations, setRegistrations] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regsRes, certsRes, statsRes] = await Promise.all([
          registrationAPI.getMyRegistrations(),
          certificateAPI.getMyCertificates(),
          userAPI.getDashboardStats(),
        ]);
        setRegistrations(regsRes.data.data);
        setCertificates(certsRes.data.data);
        setStats(statsRes.data.data);
      } catch (err) {
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCancel = async (regId) => {
    if (!window.confirm("Cancel this registration?")) return;
    try {
      await registrationAPI.cancel(regId);
      setRegistrations((prev) =>
        prev.map((r) => (r._id === regId ? { ...r, status: "cancelled" } : r))
      );
      toast.success("Registration cancelled.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDownload = async (certId) => {
    try {
      const { data } = await certificateAPI.download(certId);
      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `EventSphere_Certificate_${certId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download certificate.");
    }
  };

  const tabs = [
    { id: "registrations", label: "My Registrations", icon: Ticket },
    { id: "certificates", label: "Certificates", icon: Award },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7C5CFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-4xl text-[#F5F5F7]">
            Welcome back, <span className="text-[#7C5CFF]">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-[#8A8A9E] text-sm mt-1">Track your events, certificates, and more.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <StatCard icon={Ticket} label="Total Registrations" value={stats?.registrations ?? 0} color="#7C5CFF" />
          <StatCard icon={Award} label="Certificates Earned" value={stats?.certificates ?? 0} color="#2DD4BF" />
          <StatCard icon={Calendar} label="Events Attended" value={registrations.filter(r => r.attended).length} color="#FF6B5B" />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl border border-[#1F1F2E] bg-[#13131C] w-fit mb-8">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === id ? "bg-[#7C5CFF] text-white" : "text-[#8A8A9E] hover:text-[#F5F5F7]"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "registrations" && (
          <div>
            {registrations.length === 0 ? (
              <div className="text-center py-16 text-[#8A8A9E]">
                <Ticket size={40} className="mx-auto mb-4 opacity-40" />
                <p>No registrations yet. Explore events and register!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {registrations.map((reg) => (
                  <RegistrationCard key={reg._id} reg={reg} onCancel={handleCancel} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "certificates" && (
          <div>
            {certificates.length === 0 ? (
              <div className="text-center py-16 text-[#8A8A9E]">
                <Award size={40} className="mx-auto mb-4 opacity-40" />
                <p>No certificates yet. Attend events to earn them!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {certificates.map((cert) => (
                  <CertificateCard key={cert._id} cert={cert} onDownload={handleDownload} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParticipantDashboard;
