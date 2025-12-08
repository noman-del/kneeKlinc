import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Stethoscope, UserCircle2, CalendarDays } from "lucide-react";

type AdminStats = {
  totalUsers: number;
  totalDoctors: number;
  totalPatients: number;
  totalAdmins: number;
  totalAppointments: number;
  appointmentsByStatus: Record<string, number>;
};

type AdminUser = {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userType: "doctor" | "patient" | "admin";
  isEmailVerified: boolean;
  isSuspended?: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

type AdminDoctor = any;
type AdminPatient = any;
type AdminAppointment = any;

function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("auth_token");
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.headers || {}),
    },
  });
}

function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"overview" | "doctors" | "patients" | "appointments">("overview");
  const [userRoleFilter, setUserRoleFilter] = useState<"all" | "doctor" | "patient" | "admin" | "suspended">("all");

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to load admin stats");
      return res.json();
    },
  });

  const { data: usersData, isLoading: usersLoading } = useQuery<{ users: AdminUser[] }>({
    queryKey: ["/api/admin/users", userRoleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (userRoleFilter === "doctor" || userRoleFilter === "patient" || userRoleFilter === "admin") {
        params.set("role", userRoleFilter);
      }
      if (userRoleFilter === "suspended") {
        params.set("suspended", "true");
      }
      const res = await fetchWithAuth(`/api/admin/users${params.toString() ? `?${params.toString()}` : ""}`);
      if (!res.ok) throw new Error("Failed to load users");
      return res.json();
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "suspend" | "unsuspend" }) => {
      const res = await fetchWithAuth(`/api/admin/users/${id}/${action}`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/doctors"] });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchWithAuth(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/doctors"] });
    },
  });

  const { data: doctorsData } = useQuery<{ doctors: AdminDoctor[] }>({
    queryKey: ["/api/admin/doctors"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/admin/doctors");
      if (!res.ok) throw new Error("Failed to load doctors");
      return res.json();
    },
  });

  const verifyDoctorMutation = useMutation({
    mutationFn: async ({ id, isVerified }: { id: string; isVerified: boolean }) => {
      const res = await fetchWithAuth(`/api/admin/doctors/${id}/verify`, {
        method: "POST",
        body: JSON.stringify({ isVerified }),
      });
      if (!res.ok) throw new Error("Failed to update doctor");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/doctors"] });
    },
  });

  const { data: patientsData } = useQuery<{ patients: AdminPatient[] }>({
    queryKey: ["/api/admin/patients"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/admin/patients");
      if (!res.ok) throw new Error("Failed to load patients");
      return res.json();
    },
  });

  const { data: appointmentsData } = useQuery<{ appointments: AdminAppointment[] }>({
    queryKey: ["/api/admin/appointments"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/admin/appointments");
      if (!res.ok) throw new Error("Failed to load appointments");
      return res.json();
    },
  });

  const updateAppointmentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetchWithAuth(`/api/admin/appointments/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update appointment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/appointments"] });
    },
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950/95">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold tracking-wider text-emerald-400 uppercase mb-1">Admin Dashboard</p>
          <h1 className="text-3xl font-bold text-white mb-1">Platform Operations</h1>
          <p className="text-sm text-slate-300">
            Signed in as <span className="font-semibold">{user?.firstName || "System"}</span>. Use this console to monitor key metrics and manage users, doctors, patients and appointments across the platform.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            { id: "overview", label: "Overview" },
            { id: "doctors", label: "Doctors" },
            { id: "patients", label: "Patients" },
            { id: "appointments", label: "Appointments" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all border ${activeTab === tab.id ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/70 shadow-[0_0_0_1px_rgba(16,185,129,0.3)]" : "bg-slate-900/60 text-slate-300 border-slate-700 hover:border-emerald-400/70 hover:text-emerald-200"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <OverviewCard title="Total Users" value={stats?.totalUsers ?? 0} icon={Users} accent="from-emerald-500/20 to-cyan-500/20" />
              <OverviewCard title="Doctors" value={stats?.totalDoctors ?? 0} icon={Stethoscope} accent="from-sky-500/20 to-blue-500/20" />
              <OverviewCard title="Patients" value={stats?.totalPatients ?? 0} icon={UserCircle2} accent="from-violet-500/20 to-fuchsia-500/20" />
              <OverviewCard title="Appointments" value={stats?.totalAppointments ?? 0} icon={CalendarDays} accent="from-amber-500/20 to-orange-500/20" />
            </div>

            {/* Appointments by status quick view */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold tracking-wide text-slate-300 uppercase">Appointments by status</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(stats?.appointmentsByStatus || {}).map(([status, count]) => (
                  <span key={status} className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-slate-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span className="capitalize">{status}</span>
                    <span className="text-slate-400">· {count}</span>
                  </span>
                ))}
                {(!stats || !Object.keys(stats.appointmentsByStatus || {}).length) && <span className="text-slate-500 text-xs">No appointment data yet.</span>}
              </div>
            </div>
          </div>
        )}

        {/* Doctors */}
        {activeTab === "doctors" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-2">Doctors</h2>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg shadow-black/40">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="px-4 py-2">Doctor</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Specialization</th>
                    <th className="px-4 py-2">Hospital</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {doctorsData?.doctors.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-center text-slate-400">
                        No doctors found.
                      </td>
                    </tr>
                  )}
                  {doctorsData?.doctors.map((d: any) => {
                    const linkedUser = d.userId as AdminUser | undefined;
                    const userId = linkedUser?._id;
                    return (
                      <tr key={d._id} className="hover:bg-slate-800/60">
                        <td className="px-4 py-2 text-slate-100">{`${d.title || ""} ${d.firstName || ""} ${d.lastName || ""}`.trim()}</td>
                        <td className="px-4 py-2 text-slate-300">{d.email}</td>
                        <td className="px-4 py-2 text-slate-300">{d.primarySpecialization}</td>
                        <td className="px-4 py-2 text-slate-400">{d.hospitalName || "-"}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${linkedUser?.isSuspended ? "bg-red-500/10 text-red-300 border border-red-500/40" : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"}`}>{linkedUser?.isSuspended ? "Suspended" : "Active"}</span>
                        </td>
                        <td className="px-4 py-2">
                          {userId && (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => suspendMutation.mutate({ id: userId, action: linkedUser?.isSuspended ? "unsuspend" : "suspend" })} className={`px-3 py-1 rounded-full text-xs border ${linkedUser?.isSuspended ? "border-emerald-400 text-emerald-300 hover:bg-emerald-500/10" : "border-yellow-400 text-yellow-300 hover:bg-yellow-500/10"}`}>
                                {linkedUser?.isSuspended ? "Unsuspend" : "Suspend"}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Delete this doctor user account? This cannot be undone.")) {
                                    deleteUserMutation.mutate(userId);
                                  }
                                }}
                                className="px-3 py-1 rounded-full text-xs border border-red-500 text-red-300 hover:bg-red-500/10"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Patients */}
        {activeTab === "patients" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-2">Patients</h2>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg shadow-black/40">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="px-4 py-2">Patient</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Created</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {patientsData?.patients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-center text-slate-400">
                        No patients found.
                      </td>
                    </tr>
                  )}
                  {patientsData?.patients.map((p: AdminUser) => (
                    <tr key={p._id} className="hover:bg-slate-800/60">
                      <td className="px-4 py-2 text-slate-100">{p.firstName || p.lastName ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : p.email}</td>
                      <td className="px-4 py-2 text-slate-300">{p.email}</td>
                      <td className="px-4 py-2 text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.isSuspended ? "bg-red-500/10 text-red-300 border border-red-500/40" : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"}`}>{p.isSuspended ? "Suspended" : "Active"}</span>
                      </td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <button onClick={() => suspendMutation.mutate({ id: p._id, action: p.isSuspended ? "unsuspend" : "suspend" })} className={`px-3 py-1 rounded-full text-xs border ${p.isSuspended ? "border-emerald-400 text-emerald-300 hover:bg-emerald-500/10" : "border-yellow-400 text-yellow-300 hover:bg-yellow-500/10"}`}>
                          {p.isSuspended ? "Unsuspend" : "Suspend"}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Delete this patient user account? This cannot be undone.")) {
                              deleteUserMutation.mutate(p._id);
                            }
                          }}
                          className="px-3 py-1 rounded-full text-xs border border-red-500 text-red-300 hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Appointments */}
        {activeTab === "appointments" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-2">Appointments</h2>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-lg shadow-black/40">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-800 text-slate-300">
                  <tr>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Time</th>
                    <th className="px-4 py-2">Doctor</th>
                    <th className="px-4 py-2">Patient</th>
                    <th className="px-4 py-2">Type</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {appointmentsData?.appointments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-center text-slate-400">
                        No appointments found.
                      </td>
                    </tr>
                  )}
                  {appointmentsData?.appointments.map((a: any) => {
                    const patientUser = a.patientId?.userId as AdminUser | undefined;
                    const patientName = patientUser?.firstName || patientUser?.lastName ? `${patientUser.firstName || ""} ${patientUser.lastName || ""}`.trim() : patientUser?.email || a.patientId?._id;
                    const appointmentDate = new Date(a.appointmentDate);
                    const now = new Date();
                    const isPastOrStarted = appointmentDate < now || a.status === "completed" || a.status === "cancelled";

                    return (
                      <tr key={a._id} className="hover:bg-slate-800/60">
                        <td className="px-4 py-2 text-slate-100">{appointmentDate.toLocaleDateString()}</td>
                        <td className="px-4 py-2 text-slate-300">{a.appointmentTime}</td>
                        <td className="px-4 py-2 text-slate-300">{a.doctorId?.firstName ? `${a.doctorId.firstName} ${a.doctorId.lastName || ""}` : a.doctorId?._id}</td>
                        <td className="px-4 py-2 text-slate-300">{patientName}</td>
                        <td className="px-4 py-2 text-slate-300 capitalize">{a.type}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${a.status === "cancelled" ? "bg-red-500/10 text-red-300 border border-red-500/40" : a.status === "completed" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40" : "bg-blue-500/10 text-blue-300 border border-blue-500/40"}`}>{a.status}</span>
                        </td>
                        <td className="px-4 py-2 text-right space-x-2">
                          {/* Admin can only cancel future, not-started appointments */}
                          {!isPastOrStarted && (
                            <button onClick={() => updateAppointmentStatusMutation.mutate({ id: a._id, status: "cancelled" })} className="px-3 py-1 rounded-full text-xs border border-red-500 text-red-300 hover:bg-red-500/10">
                              Cancel
                            </button>
                          )}
                          {/* Do not allow completing a cancelled appointment */}
                          {a.status !== "completed" && a.status !== "cancelled" && (
                            <button onClick={() => updateAppointmentStatusMutation.mutate({ id: a._id, status: "completed" })} className="px-3 py-1 rounded-full text-xs border border-emerald-500 text-emerald-300 hover:bg-emerald-500/10">
                              Complete
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewCard({ title, value, icon: Icon, accent }: { title: string; value: number; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col gap-3 shadow-lg shadow-black/40">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs uppercase tracking-wide text-slate-400">{title}</span>
        <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${accent} flex items-center justify-center text-emerald-200`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <span className="text-3xl font-semibold text-white leading-tight">{value}</span>
    </div>
  );
}

export default Admin;
