import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Stethoscope } from "lucide-react";

const doctorFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  // firstName, lastName, email already collected in signup - removed
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  phoneNumber: z.string().min(1, "Phone number is required"),
  medicalLicenseNumber: z.string().min(1, "Medical license number is required"),
  licenseState: z.string().min(1, "License state/country is required"),
  deaNumber: z.string().optional(),
  npiNumber: z.string().optional(),
  primarySpecialization: z.string().min(1, "Primary specialization is required"),
  subSpecialization: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  boardCertifications: z.string().optional(),
  hospitalName: z.string().optional(),
  department: z.string().optional(),
  practiceAddress: z.string().optional(),
  // Availability
  availableStartTime: z.string().min(1, "Start time is required"),
  availableEndTime: z.string().min(1, "End time is required"),
  slotDuration: z.string().default("30"),
  availableDays: z.array(z.number()).min(1, "Select at least one day"),
  hipaaConsent: z.boolean().refine((val) => val === true, "HIPAA consent is required"),
  termsConsent: z.boolean().refine((val) => val === true, "Terms consent is required"),
  verificationConsent: z.boolean().refine((val) => val === true, "Verification consent is required"),
});

type DoctorFormData = z.infer<typeof doctorFormSchema>;

export default function DoctorRegistration() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { hasCompletedRegistration, isLoading } = useAuth();

  // Redirect to home if registration is already complete
  useEffect(() => {
    if (!isLoading && hasCompletedRegistration) {
      toast({
        title: "Already Registered",
        description: "Your profile is already complete. Redirecting to home...",
      });
      setLocation("/home");
    }
  }, [hasCompletedRegistration, isLoading, setLocation, toast]);

  const form = useForm<DoctorFormData>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      title: "",
      gender: "",
      dateOfBirth: "",
      phoneNumber: "",
      medicalLicenseNumber: "",
      licenseState: "",
      deaNumber: "",
      npiNumber: "",
      primarySpecialization: "",
      subSpecialization: "",
      yearsOfExperience: "",
      boardCertifications: "",
      hospitalName: "",
      department: "",
      practiceAddress: "",
      availableStartTime: "09:00",
      availableEndTime: "17:00",
      slotDuration: "30",
      availableDays: [],
      hipaaConsent: false,
      termsConsent: false,
      verificationConsent: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: DoctorFormData) => {
      // Generate a temporary user ID for registration
      const userId = crypto.randomUUID();

      // Get firstName, lastName, email from localStorage (already provided during signup)
      const storedUser = localStorage.getItem("user");
      const userData = storedUser ? JSON.parse(storedUser) : {};
      const userEmail = userData.email || "";
      const userFirstName = userData.firstName || "";
      const userLastName = userData.lastName || "";

      const doctorData = {
        userId,
        title: data.title,
        firstName: userFirstName,
        lastName: userLastName,
        email: userEmail,
        gender: data.gender || null,
        dateOfBirth: data.dateOfBirth || null,
        phoneNumber: data.phoneNumber || null,
        medicalLicenseNumber: data.medicalLicenseNumber,
        licenseState: data.licenseState,
        deaNumber: data.deaNumber || null,
        npiNumber: data.npiNumber || null,
        primarySpecialization: data.primarySpecialization,
        subSpecialization: data.subSpecialization || null,
        yearsOfExperience: data.yearsOfExperience || null,
        boardCertifications: data.boardCertifications || null,
        hospitalName: data.hospitalName || null,
        department: data.department || null,
        practiceAddress: data.practiceAddress || null,
      };

      const response = await apiRequest("POST", "/api/doctors/register", doctorData);

      // Save availability schedule
      const schedule = data.availableDays.map((dayOfWeek) => ({
        dayOfWeek,
        startTime: data.availableStartTime,
        endTime: data.availableEndTime,
        slotDuration: parseInt(data.slotDuration),
      }));

      await apiRequest("POST", "/api/doctors/set-availability", { schedule });

      return response;
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful!",
        description: "Welcome to KneeKlinic! Your profile and availability are set.",
      });
      // Force redirect to home page after a short delay
      setTimeout(() => {
        window.location.href = "/home";
      }, 1000);
    },
    onError: (error: any) => {
      console.error("Registration error:", error);

      // Parse error message to show specific field errors
      let errorMessage = "An error occurred during registration";

      if (error.message) {
        try {
          // Try to parse JSON error response
          const errorData = JSON.parse(error.message.split(": ")[1] || "{}");
          if (errorData.errors && Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.map((e: any) => `${e.path.join(".")}: ${e.message}`).join("\n");
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DoctorFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-primary opacity-95"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl animate-pulse-slow"></div>
      <div className="absolute bottom-40 right-20 w-24 h-24 bg-white/10 rounded-full blur-xl animate-float" style={{ animationDelay: "3s" }}></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
              <Stethoscope className="text-white w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-display font-bold text-white leading-tight">
              <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Doctor Registration</span>
            </h1>
          </div>
          <p className="text-xl text-blue-100 font-light">Join our professional network of orthopedic specialists</p>
        </div>

        <div className="glass-card rounded-3xl p-8 md:p-12 animate-slide-up medical-shadow">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              {/* Personal Information */}
              <section>
                <h3 className="text-2xl font-display font-bold text-white mb-6 border-b border-white/20 pb-4">
                  <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Personal Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Title <span className="text-red-400">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-title" className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Select title" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Dr.">Dr.</SelectItem>
                            <SelectItem value="Prof. Dr.">Prof. Dr.</SelectItem>
                            <SelectItem value="Assoc. Prof. Dr.">Assoc. Prof. Dr.</SelectItem>
                            <SelectItem value="Asst. Prof. Dr.">Asst. Prof. Dr.</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender" className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-dateOfBirth" className="bg-slate-700 border-slate-600 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Phone Number <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-phoneNumber" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Medical Credentials */}
              <section>
                <h3 className="text-2xl font-display font-bold text-white mb-6 border-b border-white/20 pb-4">
                  <span className="bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">Medical Credentials</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="medicalLicenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Medical License Number <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter license number" {...field} data-testid="input-medicalLicense" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licenseState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          License State/Country <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter license state/country" {...field} data-testid="input-licenseState" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deaNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DEA Number (if applicable)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter DEA number" {...field} data-testid="input-deaNumber" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="npiNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NPI Number</FormLabel>
                        <FormControl>
                          <Input placeholder="National Provider Identifier" {...field} data-testid="input-npiNumber" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Specialization & Experience */}
              <section>
                <h3 className="text-2xl font-display font-bold text-white mb-6 border-b border-white/20 pb-4">
                  <span className="bg-gradient-to-r from-white to-teal-100 bg-clip-text text-transparent">Specialization & Experience</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="primarySpecialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Primary Specialization <span className="text-red-400">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-primarySpecialization" className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Select specialization" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Orthopedic Surgery">Orthopedic Surgery (Knee Specialist)</SelectItem>
                            <SelectItem value="Rheumatology">Rheumatology (Knee & Joint)</SelectItem>
                            <SelectItem value="Sports Medicine">Sports Medicine (Knee Injuries)</SelectItem>
                            <SelectItem value="Physical Medicine & Rehabilitation">Physical Medicine & Rehabilitation</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subSpecialization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sub-specialization</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-subSpecialization" className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Select sub-specialization" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Knee Surgery">Knee Surgery</SelectItem>
                            <SelectItem value="Joint Replacement">Joint Replacement</SelectItem>
                            <SelectItem value="Arthroscopy">Arthroscopy</SelectItem>
                            <SelectItem value="Sports Injuries">Sports Injuries</SelectItem>
                            <SelectItem value="Osteoarthritis Management">Osteoarthritis Management</SelectItem>
                            <SelectItem value="General Orthopedics">General Orthopedics</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yearsOfExperience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-yearsOfExperience" className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Select experience" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-5 years">1-5 years</SelectItem>
                            <SelectItem value="6-10 years">6-10 years</SelectItem>
                            <SelectItem value="11-15 years">11-15 years</SelectItem>
                            <SelectItem value="16-20 years">16-20 years</SelectItem>
                            <SelectItem value="21+ years">21+ years</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="boardCertifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Board Certifications</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter board certifications" {...field} data-testid="input-boardCertifications" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Practice Information */}
              <section>
                <h3 className="text-2xl font-display font-bold text-white mb-6 border-b border-white/20 pb-4">
                  <span className="bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">Practice Information</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="hospitalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hospital/Clinic Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter institution name" {...field} data-testid="input-hospitalName" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter department" {...field} data-testid="input-department" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="practiceAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Practice Address</FormLabel>
                          <FormControl>
                            <Textarea rows={3} placeholder="Enter complete address" {...field} data-testid="textarea-practiceAddress" className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </section>

              {/* Availability Schedule */}
              <section>
                <h3 className="text-2xl font-display font-bold text-white mb-6 border-b border-white/20 pb-4">
                  <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Availability Schedule</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <FormField
                    control={form.control}
                    name="availableStartTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Start Time <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="bg-slate-700 border-slate-600 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="availableEndTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          End Time <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="time" {...field} className="bg-slate-700 border-slate-600 text-white" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slotDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Appointment Duration (minutes) <span className="text-red-400">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                              <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="15">15 minutes</SelectItem>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="45">45 minutes</SelectItem>
                            <SelectItem value="60">60 minutes</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="availableDays"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-white">
                        Available Days <span className="text-red-400">*</span>
                      </FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: "Monday", value: 1 },
                          { label: "Tuesday", value: 2 },
                          { label: "Wednesday", value: 3 },
                          { label: "Thursday", value: 4 },
                          { label: "Friday", value: 5 },
                          { label: "Saturday", value: 6 },
                          { label: "Sunday", value: 0 },
                        ].map((day) => (
                          <FormField
                            key={day.value}
                            control={form.control}
                            name="availableDays"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(day.value)}
                                    onCheckedChange={(checked) => {
                                      return checked ? field.onChange([...field.value, day.value]) : field.onChange(field.value?.filter((value) => value !== day.value));
                                    }}
                                    className="border-white/40"
                                  />
                                </FormControl>
                                <FormLabel className="text-sm text-white font-normal">{day.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* Agreements */}
              <section>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="hipaaConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-4 space-y-0 p-4 bg-white/5 rounded-lg border border-white/10">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-hipaaConsent" className="mt-1 h-5 w-5" />
                        </FormControl>
                        <div className="space-y-1 leading-relaxed">
                          <FormLabel className="text-base text-white font-medium cursor-pointer">I acknowledge compliance with HIPAA regulations and patient privacy requirements</FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termsConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-4 space-y-0 p-4 bg-white/5 rounded-lg border border-white/10">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-termsConsent" className="mt-1 h-5 w-5" />
                        </FormControl>
                        <div className="space-y-1 leading-relaxed">
                          <FormLabel className="text-base text-white font-medium cursor-pointer">I agree to the Terms of Service and Privacy Policy</FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="verificationConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-4 space-y-0 p-4 bg-white/5 rounded-lg border border-white/10">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-verificationConsent" className="mt-1 h-5 w-5" />
                        </FormControl>
                        <div className="space-y-1 leading-relaxed">
                          <FormLabel className="text-base text-white font-medium cursor-pointer">I consent to medical license verification</FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Submit Button */}
              <div className="pt-8 border-t border-white/20">
                <Button type="submit" className="group w-full relative overflow-hidden bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 flex items-center justify-center py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 medical-shadow" disabled={registerMutation.isPending} data-testid="button-submit">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">{registerMutation.isPending ? "Creating Account..." : "Complete Registration"}</span>
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
