import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { signupSchema, type SignupData } from "@shared/schema";
import { ArrowLeft, Eye, EyeOff, Heart, Sparkles, CheckCircle2, Circle } from "lucide-react";
import OTPVerification from "@/components/OTPVerification";

interface SignupResponse {
  message: string;
  email?: string;
  requiresVerification?: boolean;
  user?: any;
  token?: string;
  authenticated?: boolean;
}

export default function SignupPatient() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      userType: "patient",
    },
  });

  const passwordValue = watch("password") || "";

  const passwordChecks = {
    length: passwordValue.length >= 8,
    upper: /[A-Z]/.test(passwordValue),
    lower: /[a-z]/.test(passwordValue),
    number: /\d/.test(passwordValue),
    special: /[^A-Za-z0-9]/.test(passwordValue),
    noSpace: passwordValue.length > 0 && !/\s/.test(passwordValue),
  };

  const signupMutation = useMutation<SignupResponse, Error, SignupData>({
    mutationFn: async (data) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Signup failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.requiresVerification && data.email) {
        // Show OTP verification screen
        setUserEmail(data.email);
        setShowOTPVerification(true);
        toast({
          title: "OTP Sent!",
          description: "Please check your email for the verification code.",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Signup Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVerificationSuccess = (token: string, user: any) => {
    // Store token and user data
    localStorage.setItem("auth_token", token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    toast({
      title: "Account Created Successfully!",
      description: "Welcome to KneeKlinic! You can now start using the system.",
    });

    // Patients don't need registration - go directly to home
    setTimeout(() => {
      window.location.href = "/home";
    }, 1000);
  };

  const handleBackToSignup = () => {
    setShowOTPVerification(false);
    setUserEmail("");
  };

  const onSubmit = (data: SignupData) => {
    signupMutation.mutate(data);
  };

  // Show OTP verification screen if needed
  if (showOTPVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-cyan-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10">
          <OTPVerification email={userEmail} onVerificationSuccess={handleVerificationSuccess} onBack={handleBackToSignup} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-emerald-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-cyan-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-lg relative z-10">
        <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl">
                  <Heart className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="text-yellow-800 text-xs" />
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-3">Patient Signup</CardTitle>
            <CardDescription className="text-lg text-slate-300">Join thousands of patients managing their knee health with AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button type="button" variant="ghost" onClick={() => setLocation("/signup")} className="mb-6 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-300">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to selection
            </Button>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="firstName" className="text-white font-medium">
                    First Name
                  </Label>
                  <Input id="firstName" type="text" {...register("firstName")} className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20 h-12" placeholder="Enter your first name" />
                  {errors.firstName && <p className="text-sm text-emerald-300">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-3">
                  <Label htmlFor="lastName" className="text-white font-medium">
                    Last Name
                  </Label>
                  <Input id="lastName" type="text" {...register("lastName")} className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20 h-12" placeholder="Enter your last name" />
                  {errors.lastName && <p className="text-sm text-emerald-300">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="email" className="text-white font-medium">
                  Email
                </Label>
                <Input id="email" type="email" {...register("email")} className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20 h-12" placeholder="Enter your email address" />
                {errors.email && <p className="text-sm text-emerald-300">{errors.email.message}</p>}
              </div>

              <div className="space-y-3">
                <Label htmlFor="password" className="text-white font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} {...register("password")} className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20 h-12 pr-12" placeholder="Create a strong password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-emerald-300 transition-colors duration-200">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-emerald-300">{errors.password.message}</p>}
                <div className="mt-2 space-y-1 text-xs text-emerald-100/80">
                  <p className="font-medium text-emerald-50">Password must include:</p>
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
                        {satisfied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Circle className="h-3.5 w-3.5 text-emerald-900/40" />}
                        <span className={satisfied ? "text-emerald-200" : "text-emerald-100/80"}>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-white font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} {...register("confirmPassword")} className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20 h-12 pr-12" placeholder="Confirm your password" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-emerald-300 transition-colors duration-200">
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-emerald-300">{errors.confirmPassword.message}</p>}
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-lg shadow-xl hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-105" disabled={signupMutation.isPending || !isValid}>
                  {signupMutation.isPending ? "Creating Account..." : "Create Patient Account"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <p className="text-white/90">
              Already have an account?{" "}
              <button onClick={() => setLocation("/login")} className="text-emerald-300 hover:text-emerald-200 font-semibold underline decoration-2 underline-offset-4 hover:decoration-emerald-300 transition-all duration-300">
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
