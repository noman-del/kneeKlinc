import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Stethoscope, Heart, ArrowRight, Sparkles } from "lucide-react";

export default function SignupSelection() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-300/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="w-full max-w-5xl relative z-10">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Stethoscope className="text-white text-3xl" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="text-yellow-800 text-xs" />
              </div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            Choose Your <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Journey</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Choose your account type to get started with personalized knee osteoarthritis care powered by AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Patient Signup */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl group flex flex-col h-full">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="p-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl group-hover:shadow-emerald-500/50 transition-all duration-300">
                    <Heart className="h-14 w-14 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-ping"></div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">I'm a Patient</CardTitle>
              <CardDescription className="text-lg text-slate-300">
                Get personalized care and track your knee health journey
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <ul className="space-y-4 flex-1">
                <li className="flex items-center space-x-3 text-white/90">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-lg"></div>
                  <span className="text-base">Upload and analyze your X-rays with AI</span>
                </li>
                <li className="flex items-center space-x-3 text-white/90">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-lg"></div>
                  <span className="text-base">Track symptoms and progress over time</span>
                </li>
                <li className="flex items-center space-x-3 text-white/90">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-lg"></div>
                  <span className="text-base">Receive personalized treatment plans</span>
                </li>
                <li className="flex items-center space-x-3 text-white/90">
                  <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full shadow-lg"></div>
                  <span className="text-base">Access educational resources and exercises</span>
                </li>
              </ul>
              <div className="pt-6 mt-auto">
                <Button 
                  className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-lg shadow-xl hover:shadow-emerald-500/50 transition-all duration-300 transform hover:scale-105 group"
                  onClick={() => setLocation("/signup/patient")}
                >
                  Sign Up as Patient
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Signup */}
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/15 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl group flex flex-col h-full">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="p-5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-xl group-hover:shadow-cyan-500/50 transition-all duration-300">
                    <Stethoscope className="h-14 w-14 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-ping"></div>
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-white mb-2">I'm a Healthcare Provider</CardTitle>
              <CardDescription className="text-lg text-slate-300">
                Enhance your diagnostic capabilities with AI-powered tools
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <ul className="space-y-4 flex-1">
                <li className="flex items-center space-x-3 text-white/90">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-lg"></div>
                  <span className="text-base">AI-assisted diagnosis and KL grading</span>
                </li>
                <li className="flex items-center space-x-3 text-white/90">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-lg"></div>
                  <span className="text-base">Comprehensive patient management system</span>
                </li>
                <li className="flex items-center space-x-3 text-white/90">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-lg"></div>
                  <span className="text-base">Evidence-based treatment recommendations</span>
                </li>
                <li className="flex items-center space-x-3 text-white/90">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full shadow-lg"></div>
                  <span className="text-base">Clinical documentation and reporting tools</span>
                </li>
              </ul>
              <div className="pt-6 mt-auto">
                <Button 
                  className="w-full h-14 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold text-lg shadow-xl hover:shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105 group"
                  onClick={() => setLocation("/signup/doctor")}
                >
                  Sign Up as Healthcare Provider
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <p className="text-white/90 text-lg">
              Already have an account?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-blue-300 hover:text-blue-200 font-semibold underline decoration-2 underline-offset-4 hover:decoration-blue-300 transition-all duration-300"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
