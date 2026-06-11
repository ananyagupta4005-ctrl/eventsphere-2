import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Calendar, MapPin, Users, ArrowLeft, Search, Trophy, Clock,
} from "lucide-react";
import { eventsAPI } from "../../api";
import { useAuth } from "../../context/AuthContext";
import RegistrationModal from "../../components/events/RegistrationModal";
import AuthModal from "../../components/auth/AuthModal";
import toast from "react-hot-toast";

const categoryMeta = {
  Hackathons:            { emoji: "💻", color: "#7C5CFF", desc: "Build, innovate, and compete." },
  Workshops:             { emoji: "🔧", color: "#2DD4BF", desc: "Hands-on skill-building sessions." },
  "Tech Fests":          { emoji: "⚡", color: "#FF6B5B", desc: "Multi-event tech extravaganzas." },
  "Cultural Events":     { emoji: "🎭", color: "#F59E0B", desc: "Art, music, dance, and more." },
  "Sports Events":       { emoji: "🏆", color: "#10B981", desc: "Athletic competitions and sports." },
  Seminars:              { emoji: "🎤", color: "#6366F1", desc: "Expert talks and knowledge sharing." },
  "Startup Competitions":{ emoji: "🚀", color: "#EC4899", desc: "Pitch your idea to the world." },
  "Coding Challenges":   { emoji: "🧠", color: "#7C5CFF", desc: "Test your algorithmic thinking." },
  Webinars:              { emoji: "🌐", color: "#2DD4BF", desc: "Online learning and networking." },
  Conferences:           { emoji: "📊", color: "#FF6B5B", desc: "Industry insights and connections." },
};

const EventCard = ({ event, onRegister }) => {
  const isOpen = event.isRegistrationOpen;
  const seatsLeft = event.seatsLeft ?? (event.seatsAvailable - event.seatsBooked);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="group rounded-3xl border border-[#1F1F2E] bg-[#13131C] overflow-hidden flex flex-col"
    >
      <div className="relative h-44 overflow-hidden bg-[#0A0A0F]">
        {event.bannerImage ? (
          <img src={event.bannerImage} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">
            {categoryMeta[event.category]?.emoji || "📅"}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#13131C] via-transparent to-transparent" />
        <span className={`absolute top-3 right-3 text-[10px] font-mono px-2.5 py-1 rounded-full border ${
          isOpen ? "text-[#2DD4BF] border-[#2DD4BF]/40 bg-[#2DD4BF]/10" : "text-[#8A8A9E] border-[#8A8A9E]/40 bg-[#0A0A0F]/70"
        }`}>
          {isOpen ? "OPEN" : event.status === "published" ? "CLOSED" : event.status.toUpperCase()}
        </span>
        {event.prizePool && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-mono text-[#FFD700] bg-[#0A0A0F]/80 px-2.5 py-1 rounded-full border border-[#FFD700]/30">
            <Trophy size={11} /> {event.prizePool}
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-mono text-[#8A8A9E] mb-1">{event.type}</div>
        <h3 className="font-display text-lg text-[#F5F5F7] leading-tight mb-2">{event.name}</h3>
        <p className="text-xs text-[#8A8A9E] line-clamp-2 mb-4 flex-1">{event.shortDescription || event.description}</p>

        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-[#8A8A9E] font-mono">
            <Calendar size={11} className="text-[#7C5CFF]" />
            {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8A8A9E] font-mono">
            <MapPin size={11} className="text-[#7C5CFF]" />
            <span className="truncate">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8A8A9E] font-mono">
            <Users size={11} className="text-[#7C5CFF]" />
            {seatsLeft > 0 ? `${seatsLeft} seats left` : "Fully booked"}
          </div>
          {event.registrationDeadline && (
            <div className="flex items-center gap-2 text-xs text-[#8A8A9E] font-mono">
              <Clock size={11} className="text-[#7C5CFF]" />
              Deadline: {new Date(event.registrationDeadline).toLocaleDateString("en-IN")}
            </div>
          )}
        </div>

        <button
          onClick={() => isOpen && onRegister(event)}
          disabled={!isOpen}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={isOpen ? { background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)", color: "#0A0A0F" } : { background: "#1F1F2E", color: "#8A8A9E" }}
        >
          {isOpen ? "Register Now" : "Registration Closed"}
        </button>
      </div>
    </motion.div>
  );
};

const CategoryPage = () => {
  const { category } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [regEvent, setRegEvent] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  const meta = categoryMeta[category] || { emoji: "📅", color: "#7C5CFF", desc: "" };

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const { data } = await eventsAPI.getByCategory(category, { page, limit: 9, search });
        setEvents(data.data);
        setTotalPages(data.pagination.pages);
      } catch {
        toast.error("Failed to load events.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [category, page, search]);

  const handleRegister = (event) => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    setRegEvent(event);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#8A8A9E] hover:text-[#F5F5F7] mb-8 text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[#1F1F2E] p-8 mb-10 overflow-hidden relative"
          style={{ background: `linear-gradient(135deg, ${meta.color}14, #13131C)` }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10" style={{ background: meta.color }} />
          <div className="text-5xl mb-4">{meta.emoji}</div>
          <h1 className="font-display text-4xl md:text-5xl text-[#F5F5F7] mb-2">{category}</h1>
          <p className="text-[#8A8A9E] text-lg">{meta.desc}</p>
          <div className="mt-4 text-sm font-mono text-[#8A8A9E]">
            {loading ? "Loading..." : `${events.length} event${events.length !== 1 ? "s" : ""} found`}
          </div>
        </motion.div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-xl">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A9E]" />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#13131C] border border-[#1F1F2E] text-sm text-[#F5F5F7] placeholder-[#8A8A9E] focus:border-[#7C5CFF]/60 outline-none"
              placeholder={`Search ${category}...`}
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold text-[#0A0A0F]" style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}>
            Search
          </button>
        </form>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-2 border-[#7C5CFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 text-[#8A8A9E]">
            <div className="text-5xl mb-4">{meta.emoji}</div>
            <p className="text-lg">No {category} found right now.</p>
            <p className="text-sm mt-1">Check back soon or explore other categories.</p>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-[#1F1F2E] text-sm text-[#8A8A9E] hover:text-[#F5F5F7] disabled:opacity-40"
                >Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-mono border transition-colors ${
                      p === page ? "border-[#7C5CFF] bg-[#7C5CFF]/10 text-[#7C5CFF]" : "border-[#1F1F2E] text-[#8A8A9E] hover:text-[#F5F5F7]"
                    }`}
                  >{p}</button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-[#1F1F2E] text-sm text-[#8A8A9E] hover:text-[#F5F5F7] disabled:opacity-40"
                >Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {regEvent && (
        <RegistrationModal event={regEvent} onClose={() => setRegEvent(null)} />
      )}
      {showAuth && (
        <AuthModal mode="login" onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
};

export default CategoryPage;
