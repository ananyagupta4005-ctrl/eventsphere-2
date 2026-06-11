import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Globe, Mail, Phone, Eye, EyeOff, ArrowRight, Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../api";
import toast from "react-hot-toast";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-[#0A0A0F] border border-[#2A2A3A] text-sm text-[#F5F5F7] placeholder-[#8A8A9E] focus:border-[#7C5CFF]/60 outline-none transition-colors";

const AuthModal = ({ mode: initialMode, onClose, defaultRole }) => {
  const { login, register, verifyOTP } = useAuth();
  const [mode, setMode] = useState(initialMode); // "login" | "signup" | "phone" | "otp" | "forgot"
  const [showPass, setShowPass] = useState(false);
  const [role, setRole] = useState(defaultRole || "participant");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [forgotEmail, setForgotEmail] = useState("");

  const handleChange = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (form.password !== form.confirmPassword) {
          toast.error("Passwords do not match."); return;
        }
        await register({ name: form.name, email: form.email, password: form.password, role });
      } else {
        await login(form.email, form.password);
      }
      onClose();
    } catch (err) {
      toast.error(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone.match(/^\+?[6-9]\d{9}$/)) {
      toast.error("Enter a valid 10-digit phone number.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await authAPI.sendOTP(phone);
      setOtpSent(true);
      toast.success("OTP sent!");
      if (data.devOtp) toast(`Dev OTP: ${data.devOtp}`, { icon: "🔑" });
    } catch (err) {
      toast.error(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyOTP(phone, otp, form.name, role);
      onClose();
    } catch (err) {
      toast.error(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(forgotEmail);
      toast.success("Reset link sent to your email!");
      setMode("login");
    } catch (err) {
      toast.error(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A0A0F]/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl border border-[#1F1F2E] bg-[#13131C]/95 backdrop-blur-xl p-8"
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-[#8A8A9E] hover:text-[#F5F5F7]">
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C5CFF] to-[#2DD4BF] flex items-center justify-center">
            <Sparkles size={16} className="text-[#0A0A0F]" />
          </div>
          <span className="font-display text-lg text-[#F5F5F7]">EventSphere</span>
        </div>

        {/* ===================== FORGOT PASSWORD ===================== */}
        {mode === "forgot" && (
          <>
            <h3 className="font-display text-2xl text-[#F5F5F7] mb-1">Reset Password</h3>
            <p className="text-sm text-[#8A8A9E] mb-6">Enter your email to receive a reset link.</p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                className={inputClass}
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-full text-sm font-semibold text-[#0A0A0F] disabled:opacity-70"
                style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <button type="button" onClick={() => setMode("login")} className="w-full text-center text-xs text-[#8A8A9E] hover:text-[#F5F5F7]">
                Back to Login
              </button>
            </form>
          </>
        )}

        {/* ===================== PHONE OTP ===================== */}
        {(mode === "phone") && (
          <>
            <h3 className="font-display text-2xl text-[#F5F5F7] mb-1">Phone Sign In</h3>
            <p className="text-sm text-[#8A8A9E] mb-6">Enter your number to receive an OTP.</p>
            <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-3">
              {!otpSent ? (
                <>
                  {role === "signup" && (
                    <input
                      placeholder="Full Name"
                      className={inputClass}
                      value={form.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                    />
                  )}
                  <input
                    placeholder="+91 9876543210"
                    className={inputClass}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                  <div>
                    <div className="text-xs text-[#8A8A9E] mb-2 font-mono uppercase tracking-widest">Role</div>
                    <div className="grid grid-cols-2 gap-2">
                      {["participant", "organizer"].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRole(r)}
                          className={`py-2 rounded-xl border text-xs font-medium capitalize transition-colors ${
                            role === r ? "border-[#7C5CFF] bg-[#7C5CFF]/10 text-[#F5F5F7]" : "border-[#2A2A3A] text-[#8A8A9E]"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full text-sm font-semibold text-[#0A0A0F] disabled:opacity-70"
                    style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </>
              ) : (
                <>
                  <div className="text-sm text-[#8A8A9E]">OTP sent to <span className="text-[#F5F5F7]">{phone}</span></div>
                  <input
                    placeholder="Enter 6-digit OTP"
                    className={inputClass}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-full text-sm font-semibold text-[#0A0A0F] disabled:opacity-70"
                    style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                  <button type="button" onClick={() => setOtpSent(false)} className="w-full text-center text-xs text-[#8A8A9E]">
                    Change Number
                  </button>
                </>
              )}
              <button type="button" onClick={() => setMode("login")} className="w-full text-center text-xs text-[#8A8A9E] hover:text-[#F5F5F7]">
                Back to Login
              </button>
            </form>
          </>
        )}

        {/* ===================== LOGIN / SIGNUP ===================== */}
        {(mode === "login" || mode === "signup") && (
          <>
            <h3 className="font-display text-2xl text-[#F5F5F7] mb-1">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h3>
            <p className="text-sm text-[#8A8A9E] mb-6">
              {mode === "signup" ? "Join the season — it takes a minute." : "Log in to manage your events."}
            </p>

            {/* Social login */}
            <div className="grid grid-cols-1 gap-3 mb-5">
              <button
                onClick={() => authAPI.googleLogin()}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#2A2A3A] text-sm text-[#F5F5F7] hover:bg-[#1F1F2E] transition-colors"
              >
                <Globe size={15} /> Continue with Google
              </button>
              <button
                onClick={() => setMode("phone")}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[#2A2A3A] text-sm text-[#F5F5F7] hover:bg-[#1F1F2E] transition-colors"
              >
                <Phone size={15} /> Continue with Phone OTP
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-[#2A2A3A]" />
              <span className="text-xs text-[#8A8A9E] font-mono">or</span>
              <div className="h-px flex-1 bg-[#2A2A3A]" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === "signup" && (
                <input
                  placeholder="Full Name"
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                className={inputClass}
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                required
              />
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  className={`${inputClass} pr-10`}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8A9E]"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {mode === "signup" && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className={inputClass}
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  required
                />
              )}

              {/* Role selector (signup only) */}
              {mode === "signup" && (
                <div>
                  <div className="text-xs text-[#8A8A9E] mb-2 font-mono uppercase tracking-widest">Role</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[["participant", "Participant"], ["organizer", "Organizer"]].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRole(val)}
                        className={`py-2 rounded-xl border text-xs font-medium transition-colors ${
                          role === val ? "border-[#7C5CFF] bg-[#7C5CFF]/10 text-[#F5F5F7]" : "border-[#2A2A3A] text-[#8A8A9E] hover:text-[#F5F5F7]"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "login" && (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-xs text-[#8A8A9E] hover:text-[#F5F5F7]"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-[#0A0A0F] overflow-hidden disabled:opacity-70"
                style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-[#0A0A0F] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>{mode === "signup" ? "Create Account" : "Log In"} <ArrowRight size={16} /></>
                  )}
                </span>
              </button>
            </form>

            <div className="text-center text-xs text-[#8A8A9E] mt-5">
              {mode === "signup" ? (
                <>Already have an account?{" "}
                  <button onClick={() => setMode("login")} className="text-[#7C5CFF] hover:underline">Log in</button>
                </>
              ) : (
                <>New to EventSphere?{" "}
                  <button onClick={() => setMode("signup")} className="text-[#7C5CFF] hover:underline">Sign up</button>
                </>
              )}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AuthModal;
