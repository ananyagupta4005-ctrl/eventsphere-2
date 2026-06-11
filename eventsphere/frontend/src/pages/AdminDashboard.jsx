import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Calendar, Award, BarChart2, Trash2, Edit2,
  Shield, CheckCircle2, XCircle, Search, RefreshCw,
} from "lucide-react";
import { userAPI, eventsAPI, registrationAPI, certificateAPI } from "../../api";
import toast from "react-hot-toast";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div whileHover={{ y: -4 }} className="rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}1A` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <span className="text-sm text-[#8A8A9E]">{label}</span>
    </div>
    <div className="font-display text-3xl text-[#F5F5F7]">{value ?? "—"}</div>
  </motion.div>
);

const roleColor = { admin: "#FF6B5B", organizer: "#7C5CFF", participant: "#2DD4BF" };
const roleBg = { admin: "#FF6B5B14", organizer: "#7C5CFF14", participant: "#2DD4BF14" };

const AdminDashboard = () => {
  const [tab, setTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [editUser, setEditUser] = useState(null);

  const fetchOverview = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        userAPI.getDashboardStats(),
        userAPI.getAnalytics(),
      ]);
      setStats(statsRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch { toast.error("Failed to load stats."); }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await userAPI.getAll({ page: userPage, limit: 15, role: roleFilter, search });
      setUsers(data.data);
      setUserTotal(data.pagination.total);
    } catch { toast.error("Failed to load users."); }
  };

  const fetchEvents = async () => {
    try {
      const { data } = await eventsAPI.getAll({ limit: 50 });
      setEvents(data.data);
    } catch { toast.error("Failed to load events."); }
  };

  const fetchCertificates = async () => {
    try {
      const { data } = await certificateAPI.getAll({ limit: 50 });
      setCertificates(data.data);
    } catch { toast.error("Failed to load certificates."); }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchOverview();
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (tab === "users") fetchUsers();
    if (tab === "events") fetchEvents();
    if (tab === "certificates") fetchCertificates();
  }, [tab, userPage, roleFilter]);

  const handleSearchUsers = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Delete this user? This cannot be undone.")) return;
    try {
      await userAPI.delete(id);
      setUsers(prev => prev.filter(u => u._id !== id));
      toast.success("User deleted.");
    } catch (err) { toast.error(err.message); }
  };

  const handleUpdateUserRole = async (id, role) => {
    try {
      await userAPI.update(id, { role });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, role } : u));
      toast.success("Role updated.");
      setEditUser(null);
    } catch (err) { toast.error(err.message); }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await userAPI.update(id, { isActive: !isActive });
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !isActive } : u));
      toast.success(`User ${!isActive ? "activated" : "deactivated"}.`);
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Delete this event?")) return;
    try {
      await eventsAPI.delete(id);
      setEvents(prev => prev.filter(e => e._id !== id));
      toast.success("Event deleted.");
    } catch (err) { toast.error(err.message); }
  };

  const handleRevokeCert = async (id) => {
    if (!window.confirm("Revoke this certificate?")) return;
    try {
      await certificateAPI.revoke(id);
      setCertificates(prev => prev.map(c => c._id === id ? { ...c, isValid: false } : c));
      toast.success("Certificate revoked.");
    } catch (err) { toast.error(err.message); }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "users", label: "Users", icon: Users },
    { id: "events", label: "Events", icon: Calendar },
    { id: "certificates", label: "Certificates", icon: Award },
  ];

  if (loading) return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7C5CFF] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 pb-16 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#FF6B5B]/10 flex items-center justify-center">
            <Shield size={20} className="text-[#FF6B5B]" />
          </div>
          <div>
            <h1 className="font-display text-3xl text-[#F5F5F7]">Admin Dashboard</h1>
            <p className="text-sm text-[#8A8A9E]">Full platform control and analytics.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-2xl border border-[#1F1F2E] bg-[#13131C] w-fit mb-8 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === id ? "bg-[#7C5CFF] text-white" : "text-[#8A8A9E] hover:text-[#F5F5F7]"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ─── OVERVIEW ─── */}
        {tab === "overview" && stats && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <StatCard icon={Users} label="Total Users" value={stats.users} color="#7C5CFF" />
              <StatCard icon={Calendar} label="Total Events" value={stats.events} color="#2DD4BF" />
              <StatCard icon={Users} label="Registrations" value={stats.registrations} color="#FF6B5B" />
              <StatCard icon={Award} label="Certificates" value={stats.certificates} color="#7C5CFF" />
            </div>

            {analytics && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Users by Role */}
                <div className="rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-6">
                  <h3 className="font-display text-lg text-[#F5F5F7] mb-4">Users by Role</h3>
                  <div className="space-y-3">
                    {analytics.usersByRole.map(({ _id, count }) => {
                      const pct = Math.round((count / (stats.users || 1)) * 100);
                      return (
                        <div key={_id}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="capitalize font-medium" style={{ color: roleColor[_id] || "#F5F5F7" }}>{_id}</span>
                            <span className="text-[#8A8A9E] font-mono">{count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#1F1F2E] overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: roleColor[_id] || "#7C5CFF" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Events by Type */}
                <div className="rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-6">
                  <h3 className="font-display text-lg text-[#F5F5F7] mb-4">Events by Type</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {analytics.eventsByType.map(({ _id, count }) => (
                      <div key={_id} className="flex items-center justify-between py-1.5 border-b border-[#1F1F2E] last:border-0">
                        <span className="text-sm text-[#F5F5F7]">{_id}</span>
                        <span className="text-xs font-mono text-[#8A8A9E] bg-[#1F1F2E] px-2 py-0.5 rounded-full">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Registrations by Month */}
                <div className="rounded-2xl border border-[#1F1F2E] bg-[#13131C] p-6 md:col-span-2">
                  <h3 className="font-display text-lg text-[#F5F5F7] mb-4">Registrations — Last 12 Months</h3>
                  <div className="flex items-end gap-2 h-32">
                    {analytics.regsByMonth.slice().reverse().map(({ _id, count }) => {
                      const maxCount = Math.max(...analytics.regsByMonth.map(r => r.count), 1);
                      const pct = (count / maxCount) * 100;
                      return (
                        <div key={_id} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[9px] text-[#8A8A9E] font-mono">{count}</span>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${pct}%` }}
                            className="w-full rounded-t-md"
                            style={{ background: "linear-gradient(180deg,#7C5CFF,#2DD4BF)", minHeight: 4 }}
                          />
                          <span className="text-[8px] text-[#8A8A9E] font-mono">{_id.slice(5)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── USERS ─── */}
        {tab === "users" && (
          <div>
            <div className="flex flex-wrap gap-3 mb-6">
              <form onSubmit={handleSearchUsers} className="flex gap-2 flex-1 min-w-0">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8A9E]" />
                  <input
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#13131C] border border-[#1F1F2E] text-sm text-[#F5F5F7] placeholder-[#8A8A9E] focus:border-[#7C5CFF]/60 outline-none"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <button type="submit" className="px-4 py-2.5 rounded-xl bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 text-[#7C5CFF] text-sm hover:bg-[#7C5CFF]/30 transition-colors">
                  Search
                </button>
              </form>
              <select
                className="px-4 py-2.5 rounded-xl bg-[#13131C] border border-[#1F1F2E] text-sm text-[#F5F5F7] outline-none"
                value={roleFilter}
                onChange={e => { setRoleFilter(e.target.value); setUserPage(1); }}
              >
                <option value="">All Roles</option>
                <option value="participant">Participant</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={fetchUsers} className="p-2.5 rounded-xl border border-[#1F1F2E] text-[#8A8A9E] hover:text-[#F5F5F7]">
                <RefreshCw size={15} />
              </button>
            </div>

            <div className="text-xs text-[#8A8A9E] font-mono mb-3">{userTotal} total users</div>

            <div className="rounded-2xl border border-[#1F1F2E] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1F1F2E] bg-[#13131C]">
                      {["Name", "Email", "Role", "College", "Joined", "Status", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-mono text-[#8A8A9E] uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-[#1F1F2E] hover:bg-[#13131C]/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {u.profileImage
                              ? <img src={u.profileImage} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                              : <div className="w-7 h-7 rounded-full bg-[#7C5CFF]/20 flex items-center justify-center text-[#7C5CFF] text-xs font-bold">{u.name[0]}</div>
                            }
                            <span className="text-[#F5F5F7] font-medium whitespace-nowrap">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#8A8A9E] font-mono text-xs">{u.email}</td>
                        <td className="px-4 py-3">
                          {editUser === u._id ? (
                            <select
                              defaultValue={u.role}
                              autoFocus
                              onChange={e => handleUpdateUserRole(u._id, e.target.value)}
                              onBlur={() => setEditUser(null)}
                              className="px-2 py-1 rounded-lg bg-[#0A0A0F] border border-[#7C5CFF]/50 text-xs text-[#F5F5F7] outline-none"
                            >
                              <option value="participant">Participant</option>
                              <option value="organizer">Organizer</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span
                              className="text-[10px] font-mono px-2 py-0.5 rounded-full border capitalize cursor-pointer hover:opacity-80"
                              style={{ color: roleColor[u.role], borderColor: `${roleColor[u.role]}40`, background: roleBg[u.role] }}
                              onClick={() => setEditUser(u._id)}
                              title="Click to change role"
                            >
                              {u.role}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#8A8A9E] text-xs">{u.college || "—"}</td>
                        <td className="px-4 py-3 text-[#8A8A9E] font-mono text-xs whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleActive(u._id, u.isActive)}
                            className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                              u.isActive
                                ? "text-[#2DD4BF] border-[#2DD4BF]/40 bg-[#2DD4BF]/10"
                                : "text-[#FF6B5B] border-[#FF6B5B]/40 bg-[#FF6B5B]/10"
                            }`}
                          >
                            {u.isActive ? <><CheckCircle2 size={10} /> Active</> : <><XCircle size={10} /> Inactive</>}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-1.5 rounded-lg text-[#8A8A9E] hover:text-[#FF6B5B] hover:bg-[#FF6B5B]/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-[#8A8A9E] font-mono">Page {userPage}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  disabled={userPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-[#1F1F2E] text-xs text-[#8A8A9E] hover:text-[#F5F5F7] disabled:opacity-40"
                >Prev</button>
                <button
                  onClick={() => setUserPage(p => p + 1)}
                  disabled={users.length < 15}
                  className="px-3 py-1.5 rounded-xl border border-[#1F1F2E] text-xs text-[#8A8A9E] hover:text-[#F5F5F7] disabled:opacity-40"
                >Next</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── EVENTS ─── */}
        {tab === "events" && (
          <div className="rounded-2xl border border-[#1F1F2E] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1F1F2E] bg-[#13131C]">
                    {["Event", "Organizer", "Type", "Status", "Date", "Seats", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-mono text-[#8A8A9E] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {events.map(ev => (
                    <tr key={ev._id} className="border-b border-[#1F1F2E] hover:bg-[#13131C]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#F5F5F7] max-w-[180px] truncate">{ev.name}</div>
                        <div className="text-[10px] text-[#8A8A9E] font-mono">{ev.college || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-[#8A8A9E] text-xs">{ev.organizer?.name || "—"}</td>
                      <td className="px-4 py-3 text-[#8A8A9E] text-xs">{ev.type}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          ev.status === "published" ? "text-[#2DD4BF] border-[#2DD4BF]/40 bg-[#2DD4BF]/10" :
                          ev.status === "cancelled" ? "text-[#FF6B5B] border-[#FF6B5B]/40 bg-[#FF6B5B]/10" :
                          "text-[#8A8A9E] border-[#8A8A9E]/40 bg-[#8A8A9E]/10"
                        }`}>{ev.status}</span>
                      </td>
                      <td className="px-4 py-3 text-[#8A8A9E] font-mono text-xs whitespace-nowrap">
                        {new Date(ev.startDate).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-[#8A8A9E] font-mono text-xs">
                        {ev.seatsBooked}/{ev.seatsAvailable}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => handleDeleteEvent(ev._id)} className="p-1.5 rounded-lg text-[#8A8A9E] hover:text-[#FF6B5B] hover:bg-[#FF6B5B]/10 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── CERTIFICATES ─── */}
        {tab === "certificates" && (
          <div className="rounded-2xl border border-[#1F1F2E] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1F1F2E] bg-[#13131C]">
                    {["Certificate ID", "Recipient", "Event", "Type", "Issued", "Valid", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-mono text-[#8A8A9E] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {certificates.map(c => (
                    <tr key={c._id} className="border-b border-[#1F1F2E] hover:bg-[#13131C]/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-[#7C5CFF]">{c.certificateId}</td>
                      <td className="px-4 py-3">
                        <div className="text-[#F5F5F7] text-xs font-medium">{c.recipientName}</div>
                        <div className="text-[#8A8A9E] text-[10px]">{c.participant?.email || "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-[#8A8A9E] text-xs max-w-[160px] truncate">{c.eventName}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#7C5CFF]/40 bg-[#7C5CFF]/10 text-[#7C5CFF]">{c.type}</span>
                      </td>
                      <td className="px-4 py-3 text-[#8A8A9E] font-mono text-xs whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3">
                        {c.isValid
                          ? <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#2DD4BF]/40 bg-[#2DD4BF]/10 text-[#2DD4BF]">Valid</span>
                          : <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#FF6B5B]/40 bg-[#FF6B5B]/10 text-[#FF6B5B]">Revoked</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        {c.isValid && (
                          <button onClick={() => handleRevokeCert(c._id)} className="p-1.5 rounded-lg text-[#8A8A9E] hover:text-[#FF6B5B] hover:bg-[#FF6B5B]/10 transition-colors" title="Revoke">
                            <XCircle size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
