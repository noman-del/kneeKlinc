import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Stethoscope, Plus, Trash2 } from "lucide-react";

const doctorFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  // firstName, lastName, email already collected in signup - removed
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  phoneNumber: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^(\+92|0)?3\d{9}$/, "Enter a valid Pakistani phone number (e.g. 03001234567)"),
  medicalLicenseNumber: z
    .string()
    .min(1, "PMDC registration number is required")
    .regex(/^\d{4,6}-[A-Z]$|^\d{5,6}$/, "Enter a valid PMDC number (e.g. 12345-M or 123456)"),
  licenseState: z.string().min(1, "Registration province is required"),
  primarySpecialization: z.string().min(1, "Primary specialization is required"),
  subSpecialization: z.string().optional(),
  yearsOfExperience: z.string().optional(),
  practiceLocations: z
    .array(
      z.object({
        hospitalName: z.string().min(1, "Hospital name is required"),
        department: z.string().optional(),
        address: z.string().optional(),
      }),
    )
    .min(1, "Add at least one practice location"),
  // Availability
  availableStartTime: z.string().min(1, "Start time is required"),
  availableEndTime: z.string().min(1, "End time is required"),
  slotDuration: z.string().default("30"),
  availableDays: z.array(z.number()).min(1, "Select at least one day"),
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
      primarySpecialization: "",
      subSpecialization: "",
      yearsOfExperience: "",
      practiceLocations: [{ hospitalName: "", department: "", address: "" }],
      availableStartTime: "09:00",
      availableEndTime: "17:00",
      slotDuration: "30",
      availableDays: [],
      termsConsent: false,
      verificationConsent: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "practiceLocations",
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
        primarySpecialization: data.primarySpecialization,
        subSpecialization: data.subSpecialization || null,
        yearsOfExperience: data.yearsOfExperience || null,
        practiceLocations: data.practiceLocations || [],
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
    <div className="min-h-screen bg-page">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-th mb-2 tracking-tight">Doctor Registration</h1>
          <p className="text-tm">Complete your professional profile to get started</p>
        </div>

        <div className="bg-surface border border-bd rounded-lg p-6 md:p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information */}
              <section>
                <h3 className="text-lg font-semibold text-th mb-4 border-b border-bd pb-3">Personal Information</h3>
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
                            <SelectTrigger data-testid="select-title" className="bg-ib border-ibr text-th">
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
                            <SelectTrigger data-testid="select-gender" className="bg-ib border-ibr text-th">
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
                          <Input type="date" {...field} data-testid="input-dateOfBirth" className="bg-ib border-ibr text-th" />
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
                          <Input placeholder="03001234567" {...field} data-testid="input-phoneNumber" className="bg-ib border-ibr text-th placeholder:text-tm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Medical Credentials */}
              <section>
                <h3 className="text-lg font-semibold text-th mb-4 border-b border-bd pb-3">Medical Credentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="medicalLicenseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          PMDC Registration Number <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 12345-M or 123456" {...field} data-testid="input-medicalLicense" className="bg-ib border-ibr text-th placeholder:text-tm" />
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
                          Registration Province <span className="text-red-400">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-licenseState" className="bg-ib border-ibr text-th">
                              <SelectValue placeholder="Select province" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Punjab">Punjab</SelectItem>
                            <SelectItem value="Sindh">Sindh</SelectItem>
                            <SelectItem value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa (KPK)</SelectItem>
                            <SelectItem value="Balochistan">Balochistan</SelectItem>
                            <SelectItem value="Gilgit-Baltistan">Gilgit-Baltistan</SelectItem>
                            <SelectItem value="Azad Jammu and Kashmir">Azad Jammu and Kashmir (AJK)</SelectItem>
                            <SelectItem value="Islamabad Capital Territory">Islamabad Capital Territory</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Specialization & Experience */}
              <section>
                <h3 className="text-lg font-semibold text-th mb-4 border-b border-bd pb-3">Specialization & Experience</h3>
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
                            <SelectTrigger data-testid="select-primarySpecialization" className="bg-ib border-ibr text-th">
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
                            <SelectTrigger data-testid="select-subSpecialization" className="bg-ib border-ibr text-th">
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
                            <SelectTrigger data-testid="select-yearsOfExperience" className="bg-ib border-ibr text-th">
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
                </div>
              </section>

              {/* Practice Information */}
              <section>
                <h3 className="text-lg font-semibold text-th mb-4 border-b border-bd pb-3">Practice Information</h3>
                <div className="space-y-6">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-5 bg-surface-alt rounded-lg border border-bd space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-th">Practice Location {index + 1}</h4>
                        {fields.length > 1 && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`practiceLocations.${index}.hospitalName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Hospital/Clinic Name <span className="text-red-400">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Enter institution name" {...field} autoComplete="off" className="bg-ib border-ibr text-th placeholder:text-tm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`practiceLocations.${index}.department`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Orthopedics" {...field} autoComplete="off" className="bg-ib border-ibr text-th placeholder:text-tm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name={`practiceLocations.${index}.address`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Practice Address</FormLabel>
                            <FormControl>
                              <Textarea rows={2} placeholder="Enter complete address" {...field} autoComplete="off" className="bg-ib border-ibr text-th placeholder:text-tm" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={() => append({ hospitalName: "", department: "", address: "" })} className="w-full bg-surface-alt border-bd text-ts hover:bg-surface hover:text-th">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Practice Location
                  </Button>
                </div>
              </section>

              {/* Availability Schedule */}
              <section>
                <h3 className="text-lg font-semibold text-th mb-4 border-b border-bd pb-3">Availability Schedule</h3>
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
                          <Input type="time" {...field} className="bg-ib border-ibr text-th" />
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
                          <Input type="time" {...field} className="bg-ib border-ibr text-th" />
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
                            <SelectTrigger className="bg-ib border-ibr text-th">
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
                      <FormLabel className="text-th">
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
                                    className="border-bd"
                                  />
                                </FormControl>
                                <FormLabel className="text-sm text-th font-normal">{day.label}</FormLabel>
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
                    name="termsConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-4 space-y-0 p-4 bg-surface-alt rounded-lg border border-bd">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-termsConsent" className="mt-1 h-5 w-5" />
                        </FormControl>
                        <div className="space-y-1 leading-relaxed">
                          <FormLabel className="text-base text-th font-medium cursor-pointer">I agree to the Terms of Service and Privacy Policy</FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="verificationConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-4 space-y-0 p-4 bg-surface-alt rounded-lg border border-bd">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-verificationConsent" className="mt-1 h-5 w-5" />
                        </FormControl>
                        <div className="space-y-1 leading-relaxed">
                          <FormLabel className="text-base text-th font-medium cursor-pointer">I consent to PMDC registration verification</FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Submit Button */}
              <div className="pt-6 border-t border-bd">
                <Button type="submit" className="w-full bg-ac hover:bg-ac-hover text-primary-foreground font-medium transition-colors duration-200" disabled={registerMutation.isPending} data-testid="button-submit">
                  {registerMutation.isPending ? "Creating Account..." : "Complete Registration"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
