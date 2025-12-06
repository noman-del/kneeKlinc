import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Lock, Save, Eye, EyeOff, Camera, Upload, Trash2, Stethoscope, CheckCircle2, Circle } from "lucide-react";
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

  // Check if profile data has changed
  const hasProfileChanges = profileData.firstName !== originalProfileData.firstName || profileData.lastName !== originalProfileData.lastName || profileData.email !== originalProfileData.email || profilePictureFile !== null;

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

  const isDoctor = user?.userType === "doctor";

  const [doctorProfile, setDoctorProfile] = useState({
    title: "",
    gender: "",
    dateOfBirth: "",
    primarySpecialization: "",
    subSpecialization: "",
    yearsOfExperience: "",
    medicalLicenseNumber: "",
    licenseState: "",
    deaNumber: "",
    npiNumber: "",
    hospitalName: "",
    department: "",
    practiceAddress: "",
    phoneNumber: "",
    boardCertifications: "",
  });

  const [originalDoctorProfile, setOriginalDoctorProfile] = useState(doctorProfile);

  const hasDoctorChanges = JSON.stringify(doctorProfile) !== JSON.stringify(originalDoctorProfile);

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
        const mapped = {
          title: d.title || "",
          gender: d.gender || "",
          dateOfBirth: d.dateOfBirth || "",
          primarySpecialization: d.primarySpecialization || "",
          subSpecialization: d.subSpecialization || "",
          yearsOfExperience: d.yearsOfExperience || "",
          medicalLicenseNumber: d.medicalLicenseNumber || "",
          licenseState: d.licenseState || "",
          deaNumber: d.deaNumber || "",
          npiNumber: d.npiNumber || "",
          hospitalName: d.hospitalName || "",
          department: d.department || "",
          practiceAddress: d.practiceAddress || "",
          phoneNumber: d.phoneNumber || "",
          boardCertifications: d.boardCertifications || "",
        };
        setDoctorProfile(mapped);
        setOriginalDoctorProfile(mapped);
      } catch (error) {
        console.error("Failed to load doctor profile", error);
      }
    };

    loadDoctorProfile();
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
      const mapped = {
        title: d.title || "",
        gender: d.gender || "",
        dateOfBirth: d.dateOfBirth || "",
        primarySpecialization: d.primarySpecialization || "",
        subSpecialization: d.subSpecialization || "",
        yearsOfExperience: d.yearsOfExperience || "",
        medicalLicenseNumber: d.medicalLicenseNumber || "",
        licenseState: d.licenseState || "",
        deaNumber: d.deaNumber || "",
        npiNumber: d.npiNumber || "",
        hospitalName: d.hospitalName || "",
        department: d.department || "",
        practiceAddress: d.practiceAddress || "",
        phoneNumber: d.phoneNumber || "",
        boardCertifications: d.boardCertifications || "",
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
    if (profileData.email === originalProfileData.email && profileData.firstName === originalProfileData.firstName && profileData.lastName === originalProfileData.lastName && !profilePictureFile) {
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
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-indigo-900/20"></div>

      <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-60 right-20 w-56 h-56 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      <div className="absolute bottom-32 left-1/3 w-32 h-32 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "6s" }}></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
                    <span className="text-4xl">👤</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                    <span className="text-sm">⚙️</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                    Profile <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Settings</span>
                  </h1>
                  <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">Manage your account information, security settings, and personal preferences</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-3xl p-8">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">{profilePicturePreview || user?.profileImageUrl ? <img src={profilePicturePreview || user?.profileImageUrl} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-16 h-16 text-white" />}</div>
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
              <p className="text-slate-300 text-sm mt-2">Click to change profile picture</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-600/50 mb-8">
              <button onClick={() => setActiveTab("profile")} className={`flex-1 px-6 py-4 text-center font-semibold transition-all duration-300 relative ${activeTab === "profile" ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-white border-b-2 border-indigo-400" : "text-slate-400 hover:text-white hover:bg-slate-800/30"}`}>
                <div className="flex items-center justify-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </div>
              </button>
              <button onClick={() => setActiveTab("password")} className={`flex-1 px-6 py-4 text-center font-semibold transition-all duration-300 relative ${activeTab === "password" ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-white border-b-2 border-indigo-400" : "text-slate-400 hover:text-white hover:bg-slate-800/30"}`}>
                <div className="flex items-center justify-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Security</span>
                </div>
              </button>
              {isDoctor && (
                <button onClick={() => setActiveTab("practice")} className={`flex-1 px-6 py-4 text-center font-semibold transition-all duration-300 relative ${activeTab === "practice" ? "bg-gradient-to-r from-indigo-500/30 to-purple-500/30 text-white border-b-2 border-indigo-400" : "text-slate-400 hover:text-white hover:bg-slate-800/30"}`}>
                  <div className="flex items-center justify-center space-x-2">
                    <Stethoscope className="w-5 h-5" />
                    <span>Professional Details</span>
                  </div>
                </button>
              )}
            </div>

            {activeTab === "profile" && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">First Name</Label>
                    <Input type="text" value={profileData.firstName} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="Enter your first name" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Last Name</Label>
                    <Input type="text" value={profileData.lastName} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="Enter your last name" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200 font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input type="email" value={profileData.email} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20 pl-10" placeholder="Enter your email" />
                  </div>
                </div>
                <Button type="submit" disabled={!hasProfileChanges} className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                  <Save className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
              </form>
            )}

            {activeTab === "practice" && isDoctor && (
              <form onSubmit={handleDoctorProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Title</Label>
                    <Input type="text" value={doctorProfile.title} onChange={(e) => setDoctorProfile({ ...doctorProfile, title: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="e.g. Dr." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Gender</Label>
                    <select value={doctorProfile.gender} onChange={(e) => setDoctorProfile({ ...doctorProfile, gender: e.target.value })} className="w-full rounded-md bg-slate-800/60 border border-slate-600/50 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400">
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Date of Birth</Label>
                    <Input type="date" value={doctorProfile.dateOfBirth} onChange={(e) => setDoctorProfile({ ...doctorProfile, dateOfBirth: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Primary Specialization</Label>
                    <select value={doctorProfile.primarySpecialization} onChange={(e) => setDoctorProfile({ ...doctorProfile, primarySpecialization: e.target.value })} className="w-full rounded-md bg-slate-800/60 border border-slate-600/50 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400">
                      <option value="">Select specialization</option>
                      <option value="Orthopedic Surgery">Orthopedic Surgery</option>
                      <option value="Rheumatology">Rheumatology</option>
                      <option value="Sports Medicine">Sports Medicine</option>
                      <option value="Physical Medicine & Rehabilitation">Physical Medicine & Rehabilitation</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Sub-specialization</Label>
                    <Input type="text" value={doctorProfile.subSpecialization} onChange={(e) => setDoctorProfile({ ...doctorProfile, subSpecialization: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="e.g. Knee Arthroscopy" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Years of Experience</Label>
                    <Input type="text" value={doctorProfile.yearsOfExperience} onChange={(e) => setDoctorProfile({ ...doctorProfile, yearsOfExperience: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="e.g. 10" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Medical License Number</Label>
                    <Input type="text" value={doctorProfile.medicalLicenseNumber} onChange={(e) => setDoctorProfile({ ...doctorProfile, medicalLicenseNumber: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="Enter your license number" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">License State / Country</Label>
                    <Input type="text" value={doctorProfile.licenseState} onChange={(e) => setDoctorProfile({ ...doctorProfile, licenseState: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="e.g. California" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">DEA Number (if applicable)</Label>
                    <Input type="text" value={doctorProfile.deaNumber} onChange={(e) => setDoctorProfile({ ...doctorProfile, deaNumber: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">NPI Number (if applicable)</Label>
                    <Input type="text" value={doctorProfile.npiNumber} onChange={(e) => setDoctorProfile({ ...doctorProfile, npiNumber: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Hospital / Clinic</Label>
                    <Input type="text" value={doctorProfile.hospitalName} onChange={(e) => setDoctorProfile({ ...doctorProfile, hospitalName: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="Hospital or clinic name" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Department</Label>
                    <Input type="text" value={doctorProfile.department} onChange={(e) => setDoctorProfile({ ...doctorProfile, department: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="e.g. Orthopedics" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200 font-medium">Practice Address</Label>
                  <Textarea value={doctorProfile.practiceAddress} onChange={(e) => setDoctorProfile({ ...doctorProfile, practiceAddress: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="Clinic address" rows={3} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Contact Phone</Label>
                    <Input type="text" value={doctorProfile.phoneNumber} onChange={(e) => setDoctorProfile({ ...doctorProfile, phoneNumber: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="e.g. +1 234 567 890" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-200 font-medium">Board Certifications</Label>
                    <Textarea value={doctorProfile.boardCertifications} onChange={(e) => setDoctorProfile({ ...doctorProfile, boardCertifications: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20" placeholder="List any board certifications" rows={3} />
                  </div>
                </div>

                <Button type="submit" disabled={!hasDoctorChanges} className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                  <Save className="w-4 h-4 mr-2" />
                  Update Professional Profile
                </Button>
              </form>
            )}

            {activeTab === "password" && (
              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-slate-200 font-medium">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input type={showCurrentPassword ? "text" : "password"} value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20 pl-10 pr-10" placeholder="Enter current password" required />
                    <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white">
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200 font-medium">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input type={showNewPassword ? "text" : "password"} value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20 pl-10 pr-10" placeholder="Enter new password" required />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white">
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-slate-300/90">
                    <p className="font-medium text-slate-100">Password must include:</p>
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
                          {satisfied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Circle className="h-3.5 w-3.5 text-slate-600" />}
                          <span className={satisfied ? "text-emerald-200" : "text-slate-300/90"}>{rule.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200 font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input type={showConfirmPassword ? "text" : "password"} value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="bg-slate-800/60 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-indigo-400/20 pl-10 pr-10" placeholder="Confirm new password" required />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={!hasPasswordChanges || !allPasswordRulesSatisfied || passwordData.newPassword !== passwordData.confirmPassword}
                  className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Update Password
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* User Info Summary */}
        <div className="relative mt-8">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
          <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-3xl p-8">
            <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl">{profilePicturePreview || user?.profileImageUrl ? <img src={profilePicturePreview || user?.profileImageUrl} alt="Profile" className="w-full h-full object-cover" /> : <User className="w-12 h-12 text-white" />}</div>
                <div className="absolute -bottom-2 -right-2 px-2 py-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full text-xs font-bold text-slate-800">{user?.userType === "patient" ? "🏥" : "👨‍⚕️"}</div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {user?.firstName} {user?.lastName}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-600/40 rounded-2xl p-4">
                    <div className="text-indigo-400 font-semibold text-sm mb-1">Account Type</div>
                    <div className="text-white font-medium">{user?.userType === "patient" ? "Patient" : "Healthcare Provider"}</div>
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-600/40 rounded-2xl p-4">
                    <div className="text-purple-400 font-semibold text-sm mb-1">Member Since</div>
                    <div className="text-white font-medium">{new Date(user?.createdAt || "").toLocaleDateString()}</div>
                  </div>
                  <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-600/40 rounded-2xl p-4">
                    <div className="text-emerald-400 font-semibold text-sm mb-1">Status</div>
                    <div className="flex items-center text-white font-medium">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                      Active
                    </div>
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
