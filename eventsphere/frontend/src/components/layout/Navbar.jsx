import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, LogOut, User, LayoutDashboard, Menu, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import AuthModal from "../auth/AuthModal";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const getDashboardPath = () => {
    if (user?.role === "admin") return "/admin";
    if (user?.role === "organizer") return "/organizer";
    return "/dashboard";
  };

  const navLinks = [
    { label: "Events", to: "/events" },
    { label: "Hackathons", to: "/category/Hackathons" },
    { label: "Workshops", to: "/category/Workshops" },
  ];

  const openLogin = () => { setAuthMode("login"); setShowAuth(true); };
  const openSignup = () => { setAuthMode("signup"); setShowAuth(true); };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1F1F2E]/80 bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C5CFF] to-[#2DD4BF] flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} className="text-[#0A0A0F]" />
              </div>
              <span className="font-display text-lg text-[#F5F5F7] tracking-tight">EventSphere</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-sm transition-colors ${
                    location.pathname === to || location.pathname.startsWith(to + "/")
                      ? "text-[#F5F5F7] font-medium"
                      : "text-[#8A8A9E] hover:text-[#F5F5F7]"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#1F1F2E] hover:bg-[#1F1F2E] transition-colors"
                  >
                    {user.profileImage ? (
                      <img src={user.profileImage} alt={user.name} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#7C5CFF]/20 flex items-center justify-center text-[#7C5CFF] text-[10px] font-bold">
                        {user.name[0]}
                      </div>
                    )}
                    <span className="text-sm text-[#F5F5F7] hidden sm:block max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full hidden sm:block" style={{
                      background: user.role === "admin" ? "#FF6B5B14" : user.role === "organizer" ? "#7C5CFF14" : "#2DD4BF14",
                      color: user.role === "admin" ? "#FF6B5B" : user.role === "organizer" ? "#7C5CFF" : "#2DD4BF",
                    }}>
                      {user.role}
                    </span>
                    <ChevronDown size={12} className={`text-[#8A8A9E] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.97 }}
                        className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-[#1F1F2E] bg-[#13131C] py-2 shadow-xl overflow-hidden"
                      >
                        <Link
                          to={getDashboardPath()}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#F5F5F7] hover:bg-[#1F1F2E] transition-colors"
                        >
                          <LayoutDashboard size={14} className="text-[#7C5CFF]" /> Dashboard
                        </Link>
                        <Link
                          to="/profile"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#F5F5F7] hover:bg-[#1F1F2E] transition-colors"
                        >
                          <User size={14} className="text-[#7C5CFF]" /> Profile
                        </Link>
                        <div className="border-t border-[#1F1F2E] my-1" />
                        <button
                          onClick={() => { logout(); navigate("/"); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#FF6B5B] hover:bg-[#FF6B5B]/10 transition-colors"
                        >
                          <LogOut size={14} /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <button onClick={openLogin} className="px-4 py-2 text-sm text-[#8A8A9E] hover:text-[#F5F5F7] transition-colors">
                    Log In
                  </button>
                  <button
                    onClick={openSignup}
                    className="px-4 py-2 rounded-full text-sm font-semibold text-[#0A0A0F]"
                    style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                className="md:hidden p-2 rounded-xl border border-[#1F1F2E] text-[#8A8A9E] hover:text-[#F5F5F7]"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-[#1F1F2E] bg-[#0A0A0F] overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map(({ label, to }) => (
                  <Link key={to} to={to} className="flex items-center px-3 py-2.5 rounded-xl text-sm text-[#8A8A9E] hover:text-[#F5F5F7] hover:bg-[#13131C] transition-colors">
                    {label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <div className="flex gap-2 pt-2">
                    <button onClick={openLogin} className="flex-1 py-2.5 rounded-xl border border-[#1F1F2E] text-sm text-[#8A8A9E]">Log In</button>
                    <button onClick={openSignup} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#0A0A0F]" style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}>Sign Up</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {showAuth && <AuthModal mode={authMode} onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
