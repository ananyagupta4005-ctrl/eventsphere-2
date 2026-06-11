import axios from "axios";
import toast from "react-hot-toast";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("es_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || "Something went wrong.";
    if (error.response?.status === 401) {
      localStorage.removeItem("es_token");
      localStorage.removeItem("es_user");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    } else if (error.response?.status === 403) {
      toast.error("You don't have permission for this action.");
    } else if (error.response?.status >= 500) {
      toast.error("Server error. Please try again later.");
    }
    return Promise.reject({ ...error, message });
  }
);

// =================== Auth APIs ===================
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
  sendOTP: (phone) => api.post("/auth/send-otp", { phone }),
  verifyOTP: (data) => api.post("/auth/verify-otp", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.post(`/auth/verify-email/${token}`),
  changePassword: (data) => api.put("/auth/change-password", data),
  googleLogin: () => { window.location.href = `${API_URL}/auth/google`; },
};

// =================== Events APIs ===================
export const eventsAPI = {
  getAll: (params) => api.get("/events", { params }),
  getById: (id) => api.get(`/events/${id}`),
  getByCategory: (category, params) => api.get(`/events/category/${category}`, { params }),
  getMyEvents: () => api.get("/events/organizer/my-events"),
  getStats: () => api.get("/events/stats/overview"),
  create: (formData) => api.post("/events", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  update: (id, formData) => api.put(`/events/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } }),
  delete: (id) => api.delete(`/events/${id}`),
  publish: (id) => api.put(`/events/${id}/publish`),
};

// =================== Registration APIs ===================
export const registrationAPI = {
  register: (formData) => api.post("/registrations", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getMyRegistrations: () => api.get("/registrations/my"),
  getEventRegistrations: (eventId) => api.get(`/registrations/event/${eventId}`),
  getById: (id) => api.get(`/registrations/${id}`),
  cancel: (id) => api.put(`/registrations/${id}/cancel`),
  markAttendance: (id, attended) => api.put(`/registrations/${id}/attendance`, { attended }),
  getAll: (params) => api.get("/registrations/all", { params }),
};

// =================== Certificate APIs ===================
export const certificateAPI = {
  generate: (data) => api.post("/certificates/generate", data),
  getMyCertificates: () => api.get("/certificates/my"),
  getEventCertificates: (eventId) => api.get(`/certificates/event/${eventId}`),
  download: (id) => api.get(`/certificates/${id}/download`, { responseType: "blob" }),
  verify: (certId) => api.get(`/certificates/verify/${certId}`),
  revoke: (id) => api.put(`/certificates/${id}/revoke`),
  getAll: (params) => api.get("/certificates/all", { params }),
};

// =================== User APIs ===================
export const userAPI = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (formData) => api.put("/users/profile", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  getDashboardStats: () => api.get("/users/dashboard-stats"),
  getAll: (params) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getAnalytics: () => api.get("/users/analytics"),
};

export default api;
