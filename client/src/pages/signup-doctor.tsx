import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signupSchema, type SignupData } from "@shared/schema";
import { ArrowLeft, Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";
import OTPVerification from "@/components/OTPVerification";

interface SignupResponse {
  message: string;
  email?: string;
  requiresVerification?: boolean;
  user?: any;
  token?: string;
  authenticated?: boolean;
}

export default function SignupDoctor() {
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
      userType: "doctor",
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
      description: "Please complete your profile registration.",
    });

    // Auto-redirect to doctor registration
    setTimeout(() => {
      window.location.href = "/doctor-registration";
    }, 1000);
  };

  const handleBackToSignup = () => {
    setShowOTPVerification(false);
    setUserEmail("");
  };

  const onSubmit = (data: SignupData) => {
    signupMutation.mutate(data);
  };

  if (showOTPVerification) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center p-4">
        <OTPVerification email={userEmail} onVerificationSuccess={handleVerificationSuccess} onBack={handleBackToSignup} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-surface border border-bd">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-bold text-th">Healthcare Provider Signup</CardTitle>
            <CardDescription className="text-tm">Create your account to start using AI-powered diagnostics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" variant="ghost" onClick={() => setLocation("/signup")} className="text-tm hover:text-th hover:bg-surface-alt transition-colors duration-150 -ml-2 mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-ts text-sm">
                    First Name
                  </Label>
                  <Input id="firstName" type="text" {...register("firstName")} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="First name" />
                  {errors.firstName && <p className="text-sm text-red-400">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-ts text-sm">
                    Last Name
                  </Label>
                  <Input id="lastName" type="text" {...register("lastName")} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="Last name" />
                  {errors.lastName && <p className="text-sm text-red-400">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-ts text-sm">
                  Email
                </Label>
                <Input id="email" type="email" {...register("email")} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="Enter your professional email" />
                {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-ts text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} {...register("password")} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20 pr-10" placeholder="Create a strong password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-tm hover:text-ts transition-colors duration-150">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
                <div className="mt-1.5 space-y-0.5 text-xs">
                  <p className="font-medium text-tm mb-1">Password must include:</p>
                  {[
                    { key: "length", label: "At least 8 characters" },
                    { key: "upper", label: "At least one uppercase letter" },
                    { key: "lower", label: "At least one lowercase letter" },
                    { key: "number", label: "At least one number" },
                    { key: "special", label: "At least one special character" },
                    { key: "noSpace", label: "No spaces" },
                  ].map((rule) => {
                    const satisfied = passwordChecks[rule.key as keyof typeof passwordChecks];
                    return (
                      <div key={rule.key} className="flex items-center space-x-1.5">
                        {satisfied ? <CheckCircle2 className="h-3 w-3 text-ac" /> : <Circle className="h-3 w-3 text-tf" />}
                        <span className={satisfied ? "text-ac" : "text-tm"}>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-ts text-sm">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} {...register("confirmPassword")} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20 pr-10" placeholder="Confirm your password" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-tm hover:text-ts transition-colors duration-150">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-ac hover:bg-ac-hover text-primary-foreground font-medium transition-colors duration-200 mt-2" disabled={signupMutation.isPending || !isValid}>
                {signupMutation.isPending ? "Creating Account..." : "Create Provider Account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-tm">
            Already have an account?{" "}
            <button onClick={() => setLocation("/login")} className="text-ac hover:text-ac-hover font-medium transition-colors duration-150">
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
