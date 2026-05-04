import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { UserCheck, Users, TrendingUp, ArrowRight } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-page">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center mb-20 animate-fade-in">
          <div className="mb-10 max-w-4xl mx-auto">
            <img src="/old-patient-close-up.jpg" alt="Knee care" className="w-full h-72 object-cover rounded-xl border border-bd" />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-th mb-6 leading-tight tracking-tight">
            Advanced Knee
            <br />
            <span className="text-ac">Osteoarthritis Management</span>
          </h1>
          <p className="text-lg text-tm mb-10 max-w-3xl mx-auto leading-relaxed">AI-powered assessment and severity prediction with stage-wise lifestyle guidance for healthcare professionals and patients.</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/signup">
              <Button size="lg" className="bg-ac hover:bg-ac-hover text-primary-foreground font-medium px-8 py-3 transition-colors duration-200" data-testid="button-signup">
                <UserCheck className="w-5 h-5 mr-2" />
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="mt-8">
            <p className="text-tm text-sm">
              Already have an account?{" "}
              <button onClick={() => (window.location.href = "/login")} className="text-ac hover:text-ac-hover font-medium transition-colors duration-200" data-testid="link-signin">
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div className="bg-surface border border-bd rounded-xl p-6 hover:border-bs transition-colors duration-200">
            <div className="w-10 h-10 bg-ac-muted rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="text-ac w-5 h-5" />
            </div>
            <h3 className="font-semibold text-th text-lg mb-2">AI-Powered Assessment</h3>
            <p className="text-tm text-sm leading-relaxed">Advanced algorithms analyze X-ray images to predict osteoarthritis severity using Kellgren-Lawrence grading.</p>
          </div>

          <div className="bg-surface border border-bd rounded-xl p-6 hover:border-bs transition-colors duration-200">
            <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="text-sky-500 w-5 h-5" />
            </div>
            <h3 className="font-semibold text-th text-lg mb-2">Doctor-Patient Collaboration</h3>
            <p className="text-tm text-sm leading-relaxed">Secure platform for healthcare professionals to monitor patient progress and provide personalized treatment plans.</p>
          </div>

          <div className="bg-surface border border-bd rounded-xl p-6 hover:border-bs transition-colors duration-200">
            <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center mb-4">
              <UserCheck className="text-violet-500 w-5 h-5" />
            </div>
            <h3 className="font-semibold text-th text-lg mb-2">Lifestyle Guidance</h3>
            <p className="text-tm text-sm leading-relaxed">Personalized recommendations for exercise, diet, and daily activities based on individual osteoarthritis stage.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
