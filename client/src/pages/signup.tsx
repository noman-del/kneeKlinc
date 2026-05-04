import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, UserPlus, Stethoscope, Heart, CheckCircle2, Circle } from "lucide-react";
import { signupSchema, type SignupData } from "@shared/schema";

interface SignupResponse {
  message: string;
  user: any;
  token: string;
  authenticated: boolean;
}

export default function Signup() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<SignupData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  const userType = watch("userType");
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
      // Store token in localStorage
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on user type
      if (data.user.userType === "doctor") {
        setLocation("/doctor-registration");
      } else {
        setLocation("/patient-registration");
      }
    },
  });

  const onSubmit = (data: SignupData) => {
    signupMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-surface border border-bd">
        <CardHeader className="space-y-1 text-center pb-4">
          <CardTitle className="text-2xl font-bold text-th">Create Account</CardTitle>
          <CardDescription className="text-tm">Join KneeKlinic to access personalized knee care</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* User Type Selection */}
            <div className="space-y-2">
              <Label className="text-ts text-sm">I am a:</Label>
              <RadioGroup value={userType} onValueChange={(value) => setValue("userType", value as "doctor" | "patient")} className="grid grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="patient" id="patient" />
                  <Label htmlFor="patient" className="flex items-center space-x-2 cursor-pointer p-2.5 border border-bd rounded-lg hover:bg-surface-alt transition-colors text-ts">
                    <Heart className="h-4 w-4 text-ac" />
                    <span>Patient</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="doctor" id="doctor" />
                  <Label htmlFor="doctor" className="flex items-center space-x-2 cursor-pointer p-2.5 border border-bd rounded-lg hover:bg-surface-alt transition-colors text-ts">
                    <Stethoscope className="h-4 w-4 text-sky-500" />
                    <span>Doctor</span>
                  </Label>
                </div>
              </RadioGroup>
              {errors.userType && <p className="text-sm text-red-400">{errors.userType.message}</p>}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-ts text-sm">
                  First Name
                </Label>
                <Input id="firstName" {...register("firstName")} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="John" />
                {errors.firstName && <p className="text-sm text-red-400">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-ts text-sm">
                  Last Name
                </Label>
                <Input id="lastName" {...register("lastName")} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="Doe" />
                {errors.lastName && <p className="text-sm text-red-400">{errors.lastName.message}</p>}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-ts text-sm">
                Email Address
              </Label>
              <Input id="email" type="email" {...register("email")} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="john.doe@example.com" />
              {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-ts text-sm">
                Password
              </Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} {...register("password")} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20 pr-10" placeholder="••••••••" />
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-ts text-sm">
                Confirm Password
              </Label>
              <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} {...register("confirmPassword")} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20 pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-tm hover:text-ts transition-colors duration-150">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            {/* Error Display */}
            {signupMutation.error && (
              <Alert variant="destructive">
                <AlertDescription>{signupMutation.error.message}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full bg-ac hover:bg-ac-hover text-primary-foreground font-medium transition-colors duration-200" disabled={signupMutation.isPending || !isValid}>
              {signupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="text-center text-sm text-tm pt-2">
            Already have an account?{" "}
            <button onClick={() => setLocation("/login")} className="text-ac hover:text-ac-hover font-medium transition-colors duration-150">
              Sign in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
