import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Lock, Save, Eye, EyeOff, Camera, Upload, Trash2, Plus, Stethoscope, Building2, Clock, CheckCircle2, Circle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  // Track original data to check for changes
  const [originalProfileData, setOriginalProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
  });

  // Update original data when user data changes (after refresh)
  useEffect(() => {
    if (user) {
      setOriginalProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(user?.profileImageUrl || null);

  const isDoctor = user?.userType === "doctor";
  const isPatient = user?.userType === "patient";

  // Patient profile state
  const [patientProfile, setPatientProfile] = useState({
    height: "",
    weight: "",
  });

  const [originalPatientProfile, setOriginalPatientProfile] = useState({
    height: "",
    weight: "",
  });

  // Check if profile data has changed
  const hasProfileChanges = profileData.firstName !== originalProfileData.firstName || profileData.lastName !== originalProfileData.lastName || profileData.email !== originalProfileData.email || profilePictureFile !== null || (isPatient && (patientProfile.height !== originalPatientProfile.height || patientProfile.weight !== originalPatientProfile.weight));

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Check if password data has changes
  const hasPasswordChanges = passwordData.currentPassword.trim() !== "" && passwordData.newPassword.trim() !== "" && passwordData.confirmPassword.trim() !== "";

  const passwordChecks = {
    length: passwordData.newPassword.length >= 8,
    upper: /[A-Z]/.test(passwordData.newPassword),
    lower: /[a-z]/.test(passwordData.newPassword),
    number: /\d/.test(passwordData.newPassword),
    special: /[^A-Za-z0-9]/.test(passwordData.newPassword),
    noSpace: passwordData.newPassword.length > 0 && !/\s/.test(passwordData.newPassword),
  };

  const allPasswordRulesSatisfied = Object.values(passwordChecks).every(Boolean);

  const hasPatientChanges = patientProfile.height !== originalPatientProfile.height || patientProfile.weight !== originalPatientProfile.weight;

  const [doctorProfile, setDoctorProfile] = useState({
    title: "",
    gender: "",
    dateOfBirth: "",
    primarySpecialization: "",
    subSpecialization: "",
    yearsOfExperience: "",
    medicalLicenseNumber: "",
    licenseState: "",
    phoneNumber: "",
    practiceLocations: [{ hospitalName: "", department: "", address: "" }] as { hospitalName: string; department: string; address: string }[],
  });

  const [originalDoctorProfile, setOriginalDoctorProfile] = useState(doctorProfile);

  const hasDoctorChanges = JSON.stringify(doctorProfile) !== JSON.stringify(originalDoctorProfile);

  // Doctor availability state (for doctor profile)
  const [availability, setAvailability] = useState({
    availableStartTime: "09:00",
    availableEndTime: "17:00",
    slotDuration: "30",
    availableDays: [] as number[],
  });

  const [originalAvailability, setOriginalAvailability] = useState(availability);

  const hasAvailabilityChanges = availability.availableStartTime !== originalAvailability.availableStartTime || availability.availableEndTime !== originalAvailability.availableEndTime || availability.slotDuration !== originalAvailability.slotDuration || JSON.stringify(availability.availableDays) !== JSON.stringify(originalAvailability.availableDays);

  // Load patient profile when patient logs in
  useEffect(() => {
    if (!isPatient) return;

    const loadPatientProfile = async () => {
      try {
        const res = await fetch("/api/patients/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const p = data.patient || {};
        const mapped = {
          height: p.height || "",
          weight: p.weight || "",
        };
        setPatientProfile(mapped);
        setOriginalPatientProfile(mapped);
      } catch (error) {
        console.error("Failed to load patient profile", error);
      }
    };

    loadPatientProfile();
  }, [isPatient]);

  // Load doctor professional profile when doctor logs in
  useEffect(() => {
    if (!isDoctor) return;

    const loadDoctorProfile = async () => {
      try {
        const res = await fetch("/api/doctors/me", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const d = data.doctor || {};
        const locations =
          Array.isArray(d.practiceLocations) && d.practiceLocations.length > 0
            ? d.practiceLocations.map((loc: any) => ({
                hospitalName: loc.hospitalName || "",
                department: loc.department || "",
                address: loc.address || "",
              }))
            : [{ hospitalName: d.hospitalName || "", department: d.department || "", address: d.practiceAddress || "" }];

        const mapped = {
          title: d.title || "",
          gender: d.gender || "",
          dateOfBirth: d.dateOfBirth || "",
          primarySpecialization: d.primarySpecialization || "",
          subSpecialization: d.subSpecialization || "",
          yearsOfExperience: d.yearsOfExperience || "",
          medicalLicenseNumber: d.medicalLicenseNumber || "",
          licenseState: d.licenseState || "",
          phoneNumber: d.phoneNumber || "",
          practiceLocations: locations,
        };
        setDoctorProfile(mapped);
        setOriginalDoctorProfile(mapped);
      } catch (error) {
        console.error("Failed to load doctor profile", error);
      }
    };

    loadDoctorProfile();
  }, [isDoctor]);

  // Load doctor availability for profile page
  useEffect(() => {
    if (!isDoctor) return;

    const loadAvailability = async () => {
      try {
        const res = await fetch("/api/doctors/my-availability", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const schedule: Array<{ dayOfWeek: number; startTime: string; endTime: string; slotDuration: number }> = data.schedule || [];

        if (schedule.length === 0) {
          // Keep defaults
          return;
        }

        const days = schedule.map((s) => s.dayOfWeek);
        const first = schedule[0];
        const mapped = {
          availableStartTime: first.startTime || "09:00",
          availableEndTime: first.endTime || "17:00",
          slotDuration: String(first.slotDuration || 30),
          availableDays: days,
        };

        setAvailability(mapped);
        setOriginalAvailability(mapped);
      } catch (error) {
        console.error("Failed to load doctor availability", error);
      }
    };

    loadAvailability();
  }, [isDoctor]);

  const handleDeleteProfilePicture = async () => {
    try {
      const response = await fetch("/api/auth/delete-profile-picture", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.ok) {
        // Clear preview and file
        setProfilePicturePreview(null);
        setProfilePictureFile(null);

        // Refresh user data
        refreshUser();

        toast({
          title: "Profile Picture Deleted",
          description: "Your profile picture has been removed successfully.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete profile picture");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete profile picture. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAvailabilityUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasAvailabilityChanges) {
      toast({ title: "No Changes", description: "No changes were made to availability.", variant: "destructive" });
      return;
    }

    if (!availability.availableStartTime || !availability.availableEndTime) {
      toast({ title: "Error", description: "Start time and end time are required.", variant: "destructive" });
      return;
    }

    if (!availability.availableDays.length) {
      toast({ title: "Error", description: "Select at least one available day.", variant: "destructive" });
      return;
    }

    try {
      const schedule = availability.availableDays.map((dayOfWeek) => ({
        dayOfWeek,
        startTime: availability.availableStartTime,
        endTime: availability.availableEndTime,
        slotDuration: parseInt(availability.slotDuration || "30", 10),
      }));

      const res = await fetch("/api/doctors/set-availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({ schedule }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update availability");
      }

      setOriginalAvailability(availability);

      toast({
        title: "Availability Updated",
        description: "Your appointment days and time slots have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update availability. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDoctorProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasDoctorChanges) {
      toast({ title: "No Changes", description: "No changes were made to update.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/doctors/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(doctorProfile),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update doctor profile");
      }

      const data = await res.json();
      const d = data.doctor || {};
      const locations =
        Array.isArray(d.practiceLocations) && d.practiceLocations.length > 0
          ? d.practiceLocations.map((loc: any) => ({
              hospitalName: loc.hospitalName || "",
              department: loc.department || "",
              address: loc.address || "",
            }))
          : [{ hospitalName: "", department: "", address: "" }];

      const mapped = {
        title: d.title || "",
        gender: d.gender || "",
        dateOfBirth: d.dateOfBirth || "",
        primarySpecialization: d.primarySpecialization || "",
        subSpecialization: d.subSpecialization || "",
        yearsOfExperience: d.yearsOfExperience || "",
        medicalLicenseNumber: d.medicalLicenseNumber || "",
        licenseState: d.licenseState || "",
        phoneNumber: d.phoneNumber || "",
        practiceLocations: locations,
      };
      setDoctorProfile(mapped);
      setOriginalDoctorProfile(mapped);

      toast({
        title: "Professional Profile Updated",
        description: "Your professional details have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update doctor profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Please select a valid image file (JPEG, PNG, GIF, or WebP).",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: "Image file size must be less than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setProfilePictureFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePatientProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasPatientChanges) {
      toast({ title: "No Changes", description: "No changes were made to update.", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/patients/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          height: patientProfile.height || null,
          weight: patientProfile.weight || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update patient profile");
      }

      const data = await res.json();
      const p = data.patient || {};
      const mapped = {
        height: p.height || "",
        weight: p.weight || "",
      };
      setPatientProfile(mapped);
      setOriginalPatientProfile(mapped);

      toast({
        title: "Health Information Updated",
        description: "Your height and weight have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update patient profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation checks
    if (!profileData.firstName.trim()) {
      toast({
        title: "Error",
        description: "First name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!profileData.lastName.trim()) {
      toast({
        title: "Error",
        description: "Last name is required.",
        variant: "destructive",
      });
      return;
    }

    if (!profileData.email.trim()) {
      toast({
        title: "Error",
        description: "Email is required.",
        variant: "destructive",
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    // Check if email is the same as current (no change needed)
    if (profileData.email === originalProfileData.email && profileData.firstName === originalProfileData.firstName && profileData.lastName === originalProfileData.lastName && !profilePictureFile && (!isPatient || (patientProfile.height === originalPatientProfile.height && patientProfile.weight === originalPatientProfile.weight))) {
      toast({
        title: "No Changes",
        description: "No changes were made to update.",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("firstName", profileData.firstName);
      formData.append("lastName", profileData.lastName);
      formData.append("email", profileData.email);

      if (profilePictureFile) {
        formData.append("profilePicture", profilePictureFile);
      }

      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        // Reset profile picture file state since it's been uploaded
        setProfilePictureFile(null);

        // If patient, also update health information
        if (isPatient && (patientProfile.height !== originalPatientProfile.height || patientProfile.weight !== originalPatientProfile.weight)) {
          const patientRes = await fetch("/api/patients/me", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
            body: JSON.stringify({
              height: patientProfile.height || null,
              weight: patientProfile.weight || null,
            }),
          });

          if (patientRes.ok) {
            const patientData = await patientRes.json();
            const p = patientData.patient || {};
            const mapped = {
              height: p.height || "",
              weight: p.weight || "",
            };
            setPatientProfile(mapped);
            setOriginalPatientProfile(mapped);
          }
        }

        // Refresh user data in auth context
        refreshUser();

        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if all fields are filled
    if (!passwordData.currentPassword.trim()) {
      toast({
        title: "Error",
        description: "Current password is required.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordData.newPassword.trim()) {
      toast({
        title: "Error",
        description: "New password is required.",
        variant: "destructive",
      });
      return;
    }

    if (!passwordData.confirmPassword.trim()) {
      toast({
        title: "Error",
        description: "Please confirm your new password.",
        variant: "destructive",
      });
      return;
    }

    // Check if new password is same as current password
    if (passwordData.currentPassword === passwordData.newPassword) {
      toast({
        title: "Error",
        description: "New password cannot be the same as current password.",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (!allPasswordRulesSatisfied) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters and include upper and lower case letters, a number, a special character, and no spaces.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: "Password Updated",
          description: "Your password has been changed successfully.",
        });
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update password");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password. Please check your current password.",
        variant: "destructive",
      });
    }
  };

  const [activeTab, setActiveTab] = useState("profile");

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-th mb-2 tracking-tight">
            Profile <span className="text-ac">Settings</span>
          </h1>
          <p className="text-tm">Manage your account information, security settings, and personal preferences</p>
        </div>

        <div className="bg-surface border border-bd rounded-lg p-6 md:p-8">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-surface-alt border border-bd flex items-center justify-center">{profilePicturePreview || user?.profileImageUrl ? <img src={profilePicturePreview || user?.profileImageUrl} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-16 h-16 text-th" />}</div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <label htmlFor="profile-picture" className="cursor-pointer">
                  <Camera className="w-8 h-8 text-white" />
                </label>
                {(user?.profileImageUrl || profilePicturePreview) && (
                  <button onClick={handleDeleteProfilePicture} className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-colors duration-200 ml-4" title="Delete profile picture">
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
              <input id="profile-picture" type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
            </div>
            <p className="text-tm text-sm mt-2">Click to change profile picture</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-bd mb-8">
            <button onClick={() => setActiveTab("profile")} className={`flex-1 px-4 py-3 text-center font-medium transition-colors duration-200 relative ${activeTab === "profile" ? "text-ac border-b-2 border-ac" : "text-tm hover:text-th"}`}>
              <div className="flex items-center justify-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </div>
            </button>
            <button onClick={() => setActiveTab("password")} className={`flex-1 px-4 py-3 text-center font-medium transition-colors duration-200 relative ${activeTab === "password" ? "text-ac border-b-2 border-ac" : "text-tm hover:text-th"}`}>
              <div className="flex items-center justify-center space-x-2">
                <Lock className="w-4 h-4" />
                <span>Security</span>
              </div>
            </button>
            {isDoctor && (
              <>
                <button onClick={() => setActiveTab("practice")} className={`flex-1 px-4 py-3 text-center font-medium transition-colors duration-200 relative ${activeTab === "practice" ? "text-ac border-b-2 border-ac" : "text-tm hover:text-th"}`}>
                  <div className="flex items-center justify-center space-x-2">
                    <Stethoscope className="w-4 h-4" />
                    <span>Professional</span>
                  </div>
                </button>
                <button onClick={() => setActiveTab("practiceInfo")} className={`flex-1 px-4 py-3 text-center font-medium transition-colors duration-200 relative ${activeTab === "practiceInfo" ? "text-ac border-b-2 border-ac" : "text-tm hover:text-th"}`}>
                  <div className="flex items-center justify-center space-x-2">
                    <Building2 className="w-4 h-4" />
                    <span>Practice</span>
                  </div>
                </button>
                <button onClick={() => setActiveTab("availability")} className={`flex-1 px-4 py-3 text-center font-medium transition-colors duration-200 relative ${activeTab === "availability" ? "text-ac border-b-2 border-ac" : "text-tm hover:text-th"}`}>
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Availability</span>
                  </div>
                </button>
              </>
            )}
          </div>

          {activeTab === "profile" && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-ts font-medium">First Name</Label>
                  <Input type="text" value={profileData.firstName} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="Enter your first name" />
                </div>
                <div className="space-y-2">
                  <Label className="text-ts font-medium">Last Name</Label>
                  <Input type="text" value={profileData.lastName} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="Enter your last name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-ts font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tm w-4 h-4" />
                  <Input type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20 pl-10" placeholder="Enter your email" />
                </div>
              </div>

              {isPatient && (
                <>
                  <h3 className="text-lg font-semibold text-th mt-6 mb-2">Health Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-ts font-medium">Height (cm)</Label>
                      <Input type="number" value={patientProfile.height} onChange={(e) => setPatientProfile({ ...patientProfile, height: e.target.value })} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="e.g., 175" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-ts font-medium">Weight (kg)</Label>
                      <Input type="number" value={patientProfile.weight} onChange={(e) => setPatientProfile({ ...patientProfile, weight: e.target.value })} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="e.g., 70" />
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" disabled={!hasProfileChanges} className="w-full h-12 bg-ac hover:bg-ac-hover text-primary-foreground font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </form>
          )}

          {activeTab === "practice" && isDoctor && (
            <form onSubmit={handleDoctorProfileUpdate} className="space-y-6">
              <h3 className="text-xl font-display font-semibold text-th mb-2">Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-ts font-medium">Title</Label>
                  <select value={doctorProfile.title} onChange={(e) => setDoctorProfile({ ...doctorProfile, title: e.target.value })} className="w-full rounded-md bg-ib border border-ibr text-th px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ac/20 focus:border-ac">
                    <option value="">Select title</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Prof. Dr.">Prof. Dr.</option>
                    <option value="Assoc. Prof. Dr.">Assoc. Prof. Dr.</option>
                    <option value="Asst. Prof. Dr.">Asst. Prof. Dr.</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-ts font-medium">Gender</Label>
                  <select value={doctorProfile.gender} onChange={(e) => setDoctorProfile({ ...doctorProfile, gender: e.target.value })} className="w-full rounded-md bg-ib border border-ibr text-th px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ac/20 focus:border-ac">
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-ts font-medium">Date of Birth</Label>
                  <Input type="date" value={doctorProfile.dateOfBirth} onChange={(e) => setDoctorProfile({ ...doctorProfile, dateOfBirth: e.target.value })} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" />
                </div>
                <div className="space-y-2">
                  <Label className="text-ts font-medium">Phone Number</Label>
                  <Input type="text" value={doctorProfile.phoneNumber} onChange={(e) => setDoctorProfile({ ...doctorProfile, phoneNumber: e.target.value })} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="03001234567" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-ts font-medium">PMDC Registration Number</Label>
                  <Input type="text" value={doctorProfile.medicalLicenseNumber} onChange={(e) => setDoctorProfile({ ...doctorProfile, medicalLicenseNumber: e.target.value })} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="e.g. 12345-M or 123456" />
                </div>
                <div className="space-y-2">
                  <Label className="text-ts font-medium">Registration Province</Label>
                  <select value={doctorProfile.licenseState} onChange={(e) => setDoctorProfile({ ...doctorProfile, licenseState: e.target.value })} className="w-full rounded-md bg-ib border border-ibr text-th px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ac/20 focus:border-ac">
                    <option value="">Select province</option>
                    <option value="Punjab">Punjab</option>
                    <option value="Sindh">Sindh</option>
                    <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa (KPK)</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                    <option value="Azad Jammu and Kashmir">Azad Jammu and Kashmir (AJK)</option>
                    <option value="Islamabad Capital Territory">Islamabad Capital Territory</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-ts font-medium">Primary Specialization</Label>
                  <select value={doctorProfile.primarySpecialization} onChange={(e) => setDoctorProfile({ ...doctorProfile, primarySpecialization: e.target.value })} className="w-full rounded-md bg-ib border border-ibr text-th px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ac/20 focus:border-ac">
                    <option value="">Select specialization</option>
                    <option value="Orthopedic Surgery">Orthopedic Surgery (Knee Specialist)</option>
                    <option value="Rheumatology">Rheumatology (Knee & Joint)</option>
                    <option value="Sports Medicine">Sports Medicine (Knee Injuries)</option>
                    <option value="Physical Medicine & Rehabilitation">Physical Medicine & Rehabilitation</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-ts font-medium">Sub-specialization</Label>
                  <select value={doctorProfile.subSpecialization} onChange={(e) => setDoctorProfile({ ...doctorProfile, subSpecialization: e.target.value })} className="w-full rounded-md bg-ib border border-ibr text-th px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ac/20 focus:border-ac">
                    <option value="">Select sub-specialization</option>
                    <option value="Knee Surgery">Knee Surgery</option>
                    <option value="Joint Replacement">Joint Replacement</option>
                    <option value="Arthroscopy">Arthroscopy</option>
                    <option value="Sports Injuries">Sports Injuries</option>
                    <option value="Osteoarthritis Management">Osteoarthritis Management</option>
                    <option value="General Orthopedics">General Orthopedics</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-ts font-medium">Years of Experience</Label>
                <select value={doctorProfile.yearsOfExperience} onChange={(e) => setDoctorProfile({ ...doctorProfile, yearsOfExperience: e.target.value })} className="w-full rounded-md bg-ib border border-ibr text-th px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ac/20 focus:border-ac">
                  <option value="">Select experience</option>
                  <option value="1-5 years">1-5 years</option>
                  <option value="6-10 years">6-10 years</option>
                  <option value="11-15 years">11-15 years</option>
                  <option value="16-20 years">16-20 years</option>
                  <option value="21+ years">21+ years</option>
                </select>
              </div>

              <Button type="submit" disabled={!hasDoctorChanges} className="w-full h-12 bg-ac hover:bg-ac-hover text-primary-foreground font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="w-4 h-4 mr-2" />
                Update Professional Profile
              </Button>
            </form>
          )}

          {activeTab === "practiceInfo" && isDoctor && (
            <form onSubmit={handleDoctorProfileUpdate} className="space-y-6">
              <h3 className="text-xl font-display font-semibold text-th mb-2">Practice Information</h3>
              <div className="space-y-6">
                {doctorProfile.practiceLocations.map((loc, index) => (
                  <div key={index} className="p-5 bg-surface-alt rounded-lg border border-bd space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-th">Practice Location {index + 1}</h4>
                      {doctorProfile.practiceLocations.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = doctorProfile.practiceLocations.filter((_, i) => i !== index);
                            setDoctorProfile({ ...doctorProfile, practiceLocations: updated });
                          }}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-ts font-medium">Hospital / Clinic Name</Label>
                        <Input
                          type="text"
                          value={loc.hospitalName}
                          onChange={(e) => {
                            const updated = [...doctorProfile.practiceLocations];
                            updated[index] = { ...updated[index], hospitalName: e.target.value };
                            setDoctorProfile({ ...doctorProfile, practiceLocations: updated });
                          }}
                          className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20"
                          placeholder="Enter institution name"
                          autoComplete="off"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-ts font-medium">Department</Label>
                        <Input
                          type="text"
                          value={loc.department}
                          onChange={(e) => {
                            const updated = [...doctorProfile.practiceLocations];
                            updated[index] = { ...updated[index], department: e.target.value };
                            setDoctorProfile({ ...doctorProfile, practiceLocations: updated });
                          }}
                          className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20"
                          placeholder="e.g. Orthopedics"
                          autoComplete="off"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-ts font-medium">Practice Address</Label>
                      <Textarea
                        value={loc.address}
                        onChange={(e) => {
                          const updated = [...doctorProfile.practiceLocations];
                          updated[index] = { ...updated[index], address: e.target.value };
                          setDoctorProfile({ ...doctorProfile, practiceLocations: updated });
                        }}
                        className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20"
                        placeholder="Enter complete address"
                        rows={2}
                        autoComplete="off"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDoctorProfile({
                      ...doctorProfile,
                      practiceLocations: [...doctorProfile.practiceLocations, { hospitalName: "", department: "", address: "" }],
                    });
                  }}
                  className="w-full bg-surface-alt border-bd text-ts hover:bg-surface hover:text-th"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Practice Location
                </Button>
              </div>

              <Button type="submit" disabled={!hasDoctorChanges} className="w-full h-12 bg-ac hover:bg-ac-hover text-primary-foreground font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="w-4 h-4 mr-2" />
                Update Practice Information
              </Button>
            </form>
          )}

          {activeTab === "availability" && isDoctor && (
            <form onSubmit={handleAvailabilityUpdate} className="space-y-6">
              <h3 className="text-xl font-display font-semibold text-th mb-2">Availability Schedule</h3>
              <p className="text-tm text-sm mb-4">Update the days and time slots when you are available for patient appointments.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-ts font-medium">
                    Start Time <span className="text-red-400">*</span>
                  </Label>
                  <Input type="time" value={availability.availableStartTime} onChange={(e) => setAvailability({ ...availability, availableStartTime: e.target.value })} className="bg-ib border-ibr text-th" />
                </div>
                <div className="space-y-2">
                  <Label className="text-ts font-medium">
                    End Time <span className="text-red-400">*</span>
                  </Label>
                  <Input type="time" value={availability.availableEndTime} onChange={(e) => setAvailability({ ...availability, availableEndTime: e.target.value })} className="bg-ib border-ibr text-th" />
                </div>
                <div className="space-y-2">
                  <Label className="text-ts font-medium">
                    Appointment Duration (minutes) <span className="text-red-400">*</span>
                  </Label>
                  <select value={availability.slotDuration} onChange={(e) => setAvailability({ ...availability, slotDuration: e.target.value })} className="w-full rounded-md bg-ib border border-ibr text-th px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ac/20 focus:border-ac">
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-ts font-medium">
                  Available Days <span className="text-red-400">*</span>
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Monday", value: 1 },
                    { label: "Tuesday", value: 2 },
                    { label: "Wednesday", value: 3 },
                    { label: "Thursday", value: 4 },
                    { label: "Friday", value: 5 },
                    { label: "Saturday", value: 6 },
                    { label: "Sunday", value: 0 },
                  ].map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={availability.availableDays.includes(day.value)}
                        onCheckedChange={(checked) => {
                          setAvailability((prev) => {
                            const current = prev.availableDays;
                            const exists = current.includes(day.value);
                            let next: number[];
                            if (checked && !exists) {
                              next = [...current, day.value];
                            } else if (!checked && exists) {
                              next = current.filter((v) => v !== day.value);
                            } else {
                              next = current;
                            }
                            return { ...prev, availableDays: next };
                          });
                        }}
                        className="border-white/40"
                      />
                      <span className="text-sm text-th">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button type="submit" disabled={!hasAvailabilityChanges} className="w-full h-12 bg-ac hover:bg-ac-hover text-primary-foreground font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <Save className="w-4 h-4 mr-2" />
                Update Availability
              </Button>
            </form>
          )}

          {activeTab === "password" && (
            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-ts font-medium">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tm w-4 h-4" />
                  <Input type={showCurrentPassword ? "text" : "password"} value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20 pl-10 pr-10" placeholder="Enter current password" required />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-tm hover:text-th">
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-ts font-medium">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tm w-4 h-4" />
                  <Input type={showNewPassword ? "text" : "password"} value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20 pl-10 pr-10" placeholder="Enter new password" required />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-tm hover:text-th">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2 space-y-1 text-xs text-tm">
                  <p className="font-medium text-th">Password must include:</p>
                  {[
                    {
                      key: "length",
                      label: "At least 8 characters",
                    },
                    {
                      key: "upper",
                      label: "At least one uppercase letter",
                    },
                    {
                      key: "lower",
                      label: "At least one lowercase letter",
                    },
                    {
                      key: "number",
                      label: "At least one number",
                    },
                    {
                      key: "special",
                      label: "At least one special character",
                    },
                    {
                      key: "noSpace",
                      label: "No spaces",
                    },
                  ].map((rule) => {
                    const satisfied = passwordChecks[rule.key as keyof typeof passwordChecks];
                    return (
                      <div key={rule.key} className="flex items-center space-x-2">
                        {satisfied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Circle className="h-3.5 w-3.5 text-tm" />}
                        <span className={satisfied ? "text-emerald-200" : "text-tm"}>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-ts font-medium">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tm w-4 h-4" />
                  <Input type={showConfirmPassword ? "text" : "password"} value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20 pl-10 pr-10" placeholder="Confirm new password" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-tm hover:text-th">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={!hasPasswordChanges || !allPasswordRulesSatisfied || passwordData.newPassword !== passwordData.confirmPassword} className="w-full h-12 bg-ac hover:bg-ac-hover text-primary-foreground font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <Lock className="w-4 h-4 mr-2" />
                Update Password
              </Button>
            </form>
          )}
        </div>

        {/* User Info Summary */}
        <div className="mt-8 bg-surface border border-bd rounded-lg p-6">
          <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-surface-alt border border-bd flex items-center justify-center">{profilePicturePreview || user?.profileImageUrl ? <img src={profilePicturePreview || user?.profileImageUrl} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-tm" />}</div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-xl font-bold text-th mb-3">
                {user?.firstName} {user?.lastName}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-surface-alt border border-bd rounded-lg p-3">
                  <div className="text-ac font-medium text-xs mb-1">Account Type</div>
                  <div className="text-th text-sm">{user?.userType === "patient" ? "Patient" : "Healthcare Provider"}</div>
                </div>
                <div className="bg-surface-alt border border-bd rounded-lg p-3">
                  <div className="text-ac font-medium text-xs mb-1">Member Since</div>
                  <div className="text-th text-sm">{new Date(user?.createdAt || "").toLocaleDateString()}</div>
                </div>
                <div className="bg-surface-alt border border-bd rounded-lg p-3">
                  <div className="text-ac font-medium text-xs mb-1">Status</div>
                  <div className="flex items-center text-th text-sm">
                    <div className="w-2 h-2 bg-ac rounded-full mr-2"></div>
                    Active
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
