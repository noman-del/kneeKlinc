import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link, useLocation } from "wouter";
import { User } from "lucide-react";

const patientFormSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    gender: z.string().min(1, "Gender is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    emergencyContactPhone: z.string().min(1, "Emergency contact is required"),
    email: z.string().email("Valid email is required"),
    confirmEmail: z.string().email("Valid email is required"),
    height: z.string().optional(),
    weight: z.string().optional(),
    activityLevel: z.string().optional(),
    occupationType: z.string().optional(),
    weeklyExerciseHours: z.number().min(0).max(50).optional(),
    smokingStatus: z.string().optional(),
    insuranceProvider: z.string().optional(),
    policyNumber: z.string().optional(),
    primaryCarePhysician: z.string().optional(),
    currentOrthopedist: z.string().optional(),
    currentKLGrade: z.string().optional(),
    // Symptoms
    kneePain: z.boolean().default(false),
    jointStiffness: z.boolean().default(false),
    swelling: z.boolean().default(false),
    limitedMobility: z.boolean().default(false),
    grindingSensation: z.boolean().default(false),
    kneeInstability: z.boolean().default(false),
    // Injuries
    aclInjury: z.boolean().default(false),
    meniscusTear: z.boolean().default(false),
    kneeFracture: z.boolean().default(false),
    kneeReplacement: z.boolean().default(false),
    // Consents
    hipaaConsent: z.boolean().refine((val) => val === true, "HIPAA consent is required"),
    termsConsent: z.boolean().refine((val) => val === true, "Terms consent is required"),
    aiDisclosure: z.boolean().refine((val) => val === true, "AI disclosure acknowledgment is required"),
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: "Emails don't match",
    path: ["confirmEmail"],
  });

type PatientFormData = z.infer<typeof patientFormSchema>;

export default function PatientRegistration() {
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

  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      phoneNumber: "",
      emergencyContactPhone: "",
      email: "",
      confirmEmail: "",
      height: "",
      weight: "",
      activityLevel: "",
      occupationType: "",
      weeklyExerciseHours: 0,
      smokingStatus: "",
      insuranceProvider: "",
      policyNumber: "",
      primaryCarePhysician: "",
      currentOrthopedist: "",
      currentKLGrade: "",
      kneePain: false,
      jointStiffness: false,
      swelling: false,
      limitedMobility: false,
      grindingSensation: false,
      kneeInstability: false,
      aclInjury: false,
      meniscusTear: false,
      kneeFracture: false,
      kneeReplacement: false,
      hipaaConsent: false,
      termsConsent: false,
      aiDisclosure: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      const userId = crypto.randomUUID();

      const patientData = {
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        gender: data.gender,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(),
        phoneNumber: data.phoneNumber,
        emergencyContactPhone: data.emergencyContactPhone,
        height: data.height || null,
        weight: data.weight || null,
        activityLevel: data.activityLevel || null,
        occupationType: data.occupationType || null,
        weeklyExerciseHours: data.weeklyExerciseHours || null,
        smokingStatus: data.smokingStatus || null,
        insuranceProvider: data.insuranceProvider || null,
        policyNumber: data.policyNumber || null,
        primaryCarePhysician: data.primaryCarePhysician || null,
        currentOrthopedist: data.currentOrthopedist || null,
        currentKLGrade: data.currentKLGrade || null,
        symptoms: {
          kneePain: data.kneePain,
          jointStiffness: data.jointStiffness,
          swelling: data.swelling,
          limitedMobility: data.limitedMobility,
          grindingSensation: data.grindingSensation,
          kneeInstability: data.kneeInstability,
        },
        injuries: {
          aclInjury: data.aclInjury,
          meniscusTear: data.meniscusTear,
          kneeFracture: data.kneeFracture,
          kneeReplacement: data.kneeReplacement,
        },
      };

      return apiRequest("POST", "/api/patients/register", patientData);
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful!",
        description: "Welcome to KneeKlinic! Your profile is now complete.",
      });
      // Redirect to home page
      setLocation("/home");
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PatientFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-emerald-900/10"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-40 right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center">
              <User className="text-white w-8 h-8" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
              Patient <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Registration</span>
            </h1>
          </div>
          <p className="text-xl text-slate-300">Join our community for comprehensive knee health management</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-8 md:p-12">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              {/* Personal Information */}
              <section>
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-white/20 pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium">
                          First Name <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} data-testid="input-firstName" className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium">
                          Last Name <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter last name" {...field} data-testid="input-lastName" className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Date of Birth <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-dateOfBirth" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Gender <span className="text-red-400">*</span>
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                          </SelectContent>
                        </Select>
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
                          <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-phoneNumber" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Emergency Contact Phone <span className="text-red-400">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Emergency contact" {...field} data-testid="input-emergencyContact" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Medical History */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">Medical History</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 5'8&quot; or 173 cm" {...field} data-testid="input-height" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 150 lbs or 68 kg" {...field} data-testid="input-weight" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Symptoms */}
                  <div>
                    <FormLabel className="text-base font-medium text-slate-700 mb-3 block">Knee-Related Symptoms (Check all that apply)</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="kneePain"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-kneePain" />
                            </FormControl>
                            <FormLabel className="text-sm">Knee Pain</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="jointStiffness"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-jointStiffness" />
                            </FormControl>
                            <FormLabel className="text-sm">Joint Stiffness</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="swelling"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-swelling" />
                            </FormControl>
                            <FormLabel className="text-sm">Swelling</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="limitedMobility"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-limitedMobility" />
                            </FormControl>
                            <FormLabel className="text-sm">Limited Mobility</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="grindingSensation"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-grindingSensation" />
                            </FormControl>
                            <FormLabel className="text-sm">Grinding Sensation</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="kneeInstability"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-kneeInstability" />
                            </FormControl>
                            <FormLabel className="text-sm">Knee Instability</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="currentKLGrade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Kellgren-Lawrence Grade (if known)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-full md:w-1/2" data-testid="select-klGrade">
                              <SelectValue placeholder="Unknown" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Unknown">Unknown</SelectItem>
                            <SelectItem value="Grade 0 - No OA">Grade 0 - No OA</SelectItem>
                            <SelectItem value="Grade 1 - Doubtful OA">Grade 1 - Doubtful OA</SelectItem>
                            <SelectItem value="Grade 2 - Minimal OA">Grade 2 - Minimal OA</SelectItem>
                            <SelectItem value="Grade 3 - Moderate OA">Grade 3 - Moderate OA</SelectItem>
                            <SelectItem value="Grade 4 - Severe OA">Grade 4 - Severe OA</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Previous Injuries */}
                  <div>
                    <FormLabel className="text-base font-medium text-slate-700 mb-3 block">Previous Knee Injuries/Surgeries</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="aclInjury"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-aclInjury" />
                            </FormControl>
                            <FormLabel className="text-sm">ACL Injury</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="meniscusTear"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-meniscusTear" />
                            </FormControl>
                            <FormLabel className="text-sm">Meniscus Tear</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="kneeFracture"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-kneeFracture" />
                            </FormControl>
                            <FormLabel className="text-sm">Knee Fracture</FormLabel>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="kneeReplacement"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-kneeReplacement" />
                            </FormControl>
                            <FormLabel className="text-sm">Knee Replacement</FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Lifestyle Factors */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">Lifestyle Factors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="activityLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-activityLevel">
                              <SelectValue placeholder="Select activity level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Sedentary">Sedentary</SelectItem>
                            <SelectItem value="Lightly Active">Lightly Active</SelectItem>
                            <SelectItem value="Moderately Active">Moderately Active</SelectItem>
                            <SelectItem value="Very Active">Very Active</SelectItem>
                            <SelectItem value="Extremely Active">Extremely Active</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="occupationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-occupationType">
                              <SelectValue placeholder="Select occupation type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Desk Job">Desk Job</SelectItem>
                            <SelectItem value="Standing/Walking">Standing/Walking</SelectItem>
                            <SelectItem value="Physical Labor">Physical Labor</SelectItem>
                            <SelectItem value="Athletic/Sports">Athletic/Sports</SelectItem>
                            <SelectItem value="Retired">Retired</SelectItem>
                            <SelectItem value="Student">Student</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weeklyExerciseHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weekly Exercise Hours</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0-50 hours" min="0" max="50" {...field} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)} data-testid="input-weeklyExercise" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="smokingStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Smoking Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-smokingStatus">
                              <SelectValue placeholder="Select smoking status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Never Smoked">Never Smoked</SelectItem>
                            <SelectItem value="Former Smoker">Former Smoker</SelectItem>
                            <SelectItem value="Current Smoker">Current Smoker</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Insurance & Healthcare */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">Insurance & Healthcare Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="insuranceProvider"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Insurance Provider</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Blue Cross Blue Shield" {...field} data-testid="input-insuranceProvider" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="policyNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Policy Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Insurance policy number" {...field} data-testid="input-policyNumber" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="primaryCarePhysician"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Care Physician</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Name" {...field} data-testid="input-primaryCarePhysician" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currentOrthopedist"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Orthopedist (if any)</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Name" {...field} data-testid="input-currentOrthopedist" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Account Setup */}
              <section>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 border-b border-slate-200 pb-2">Account Setup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Enter your email address" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Re-enter your email address" {...field} data-testid="input-confirmEmail" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Agreements */}
              <section>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="hipaaConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-hipaaConsent" />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-slate-700">I understand my rights under HIPAA and consent to the use of my health information</FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termsConsent"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-termsConsent" />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-slate-700">I agree to the Terms of Service and Privacy Policy</FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aiDisclosure"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox checked={field.value} onCheckedChange={field.onChange} data-testid="checkbox-aiDisclosure" />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm text-slate-700">I understand this platform uses AI for assistive prediction and does not replace professional medical advice</FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* Submit Button */}
              <div className="pt-8 border-t border-white/20">
                <div className="flex flex-col sm:flex-row gap-6">
                  <Button type="submit" className="group flex-1 relative overflow-hidden bg-white/20 backdrop-blur-md border border-white/30 text-white hover:bg-white/30 flex items-center justify-center py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-300 hover:scale-105 medical-shadow" disabled={registerMutation.isPending} data-testid="button-submit">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10">{registerMutation.isPending ? "Creating Account..." : "Complete Registration"}</span>
                  </Button>
                  <Link href="/">
                    <Button type="button" variant="outline" className="flex-1 bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 py-4 px-8 rounded-2xl font-semibold text-lg transition-all duration-300" data-testid="button-back">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
