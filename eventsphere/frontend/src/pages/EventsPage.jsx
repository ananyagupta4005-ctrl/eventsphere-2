import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search, Filter, Calendar, MapPin, Users, Trophy, X,
} from "lucide-react";
import { eventsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import RegistrationModal from "../components/events/RegistrationModal";
import AuthModal from "../components/auth/AuthModal";
import toast from "react-hot-toast";

const CATEGORIES = [
  "Hackathons","Workshops","Tech Fests","Cultural Events","Sports Events",
  "Seminars","Startup Competitions","Coding Challenges","Webinars","Conferences",
];
const TYPES = [
  "Hackathon","Workshop","Tech Fest","Cultural Fest","Sports Event",
  "Seminar","Startup Competition","Coding Challenge","Webinar","Conference",
];

const EventCard = ({ event, onRegister }) => {
  const isOpen = event.isRegistrationOpen;
  const seatsLeft = event.seatsLeft ?? Math.max(0, event.seatsAvailable - event.seatsBooked);
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: "spring", stiffness: 300 }}
      className="group rounded-3xl border border-[#1F1F2E] bg-[#13131C] overflow-hidden flex flex-col">
      <div className="relative h-44 overflow-hidden bg-[#0A0A0F]">
        {event.bannerImage
          ? <img src={event.bannerImage} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center"><Calendar size={40} className="text-[#7C5CFF] opacity-30" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-[#13131C] via-transparent to-transparent" />
        <span className={`absolute top-3 right-3 text-[10px] font-mono px-2.5 py-1 rounded-full border ${isOpen ? "text-[#2DD4BF] border-[#2DD4BF]/40 bg-[#2DD4BF]/10" : "text-[#8A8A9E] border-[#8A8A9E]/40 bg-[#0A0A0F]/70"}`}>
          {isOpen ? "OPEN" : "CLOSED"}
        </span>
        {event.prizePool && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-mono text-[#FFD700] bg-[#0A0A0F]/80 px-2.5 py-1 rounded-full border border-[#FFD700]/30">
            <Trophy size={11} />{event.prizePool}
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-mono text-[#8A8A9E] mb-1">{event.type}</div>
        <h3 className="font-display text-lg text-[#F5F5F7] leading-tight mb-2 line-clamp-2">{event.name}</h3>
        <p className="text-xs text-[#8A8A9E] line-clamp-2 mb-4 flex-1">{event.shortDescription || event.description}</p>
        <div className="grid grid-cols-2 gap-1.5 mb-4 text-[11px] text-[#8A8A9E] font-mono">
          <div className="flex items-center gap-1.5"><Calendar size={10} className="text-[#7C5CFF]" />{new Date(event.startDate).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}</div>
          <div className="flex items-center gap-1.5 overflow-hidden"><MapPin size={10} className="text-[#7C5CFF] flex-shrink-0" /><span className="truncate">{event.venue}</span></div>
          <div className="flex items-center gap-1.5"><Users size={10} className="text-[#7C5CFF]" />{seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}</div>
        </div>
        <button onClick={() => isOpen && onRegister(event)} disabled={!isOpen}
          className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={isOpen ? { background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)", color: "#0A0A0F" } : { background: "#1F1F2E", color: "#8A8A9E" }}>
          {isOpen ? "Register Now" : "Registration Closed"}
        </button>
      </div>
    </motion.div>
  );
};

const EventsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ search: "", category: "", type: "", sortBy: "createdAt" });
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [regEvent, setRegEvent] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = { page, limit: 12, ...filters };
        const { data } = await eventsAPI.getAll(params);
        setEvents(data.data);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.pages);
      } catch { toast.error("Failed to load events."); }
      finally { setLoading(false); }
    };
    fetch();
  }, [page, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(f => ({ ...f, search: searchInput }));
    setPage(1);
  };

  const handleFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: "", category: "", type: "", sortBy: "createdAt" });
    setSearchInput("");
    setPage(1);
  };

  const activeFilterCount = [filters.category, filters.type].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-[#F5F5F7]">All Events</h1>
          <p className="text-[#8A8A9E] text-sm mt-1">{total} events available</p>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-wrap gap-3 mb-6">
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A9E]" />
            <input
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#13131C] border border-[#1F1F2E] text-sm text-[#F5F5F7] placeholder-[#8A8A9E] focus:border-[#7C5CFF]/60 outline-none"
              placeholder="Search events..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </form>
          <select
            className="px-4 py-2.5 rounded-xl bg-[#13131C] border border-[#1F1F2E] text-sm text-[#F5F5F7] outline-none"
            value={filters.sortBy}
            onChange={e => handleFilter("sortBy", e.target.value)}
          >
            <option value="createdAt">Newest First</option>
            <option value="startDate">By Start Date</option>
            <option value="views">Most Viewed</option>
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${showFilters ? "border-[#7C5CFF] bg-[#7C5CFF]/10 text-[#7C5CFF]" : "border-[#1F1F2E] text-[#8A8A9E] hover:text-[#F5F5F7]"}`}
          >
            <Filter size={14} /> Filters {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-[#7C5CFF] text-white text-[10px] flex items-center justify-center">{activeFilterCount}</span>}
          </button>
          {(activeFilterCount > 0 || filters.search) && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-[#FF6B5B]/40 text-[#FF6B5B] text-sm hover:bg-[#FF6B5B]/10 transition-colors">
              <X size={14} /> Clear
            </button>
          )}
        </div>

        {/* Expandable filters */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-5 mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-mono text-[#8A8A9E] uppercase tracking-widest mb-2">Category</div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c} onClick={() => handleFilter("category", filters.category === c ? "" : c)}
                      className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${filters.category === c ? "border-[#7C5CFF] bg-[#7C5CFF]/10 text-[#7C5CFF]" : "border-[#2A2A3A] text-[#8A8A9E] hover:text-[#F5F5F7]"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-mono text-[#8A8A9E] uppercase tracking-widest mb-2">Event Type</div>
                <div className="flex flex-wrap gap-2">
                  {TYPES.map(t => (
                    <button key={t} onClick={() => handleFilter("type", filters.type === t ? "" : t)}
                      className={`px-3 py-1.5 rounded-full border text-xs transition-colors ${filters.type === t ? "border-[#2DD4BF] bg-[#2DD4BF]/10 text-[#2DD4BF]" : "border-[#2A2A3A] text-[#8A8A9E] hover:text-[#F5F5F7]"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => <div key={i} className="rounded-3xl border border-[#1F1F2E] bg-[#13131C] h-80 animate-pulse" />)}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 text-[#8A8A9E]">
            <Search size={40} className="mx-auto mb-4 opacity-30" />
            <p className="text-lg">No events found.</p>
            <button onClick={clearFilters} className="mt-4 text-[#7C5CFF] hover:underline text-sm">Clear filters</button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {events.map((event, i) => (
                <motion.div key={event._id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <EventCard event={event} onRegister={(e) => {
                    if (!isAuthenticated) { setShowAuth(true); return; }
                    setRegEvent(e);
                  }} />
                </motion.div>
              ))}
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-4 py-2 rounded-xl border border-[#1F1F2E] text-sm text-[#8A8A9E] hover:text-[#F5F5F7] disabled:opacity-40">Prev</button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-mono border ${p === page ? "border-[#7C5CFF] bg-[#7C5CFF]/10 text-[#7C5CFF]" : "border-[#1F1F2E] text-[#8A8A9E] hover:text-[#F5F5F7]"}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl border border-[#1F1F2E] text-sm text-[#8A8A9E] hover:text-[#F5F5F7] disabled:opacity-40">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {regEvent && <RegistrationModal event={regEvent} onClose={() => setRegEvent(null)} />}
      {showAuth && <AuthModal mode="login" onClose={() => setShowAuth(false)} />}
    </div>
  );
};

export default EventsPage;
