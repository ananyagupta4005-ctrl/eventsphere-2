import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authAPI } from "../api";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("es_token"));

  const saveAuth = useCallback((token, user) => {
    localStorage.setItem("es_token", token);
    localStorage.setItem("es_user", JSON.stringify(user));
    setToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("es_token");
    localStorage.removeItem("es_user");
    setToken(null);
    setUser(null);
    toast.success("Logged out successfully.");
  }, []);

  // Verify token on mount / restore session
  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem("es_token");
      if (!storedToken) { setLoading(false); return; }
      try {
        const { data } = await authAPI.getMe();
        setUser(data.user);
      } catch {
        localStorage.removeItem("es_token");
        localStorage.removeItem("es_user");
        setToken(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackToken = params.get("token");
    const callbackRole = params.get("role");
    if (callbackToken && window.location.pathname.includes("/auth/callback")) {
      authAPI.getMe()
        .then(({ data }) => {
          saveAuth(callbackToken, data.user);
          window.history.replaceState({}, "", `/${callbackRole}-dashboard`);
        })
        .catch(() => {
          toast.error("Google sign-in failed.");
        });
    }
  }, [saveAuth]);

  const register = async (formData) => {
    const { data } = await authAPI.register(formData);
    saveAuth(data.token, data.user);
    toast.success("Account created! Please verify your email.");
    return data;
  };

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    saveAuth(data.token, data.user);
    toast.success(`Welcome back, ${data.user.name}!`);
    return data;
  };

  const verifyOTP = async (phone, otp, name, role) => {
    const { data } = await authAPI.verifyOTP({ phone, otp, name, role });
    saveAuth(data.token, data.user);
    toast.success("Phone verified!");
    return data;
  };

  const isAuthenticated = !!user && !!token;
  const isAdmin = user?.role === "admin";
  const isOrganizer = user?.role === "organizer";
  const isParticipant = user?.role === "participant";

  return (
    <AuthContext.Provider value={{
      user, token, loading, isAuthenticated,
      isAdmin, isOrganizer, isParticipant,
      login, register, logout, verifyOTP, saveAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
