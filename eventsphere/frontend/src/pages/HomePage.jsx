import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Search, ArrowRight, Calendar, MapPin, Users,
  Trophy, Zap, Code, Globe, Mic, Rocket, Music, Dumbbell,
  ChevronRight, Star,
} from "lucide-react";
import { eventsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/auth/AuthModal";
import RegistrationModal from "../components/events/RegistrationModal";
import toast from "react-hot-toast";

// ──────────────────────────────────────────────
// Category data
// ──────────────────────────────────────────────
const CATEGORIES = [
  { name: "Hackathons",             icon: Code,   color: "#7C5CFF", bg: "#7C5CFF1A" },
  { name: "Workshops",              icon: Zap,    color: "#2DD4BF", bg: "#2DD4BF1A" },
  { name: "Tech Fests",             icon: Sparkles,color: "#FF6B5B",bg: "#FF6B5B1A" },
  { name: "Cultural Events",        icon: Music,  color: "#F59E0B", bg: "#F59E0B1A" },
  { name: "Sports Events",          icon: Dumbbell,color:"#10B981", bg: "#10B9811A" },
  { name: "Seminars",               icon: Mic,    color: "#6366F1", bg: "#6366F11A" },
  { name: "Startup Competitions",   icon: Rocket, color: "#EC4899", bg: "#EC48991A" },
  { name: "Coding Challenges",      icon: Code,   color: "#7C5CFF", bg: "#7C5CFF1A" },
  { name: "Webinars",               icon: Globe,  color: "#2DD4BF", bg: "#2DD4BF1A" },
  { name: "Conferences",            icon: Users,  color: "#FF6B5B", bg: "#FF6B5B1A" },
];

// ──────────────────────────────────────────────
// Event Card
// ──────────────────────────────────────────────
const EventCard = ({ event, onRegister }) => {
  const isOpen = event.isRegistrationOpen;
  const seatsLeft = event.seatsLeft ?? Math.max(0, event.seatsAvailable - event.seatsBooked);

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="group rounded-3xl border border-[#1F1F2E] bg-[#13131C] overflow-hidden flex flex-col"
    >
      <div className="relative h-48 overflow-hidden bg-[#0A0A0F]">
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-6xl"
            style={{ background: "linear-gradient(135deg,#7C5CFF14,#2DD4BF14)" }}
          >
            {CATEGORIES.find(c => c.name === event.category)
              ? React.createElement(CATEGORIES.find(c => c.name === event.category).icon, { size: 40, style: { color: CATEGORIES.find(c => c.name === event.category).color, opacity: 0.6 } })
              : <Calendar size={40} className="text-[#7C5CFF] opacity-40" />}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#13131C] via-transparent to-transparent" />
        {/* Status badge */}
        <span className={`absolute top-3 right-3 text-[10px] font-mono px-2.5 py-1 rounded-full border backdrop-blur-sm ${
          isOpen ? "text-[#2DD4BF] border-[#2DD4BF]/40 bg-[#2DD4BF]/10" : "text-[#8A8A9E] border-[#8A8A9E]/40 bg-[#0A0A0F]/70"
        }`}>
          {isOpen ? "OPEN" : "CLOSED"}
        </span>
        {/* Prize */}
        {event.prizePool && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-mono text-[#FFD700] bg-[#0A0A0F]/80 px-2.5 py-1 rounded-full border border-[#FFD700]/30">
            <Trophy size={11} /> {event.prizePool}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono text-[#8A8A9E]">{event.type}</span>
          {event.certificateAvailable && (
            <span className="text-[9px] font-mono text-[#7C5CFF] border border-[#7C5CFF]/30 px-1.5 py-0.5 rounded-full">CERT</span>
          )}
        </div>
        <h3 className="font-display text-lg text-[#F5F5F7] leading-tight mb-2 line-clamp-2">{event.name}</h3>
        <p className="text-xs text-[#8A8A9E] line-clamp-2 mb-4 flex-1">
          {event.shortDescription || event.description}
        </p>

        <div className="grid grid-cols-2 gap-1.5 mb-4 text-[11px] text-[#8A8A9E] font-mono">
          <div className="flex items-center gap-1.5">
            <Calendar size={10} className="text-[#7C5CFF]" />
            {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <MapPin size={10} className="text-[#7C5CFF] flex-shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={10} className="text-[#7C5CFF]" />
            {seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}
          </div>
          <div className="flex items-center gap-1.5 overflow-hidden">
            <Star size={10} className="text-[#7C5CFF]" />
            <span className="truncate">{event.organizer?.name || event.college || "—"}</span>
          </div>
        </div>

        <button
          onClick={() => isOpen && onRegister(event)}
          disabled={!isOpen}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={isOpen
            ? { background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)", color: "#0A0A0F" }
            : { background: "#1F1F2E", color: "#8A8A9E" }
          }
        >
          {isOpen ? "Register Now" : "Registration Closed"}
        </button>
      </div>
    </motion.div>
  );
};

// ──────────────────────────────────────────────
// Category Pill (circular card)
// ──────────────────────────────────────────────
const CategoryCard = ({ cat, onClick }) => {
  const Icon = cat.icon;
  return (
    <motion.button
      whileHover={{ scale: 1.08, y: -4 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center border border-transparent group-hover:border-current transition-all duration-300"
        style={{ background: cat.bg, color: cat.color }}
      >
        <Icon size={26} style={{ color: cat.color }} />
      </div>
      <span className="text-[11px] font-mono text-[#8A8A9E] group-hover:text-[#F5F5F7] transition-colors text-center max-w-[72px] leading-tight">
        {cat.name}
      </span>
    </motion.button>
  );
};

// ──────────────────────────────────────────────
// HomePage
// ──────────────────────────────────────────────
const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [regEvent, setRegEvent] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signup");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await eventsAPI.getAll({ limit: 9, sortBy: "createdAt", search });
        setEvents(data.data);
      } catch {
        toast.error("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [search]);

  const handleRegister = (event) => {
    if (!isAuthenticated) {
      setAuthMode("login");
      setShowAuth(true);
      return;
    }
    setRegEvent(event);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#F5F5F7]">
      {/* ── HERO ── */}
      <section className="relative pt-32 pb-24 px-4 overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-10" style={{ background: "#7C5CFF" }} />
        <div className="absolute top-20 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-8" style={{ background: "#2DD4BF" }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-mono px-4 py-1.5 rounded-full border border-[#7C5CFF]/40 bg-[#7C5CFF]/10 text-[#7C5CFF] mb-6">
              <Sparkles size={12} /> India's Student Event Platform
            </span>
            <h1 className="font-display text-5xl md:text-7xl text-[#F5F5F7] leading-tight mb-6">
              Discover. Register.{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}>
                Celebrate.
              </span>
            </h1>
            <p className="text-[#8A8A9E] text-lg md:text-xl max-w-2xl mx-auto mb-10">
              The all-in-one platform for college events — hackathons, fests, workshops, and more.
              Built for students, by students.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14"
          >
            {!isAuthenticated && (
              <button
                onClick={() => { setAuthMode("signup"); setShowAuth(true); }}
                className="group flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold text-[#0A0A0F] relative overflow-hidden"
                style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started Free <ArrowRight size={16} />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-[#FF6B5B] to-[#7C5CFF] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            )}
            <button
              onClick={() => navigate("/events")}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full text-sm font-semibold border border-[#2A2A3A] text-[#F5F5F7] hover:bg-[#1F1F2E] transition-colors"
            >
              Explore Events <ChevronRight size={16} />
            </button>
          </motion.div>

          {/* Search */}
          <motion.form
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            onSubmit={handleSearch}
            className="relative max-w-xl mx-auto"
          >
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8A8A9E]" />
            <input
              type="text"
              placeholder="Search events, colleges, hackathons..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="w-full pl-11 pr-36 py-4 rounded-2xl bg-[#13131C] border border-[#1F1F2E] text-sm text-[#F5F5F7] placeholder-[#8A8A9E] focus:border-[#7C5CFF]/60 outline-none"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 rounded-xl text-sm font-semibold text-[#0A0A0F]"
              style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}
            >
              Search
            </button>
          </motion.form>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display text-2xl text-[#F5F5F7]">Browse Categories</h2>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <CategoryCard
                key={cat.name}
                cat={cat}
                onClick={() => navigate(`/category/${encodeURIComponent(cat.name)}`)}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-[#1F1F2E]/50 mx-8" />

      {/* ── TRENDING EVENTS ── */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="font-display text-3xl text-[#F5F5F7]">
                {search ? `Results for "${search}"` : "Trending This Week"}
              </h2>
              <p className="text-[#8A8A9E] text-sm mt-1">
                {loading ? "Loading events..." : `${events.length} events found`}
              </p>
            </div>
            <button
              onClick={() => navigate("/events")}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1F1F2E] text-sm text-[#8A8A9E] hover:text-[#F5F5F7] hover:bg-[#13131C] transition-colors"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-3xl border border-[#1F1F2E] bg-[#13131C] h-80 animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-20 text-[#8A8A9E]">
              <Search size={40} className="mx-auto mb-4 opacity-30" />
              <p>No events found{search ? ` for "${search}"` : ""}.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, i) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <EventCard event={event} onRegister={handleRegister} />
                </motion.div>
              ))}
            </div>
          )}

          {events.length > 0 && (
            <div className="text-center mt-10">
              <button
                onClick={() => navigate("/events")}
                className="flex items-center gap-2 mx-auto px-6 py-3 rounded-full border border-[#2A2A3A] text-sm text-[#F5F5F7] hover:bg-[#13131C] transition-colors"
              >
                View All Events <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      {!isAuthenticated && (
        <section className="py-16 px-4">
          <div className="max-w-3xl mx-auto text-center rounded-3xl border border-[#1F1F2E] p-12 relative overflow-hidden" style={{ background: "linear-gradient(135deg,#7C5CFF10,#13131C)" }}>
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl opacity-15" style={{ background: "#7C5CFF" }} />
            <h2 className="font-display text-4xl text-[#F5F5F7] mb-4">Ready to Level Up?</h2>
            <p className="text-[#8A8A9E] mb-8">Join thousands of students discovering and competing at the best college events.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => { setAuthMode("signup"); setShowAuth(true); }}
                className="px-8 py-3.5 rounded-full text-sm font-semibold text-[#0A0A0F]"
                style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}
              >
                Create Free Account
              </button>
              <button
                onClick={() => { setAuthMode("signup"); setShowAuth(true); }}
                className="px-8 py-3.5 rounded-full text-sm font-semibold border border-[#2A2A3A] text-[#F5F5F7] hover:bg-[#1F1F2E] transition-colors"
              >
                Organize an Event
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-[#1F1F2E] py-10 px-4 mt-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C5CFF] to-[#2DD4BF] flex items-center justify-center">
              <Sparkles size={13} className="text-[#0A0A0F]" />
            </div>
            <span className="font-display text-base text-[#F5F5F7]">EventSphere</span>
          </div>
          <p className="text-xs text-[#8A8A9E] font-mono">© {new Date().getFullYear()} EventSphere. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-[#8A8A9E]">
            <a href="#" className="hover:text-[#F5F5F7] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#F5F5F7] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#F5F5F7] transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {showAuth && <AuthModal mode={authMode} onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
      {regEvent && (
        <RegistrationModal event={regEvent} onClose={() => setRegEvent(null)} />
      )}
    </div>
  );
};

export default HomePage;
