import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { UserCheck, Stethoscope, Users, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-emerald-900/10"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-40 right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>

      {/* Hero Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16 animate-fade-in">
          <div className="mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-teal-600/20 rounded-3xl blur-3xl"></div>
            <img src="/old-patient-close-up.jpg" alt="Knee joint illustration" className="relative w-full h-80 object-cover rounded-3xl shadow-2xl mb-8 glass-card animate-slide-up" />
          </div>
          <h1 className="text-6xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Advanced Knee</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-200 to-teal-200 bg-clip-text text-transparent">Osteoarthritis Management</span>
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-4xl mx-auto font-light leading-relaxed">AI-powered assessment and severity prediction with stage-wise lifestyle guidance for healthcare professionals and patients.</p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up">
            <Link href="/signup">
              <Button size="lg" className="group relative overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 flex items-center space-x-3 medical-shadow transition-all duration-300 px-8 py-4 rounded-2xl hover:scale-105" data-testid="button-signup">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <UserCheck className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10 font-semibold text-lg">Get Started</span>
              </Button>
            </Link>
          </div>

          <div className="mt-10 text-center">
            <p className="text-white/70 text-lg">
              Already have an account?{" "}
              <button onClick={() => (window.location.href = "/login")} className="text-white font-semibold hover:text-blue-200 transition-colors duration-300 underline decoration-2 underline-offset-4 hover:decoration-blue-300" data-testid="link-signin">
                Sign in here
              </button>
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-20">
          <div className="group glass-card rounded-3xl p-8 hover:scale-105 transition-all duration-500 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative mb-6">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                <TrendingUp className="text-white w-8 h-8" />
              </div>
              <div className="absolute top-0 left-0 w-16 h-16 gradient-primary rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
            </div>
            <h3 className="font-display font-bold text-white text-2xl mb-4 group-hover:text-blue-100 transition-colors duration-300">AI-Powered Assessment</h3>
            <p className="text-white/90 text-base leading-relaxed group-hover:text-white transition-colors duration-300">Advanced machine learning algorithms analyze X-ray images to predict osteoarthritis severity using Kellgren-Lawrence grading.</p>
          </div>

          <div className="group glass-card rounded-3xl p-8 hover:scale-105 transition-all duration-500 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <div className="relative mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                <Users className="text-white w-8 h-8" />
              </div>
              <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
            </div>
            <h3 className="font-display font-bold text-white text-2xl mb-4 group-hover:text-pink-100 transition-colors duration-300">Doctor-Patient Collaboration</h3>
            <p className="text-white/90 text-base leading-relaxed group-hover:text-white transition-colors duration-300">Secure platform for healthcare professionals to monitor patient progress and provide personalized treatment plans.</p>
          </div>

          <div className="group glass-card rounded-3xl p-8 hover:scale-105 transition-all duration-500 animate-slide-up" style={{ animationDelay: "0.6s" }}>
            <div className="relative mb-6">
              <div className="w-16 h-16 gradient-secondary rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform duration-300">
                <UserCheck className="text-white w-8 h-8" />
              </div>
              <div className="absolute top-0 left-0 w-16 h-16 gradient-secondary rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-300"></div>
            </div>
            <h3 className="font-display font-bold text-white text-2xl mb-4 group-hover:text-green-100 transition-colors duration-300">Lifestyle Guidance</h3>
            <p className="text-white/90 text-base leading-relaxed group-hover:text-white transition-colors duration-300">Personalized recommendations for exercise, diet, and daily activities based on individual osteoarthritis stage.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
