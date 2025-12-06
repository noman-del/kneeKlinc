import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, Video, MapPin, CheckCircle, XCircle, AlertCircle, MessageCircle } from "lucide-react";

interface Appointment {
  id: string;
  doctorId: any;
  patientId: any;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  type: "in-person" | "virtual";
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  reason?: string;
  notes?: string;
  createdAt: string;
  meetingUrl?: string;
  canJoinVideoVisit?: boolean;
  // Optional meta from API to ensure proper doctor name/details on patient view
  doctorName?: string;
  doctorSpecialization?: string;
  doctorExperience?: string;
  doctorHospital?: string;
  // Patient details for doctor view
  patientUserId?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  patientGender?: string;
  patientAge?: number;
}

export default function Appointments() {
  const [, setLocation] = useLocation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isBooking, setIsBooking] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [newAppointment, setNewAppointment] = useState({
    doctorId: "",
    appointmentDate: "",
    appointmentTime: "",
    type: "virtual" as "in-person" | "virtual",
    reason: "",
  });

  // Get today's date in YYYY-MM-DD format for min date
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // Filter out past time slots for today
  const getFilteredSlots = () => {
    if (!newAppointment.appointmentDate || availableSlots.length === 0) {
      return availableSlots;
    }

    const selectedDate = new Date(newAppointment.appointmentDate);
    const today = new Date();

    // If selected date is not today, return all slots
    if (selectedDate.toDateString() !== today.toDateString()) {
      return availableSlots;
    }

    // Filter out past slots for today
    const currentTime = today.getHours() * 60 + today.getMinutes();

    return availableSlots.filter((slot) => {
      const [time, period] = slot.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      let slotHours = hours;

      if (period === "PM" && hours !== 12) {
        slotHours += 12;
      } else if (period === "AM" && hours === 12) {
        slotHours = 0;
      }

      const slotTime = slotHours * 60 + minutes;
      return slotTime > currentTime;
    });
  };
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedDoctorAvailability, setSelectedDoctorAvailability] = useState<any>(null);

  const [rescheduleState, setRescheduleState] = useState<{
    appointmentId: string | null;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
  }>({ appointmentId: null, appointmentDate: "", appointmentTime: "", reason: "" });

  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);

  // Helpers to get doctor display data with robust fallbacks
  const getDoctorFromList = (apt: Appointment) => {
    const docId = (apt.doctorId && (apt.doctorId as any)._id) || apt.doctorId;
    return doctors.find((d) => d.id === docId);
  };

  const getDoctorTitleName = (apt: Appointment) => {
    if (apt.doctorName && apt.doctorName.trim()) return apt.doctorName;
    const composed = `${apt.doctorId?.title ? apt.doctorId.title + " " : ""}${apt.doctorId?.firstName ?? ""} ${apt.doctorId?.lastName ?? ""}`.trim();
    if (composed) return composed;
    const fromList = getDoctorFromList(apt);
    if (fromList?.name) return fromList.name;
    return "Doctor";
  };

  const getDoctorDetails = (apt: Appointment) => {
    return {
      specialization: apt.doctorSpecialization || apt.doctorId?.primarySpecialization || getDoctorFromList(apt)?.specialization,
      experience: apt.doctorExperience || apt.doctorId?.yearsOfExperience || getDoctorFromList(apt)?.experience,
      hospital: apt.doctorHospital || apt.doctorId?.hospitalName || getDoctorFromList(apt)?.hospital,
    };
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserType(user.userType);
    fetchAppointments();
    if (user.userType === "patient") {
      fetchDoctors();
    }

    // Poll appointments periodically so backend-driven canJoinVideoVisit updates without manual reload
    const interval = setInterval(() => {
      fetchAppointments();
    }, 30000); // every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch available slots when doctor or date changes
  useEffect(() => {
    if (newAppointment.doctorId && newAppointment.appointmentDate) {
      fetchAvailableSlots(newAppointment.doctorId, newAppointment.appointmentDate);
    } else {
      setAvailableSlots([]);
    }
  }, [newAppointment.doctorId, newAppointment.appointmentDate]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/appointments/my-appointments", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const canReschedule = (apt: Appointment) => {
    if (apt.status !== "scheduled" && apt.status !== "confirmed") return false;

    // Compute appointment start from date + time string (frontend time is in "HH:MM AM/PM" format)
    const start = new Date(apt.appointmentDate);
    if (apt.appointmentTime) {
      const [timePart, period] = apt.appointmentTime.split(" ");
      const [hStr, mStr] = timePart.split(":");
      let hours = parseInt(hStr || "0", 10);
      const minutes = parseInt(mStr || "0", 10);
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      start.setHours(hours, minutes, 0, 0);
    }

    const durationMinutes = typeof apt.duration === "number" && !isNaN(apt.duration) ? apt.duration : 30;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const now = new Date();
    // Allow reschedule any time before end
    return end > now;
  };

  const openReschedule = (apt: Appointment) => {
    // Pre-fill with existing values
    const dateStr = new Date(apt.appointmentDate).toISOString().split("T")[0];
    setRescheduleState({
      appointmentId: apt.id,
      appointmentDate: dateStr,
      appointmentTime: "",
      reason: apt.reason || "",
    });

    fetchRescheduleSlots(apt, dateStr);
  };

  const cancelReschedule = () => {
    setRescheduleState({ appointmentId: null, appointmentDate: "", appointmentTime: "", reason: "" });
  };

  const rescheduleAppointment = async () => {
    if (!rescheduleState.appointmentId) return;
    const confirmed = window.confirm("Are you sure you want to reschedule this appointment? The other person will be notified by email.");
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/appointments/${rescheduleState.appointmentId}/reschedule`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentDate: rescheduleState.appointmentDate,
          appointmentTime: rescheduleState.appointmentTime,
          reason: rescheduleState.reason || undefined,
        }),
      });

      cancelReschedule();
      fetchAppointments();
    } catch (error) {
      console.error("Failed to reschedule appointment:", error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/doctors/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    }
  };

  const fetchRescheduleSlots = async (apt: Appointment, date: string) => {
    try {
      const token = localStorage.getItem("token");
      // Determine Doctor document _id like in getDoctorFromList
      const docId = (apt.doctorId && (apt.doctorId as any)._id) || apt.doctorId;
      if (!docId) {
        setRescheduleSlots([]);
        return;
      }

      const response = await fetch(`/api/doctors/${docId}/available-slots?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setRescheduleSlots(data.availableSlots || []);
    } catch (error) {
      console.error("Failed to fetch reschedule slots:", error);
      setRescheduleSlots([]);
    }
  };

  const getFilteredRescheduleSlots = () => {
    if (!rescheduleState.appointmentDate || rescheduleSlots.length === 0) {
      return rescheduleSlots;
    }

    const selectedDate = new Date(rescheduleState.appointmentDate);
    const today = new Date();

    // If selected date is not today, return all slots
    if (selectedDate.toDateString() !== today.toDateString()) {
      return rescheduleSlots;
    }

    // Filter out past slots for today, same logic style as getFilteredSlots
    const currentTime = today.getHours() * 60 + today.getMinutes();

    return rescheduleSlots.filter((slot) => {
      const [time, period] = slot.split(" ");
      const [hoursStr, minutesStr] = time.split(":");
      let hours = parseInt(hoursStr || "0", 10);
      const minutes = parseInt(minutesStr || "0", 10);

      if (period === "PM" && hours !== 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }

      const slotTime = hours * 60 + minutes;
      return slotTime > currentTime;
    });
  };

  // Open message with doctor/patient
  const openMessage = async (apt: Appointment) => {
    try {
      let receiverId: string | null = null;

      if (userType === "patient") {
        // Patient wants to message doctor
        const doctorId = typeof apt.doctorId === "string" ? apt.doctorId : (apt.doctorId as any)?._id;
        if (doctorId) {
          const doctor = doctors.find((d) => d.id === doctorId);
          receiverId = doctor?.userId || null;
        }
      } else {
        // Doctor wants to message patient
        // Use patientUserId from API response (most reliable)
        if (apt.patientUserId) {
          receiverId = apt.patientUserId;
        } else {
          // Fallback: try to get from populated patientId
          if (apt.patientId && typeof apt.patientId === "object" && (apt.patientId as any).userId) {
            receiverId = (apt.patientId as any).userId;
          }
        }
      }

      if (receiverId) {
        console.log("Opening message to userId:", receiverId);
        setLocation(`/messages?to=${receiverId}`);
      } else {
        console.error("Could not determine receiverId for appointment:", apt);
        setLocation("/messages");
      }
    } catch (error) {
      console.error("Error opening message:", error);
      setLocation("/messages");
    }
  };

  const fetchAvailableSlots = async (doctorId: string, date: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/doctors/${doctorId}/available-slots?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setAvailableSlots(data.availableSlots || []);
      setSelectedDoctorAvailability(data.availability || null);
    } catch (error) {
      console.error("Failed to fetch available slots:", error);
      setAvailableSlots([]);
    }
  };

  const bookAppointment = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAppointment),
      });

      if (response.ok) {
        const data = await response.json();
        setIsBooking(false);

        setNewAppointment({
          doctorId: "",
          appointmentDate: "",
          appointmentTime: "",
          type: "virtual",
          reason: "",
        });

        fetchAppointments();
      }
    } catch (error) {
      console.error("Failed to book appointment:", error);
    }
  };

  const updateStatus = async (appointmentId: string, status: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/appointments/${appointmentId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      fetchAppointments();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAppointments();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-900/30 border-emerald-700 text-emerald-300";
      case "completed":
        return "bg-blue-900/30 border-blue-700 text-blue-300";
      case "cancelled":
        return "bg-red-900/30 border-red-700 text-red-300";
      default:
        return "bg-yellow-900/30 border-yellow-700 text-yellow-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Appointments</h1>
            <p className="text-slate-300">Manage your healthcare appointments</p>
          </div>
          {userType === "patient" && (
            <Button onClick={() => setIsBooking(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Calendar className="w-5 h-5 mr-2" />
              Book Appointment
            </Button>
          )}
        </div>

        {isBooking && userType === "patient" && (
          <Card className="bg-slate-800/50 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Book New Appointment</CardTitle>
              {newAppointment.doctorId && doctors.find((d) => d.id === newAppointment.doctorId) && (
                <div className="mt-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600" />
                    <div>
                      <p className="text-white font-semibold">{doctors.find((d) => d.id === newAppointment.doctorId)?.name}</p>
                      <div className="text-xs text-slate-400">
                        <span className="text-indigo-300">{doctors.find((d) => d.id === newAppointment.doctorId)?.specialization}</span>
                        {doctors.find((d) => d.id === newAppointment.doctorId)?.experience && (
                          <>
                            <span className="mx-2 text-slate-600">•</span>
                            <span>{doctors.find((d) => d.id === newAppointment.doctorId)?.experience}</span>
                          </>
                        )}
                        {doctors.find((d) => d.id === newAppointment.doctorId)?.hospital && (
                          <>
                            <span className="mx-2 text-slate-600">•</span>
                            <span>{doctors.find((d) => d.id === newAppointment.doctorId)?.hospital}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Select Doctor</label>
                  <select value={newAppointment.doctorId} onChange={(e) => setNewAppointment({ ...newAppointment, doctorId: e.target.value })} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3">
                    <option value="">Choose a doctor</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} - {doc.specialization} ({doc.experience || "Experienced"})
                      </option>
                    ))}
                  </select>
                  {/* Removed secondary preview to keep details only in header */}
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Appointment Date</label>
                  <Input type="date" min={getTodayDate()} value={newAppointment.appointmentDate} onChange={(e) => setNewAppointment({ ...newAppointment, appointmentDate: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Appointment Time</label>
                  {getFilteredSlots().length > 0 ? (
                    <select value={newAppointment.appointmentTime} onChange={(e) => setNewAppointment({ ...newAppointment, appointmentTime: e.target.value })} className="w-full bg-slate-700 border-slate-600 text-white rounded-lg p-3">
                      <option value="">Select available time</option>
                      {getFilteredSlots().map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-slate-700 border-slate-600 text-slate-400 rounded-lg p-3">{newAppointment.doctorId && newAppointment.appointmentDate ? "No available slots for this date/time" : "Select doctor and date first"}</div>
                  )}
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Appointment Type</label>
                  <div className="w-full bg-slate-700 border-2 border-indigo-500 text-white rounded-lg p-3 flex items-center">
                    <Video className="w-5 h-5 mr-2 text-indigo-400" />
                    <span className="font-medium">Virtual Consultation</span>
                    <span className="ml-auto text-xs text-indigo-300 bg-indigo-900/30 px-2 py-1 rounded">Default</span>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-white text-sm font-medium mb-2 block">Reason for Visit</label>
                  <Input value={newAppointment.reason} onChange={(e) => setNewAppointment({ ...newAppointment, reason: e.target.value })} placeholder="Brief description of your concern" className="bg-slate-700 border-slate-600 text-white" />
                </div>
              </div>
              <div className="flex space-x-4 mt-6">
                <Button onClick={bookAppointment} disabled={!newAppointment.doctorId || !newAppointment.appointmentDate || !newAppointment.appointmentTime} className="bg-indigo-600 hover:bg-indigo-700">
                  Confirm Booking
                </Button>
                <Button onClick={() => setIsBooking(false)} className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <p className="text-slate-400 col-span-full">Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700 col-span-full">
              <CardContent className="text-center py-12">
                <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No appointments scheduled</p>
              </CardContent>
            </Card>
          ) : (
            appointments.map((apt) => (
              <Card key={apt.id} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg">{userType === "patient" ? getDoctorTitleName(apt) : apt.patientName || "Patient Appointment"}</CardTitle>
                    {getStatusIcon(apt.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userType === "patient" &&
                      (() => {
                        const info = getDoctorDetails(apt);
                        return (
                          <div className="text-slate-400 text-sm">
                            {info.specialization && <span className="text-indigo-300">{info.specialization}</span>}
                            {info.experience && (
                              <>
                                <span className="mx-2 text-slate-600">•</span>
                                <span>{info.experience}</span>
                              </>
                            )}
                            {info.hospital && (
                              <>
                                <span className="mx-2 text-slate-600">•</span>
                                <span>{info.hospital}</span>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    {userType === "doctor" &&
                      (() => {
                        return (
                          <div className="text-slate-400 text-sm">
                            <span className="text-emerald-300">{apt.patientName || "Patient"}</span>
                            {apt.patientAge && (
                              <>
                                <span className="mx-2 text-slate-600">•</span>
                                <span>{apt.patientAge} years old</span>
                              </>
                            )}
                            {apt.patientGender && (
                              <>
                                <span className="mx-2 text-slate-600">•</span>
                                <span className="capitalize">{apt.patientGender}</span>
                              </>
                            )}
                            {apt.patientPhone && (
                              <>
                                <span className="mx-2 text-slate-600">•</span>
                                <span>{apt.patientPhone}</span>
                              </>
                            )}
                          </div>
                        );
                      })()}
                    <div className="flex items-center text-slate-300">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(apt.appointmentDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-slate-300">
                      <Clock className="w-4 h-4 mr-2" />
                      {apt.appointmentTime} ({apt.duration} min)
                    </div>
                    <div className="flex items-center text-slate-300">
                      {apt.type === "virtual" ? (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Virtual Consultation
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4 mr-2" />
                          In-Person Visit
                        </>
                      )}
                    </div>
                    {apt.reason && <p className="text-slate-400 text-sm mt-2 italic">Reason: {apt.reason}</p>}
                    <div className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusColor(apt.status)}`}>{apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}</div>
                    {apt.type === "virtual" && apt.status === "confirmed" && apt.meetingUrl && (
                      <Button
                        size="sm"
                        disabled={!apt.canJoinVideoVisit}
                        onClick={() => {
                          if (apt.meetingUrl) {
                            window.open(apt.meetingUrl, "_blank", "noopener,noreferrer");
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 w-full mt-4 disabled:bg-slate-700 disabled:text-slate-400"
                      >
                        <Video className="w-4 h-4 mr-2" />
                        Join Meeting
                      </Button>
                    )}
                    {/* Message Button - Always visible for scheduled/confirmed appointments */}
                    {(apt.status === "scheduled" || apt.status === "confirmed") && (
                      <Button size="sm" onClick={() => openMessage(apt)} className="bg-blue-600 hover:bg-blue-700 w-full mt-4">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message {userType === "patient" ? "Doctor" : "Patient"}
                      </Button>
                    )}
                    {apt.status === "scheduled" && (
                      <div className="flex space-x-2 mt-4">
                        {userType === "doctor" && (
                          <Button size="sm" onClick={() => updateStatus(apt.id, "confirmed")} className="bg-emerald-600 hover:bg-emerald-700 flex-1">
                            Confirm
                          </Button>
                        )}
                        <Button size="sm" onClick={() => cancelAppointment(apt.id)} className="bg-red-600 hover:bg-red-700 text-white flex-1">
                          Cancel
                        </Button>
                      </div>
                    )}
                    {apt.status === "confirmed" && userType === "doctor" && (
                      <Button size="sm" onClick={() => updateStatus(apt.id, "completed")} className="bg-blue-600 hover:bg-blue-700 w-full mt-4">
                        Mark Complete
                      </Button>
                    )}

                    {/* Reschedule section - allowed until appointment end time */}
                    {canReschedule(apt) && (
                      <div className="mt-4 space-y-2">
                        {rescheduleState.appointmentId === apt.id ? (
                          <div className="space-y-2 bg-slate-900/50 border border-slate-700 rounded-lg p-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">New Date</label>
                                <Input
                                  type="date"
                                  min={getTodayDate()}
                                  value={rescheduleState.appointmentDate}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setRescheduleState({
                                      ...rescheduleState,
                                      appointmentDate: value,
                                      // Clear previously selected time when date changes
                                      appointmentTime: "",
                                    });
                                    if (value && rescheduleState.appointmentId === apt.id) {
                                      fetchRescheduleSlots(apt, value);
                                    }
                                  }}
                                  className="bg-slate-800 border-slate-600 text-white"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 block mb-1">New Time</label>
                                {getFilteredRescheduleSlots().length > 0 ? (
                                  <select value={rescheduleState.appointmentTime} onChange={(e) => setRescheduleState({ ...rescheduleState, appointmentTime: e.target.value })} className="w-full bg-slate-800 border-slate-600 text-white rounded-lg p-2 text-sm">
                                    <option value="">Select available time</option>
                                    {getFilteredRescheduleSlots().map((slot) => (
                                      <option key={slot} value={slot}>
                                        {slot}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="bg-slate-800 border-slate-600 text-slate-400 rounded-lg p-2 text-xs">{rescheduleState.appointmentDate ? "No available slots for this date" : "Choose a date to see available slots"}</div>
                                )}
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 block mb-1">Reason (optional)</label>
                              <Input placeholder="Reason for reschedule" value={rescheduleState.reason} onChange={(e) => setRescheduleState({ ...rescheduleState, reason: e.target.value })} className="bg-slate-800 border-slate-600 text-white" />
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" onClick={rescheduleAppointment} disabled={!rescheduleState.appointmentDate || !rescheduleState.appointmentTime} className="bg-indigo-600 hover:bg-indigo-700 flex-1">
                                Save Reschedule
                              </Button>
                              <Button size="sm" onClick={cancelReschedule} className="bg-slate-700 hover:bg-slate-600 flex-1">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" onClick={() => openReschedule(apt)} className="bg-indigo-600 hover:bg-indigo-700 w-full mt-2">
                            Reschedule
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
