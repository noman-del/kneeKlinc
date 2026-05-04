import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, type LoginData } from "@shared/schema";
import { Eye, EyeOff, Stethoscope, Sparkles, LogIn } from "lucide-react";

interface LoginResponse {
  message: string;
  user: any;
  token: string;
  authenticated: boolean;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Check for signup success message and suspension message
  useEffect(() => {
    // From successful signup
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("signup") === "success") {
      toast({
        title: "Account Created Successfully!",
        description: "Welcome to KneeKlinic! Please sign in with your new account.",
      });
      // Clean up the URL
      window.history.replaceState({}, "", "/login");
    }

    // From suspended account (set by useAuth when /api/auth/user returns 403)
    const suspensionMessage = localStorage.getItem("suspension_message");
    if (suspensionMessage) {
      toast({
        title: "Account Suspended",
        description: suspensionMessage,
        variant: "destructive",
      });
      localStorage.removeItem("suspension_message");
    }
  }, [toast]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation<LoginResponse, Error, LoginData>({
    mutationFn: async (data) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Login failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Store token in localStorage (both keys for compatibility)
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Force refresh the app so useAuth picks up the new auth state
      window.location.href = "/";
    },
    onError: (error) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid email or password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-surface border border-bd">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-th tracking-tight">Welcome Back</CardTitle>
            <CardDescription className="text-tm">Sign in to your KneeKlinic account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-ts text-sm">
                  Email Address
                </Label>
                <Input id="email" type="email" {...register("email")} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20" placeholder="Enter your email address" />
                {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-ts text-sm">
                  Password
                </Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? "text" : "password"} {...register("password")} className="bg-ib border-ibr text-th placeholder:text-tm focus:border-ac focus:ring-ac/20 pr-10" placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-tm hover:text-ts transition-colors duration-150">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full bg-ac hover:bg-ac-hover text-primary-foreground font-medium transition-colors duration-200 mt-2" disabled={loginMutation.isPending}>
                <LogIn className="mr-2 h-4 w-4" />
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center pt-2">
              <p className="text-sm text-tm">
                Don't have an account?{" "}
                <button onClick={() => setLocation("/signup")} className="text-ac hover:text-ac-hover font-medium transition-colors duration-150">
                  Sign up
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
