import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, PublicOnlyRoute } from "./components/layout/ProtectedRoute";
import Navbar from "./components/layout/Navbar";

// Pages
import HomePage from "./pages/HomePage";
import EventsPage from "./pages/EventsPage";
import CategoryPage from "./pages/CategoryPage";
import ParticipantDashboard from "./pages/ParticipantDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProfilePage from "./pages/ProfilePage";
import VerifyCertPage from "./pages/VerifyCertPage";

// Auth callback (Google OAuth redirect)
const AuthCallback = () => {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7C5CFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

// 404
const NotFound = () => (
  <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-4 text-center p-4">
    <div className="font-display text-8xl text-[#7C5CFF] opacity-20">404</div>
    <h1 className="font-display text-3xl text-[#F5F5F7]">Page Not Found</h1>
    <p className="text-[#8A8A9E]">The page you're looking for doesn't exist.</p>
    <a href="/" className="mt-4 px-6 py-3 rounded-full text-sm font-semibold text-[#0A0A0F]" style={{ background: "linear-gradient(135deg,#7C5CFF,#2DD4BF)" }}>
      Go Home
    </a>
  </div>
);

// Layout wrapper (adds navbar to all pages except auth/verify)
const Layout = ({ children, showNav = true }) => (
  <>
    {showNav && <Navbar />}
    {children}
  </>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#13131C",
              color: "#F5F5F7",
              border: "1px solid #1F1F2E",
              borderRadius: "12px",
              fontSize: "13px",
            },
            success: { iconTheme: { primary: "#2DD4BF", secondary: "#0A0A0F" } },
            error: { iconTheme: { primary: "#FF6B5B", secondary: "#0A0A0F" } },
          }}
        />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/events" element={<Layout><EventsPage /></Layout>} />
          <Route path="/category/:category" element={<Layout><CategoryPage /></Layout>} />
          <Route path="/verify/:certId" element={<VerifyCertPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected - any authenticated */}
          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout><ProfilePage /></Layout>
            </ProtectedRoute>
          } />

          {/* Protected - participant */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={["participant"]}>
              <Layout><ParticipantDashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Protected - organizer */}
          <Route path="/organizer" element={
            <ProtectedRoute roles={["organizer", "admin"]}>
              <Layout><OrganizerDashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Protected - admin */}
          <Route path="/admin" element={
            <ProtectedRoute roles={["admin"]}>
              <Layout><AdminDashboard /></Layout>
            </ProtectedRoute>
          } />

          {/* Fallback redirects */}
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
