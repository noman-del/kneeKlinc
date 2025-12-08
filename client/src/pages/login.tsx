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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-emerald-900/10"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-40 right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-lg relative z-10">
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="p-6 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                    <LogIn className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Sparkles className="text-yellow-800 text-xs" />
                  </div>
                </div>
              </div>
              <CardTitle className="text-4xl font-bold text-white mb-4 tracking-tight">
                Welcome <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Back</span>
              </CardTitle>
              <CardDescription className="text-xl text-slate-300">Sign in to your JointSense AI account and continue your journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email */}
                <div className="space-y-4">
                  <Label htmlFor="email" className="text-white font-medium text-lg">
                    Email Address
                  </Label>
                  <Input id="email" type="email" {...register("email")} className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20 h-14 text-lg" placeholder="Enter your email address" />
                  {errors.email && <p className="text-sm text-emerald-300">{errors.email.message}</p>}
                </div>

                {/* Password */}
                <div className="space-y-4">
                  <Label htmlFor="password" className="text-white font-medium text-lg">
                    Password
                  </Label>
                  <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} {...register("password")} className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-emerald-400 focus:ring-emerald-400/20 h-14 text-lg pr-14" placeholder="Enter your password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-emerald-300 transition-colors duration-200">
                      {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-sm text-emerald-300">{errors.password.message}</p>}
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button type="submit" className="w-full h-14 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white font-semibold text-lg shadow-xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-105" disabled={loginMutation.isPending}>
                    <LogIn className="mr-3 h-6 w-6" />
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
              </form>

              {/* Divider */}
              <div className="text-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/20" />
                  </div>
                  <div className="relative flex justify-center text-sm uppercase">
                    <span className="bg-gradient-to-r from-indigo-900 to-purple-900 px-4 text-white/90 font-medium tracking-wider">Or</span>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <p className="text-white/90 text-lg">
                    Don't have an account?{" "}
                    <button onClick={() => setLocation("/signup")} className="text-emerald-300 hover:text-emerald-200 font-semibold underline decoration-2 underline-offset-4 hover:decoration-emerald-300 transition-all duration-300">
                      Sign up here
                    </button>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
