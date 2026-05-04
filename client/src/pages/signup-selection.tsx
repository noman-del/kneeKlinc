import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Stethoscope, Heart, ArrowRight } from "lucide-react";

export default function SignupSelection() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-th mb-3 tracking-tight">
            Choose Your <span className="text-ac">Account Type</span>
          </h1>
          <p className="text-tm max-w-xl mx-auto">Select how you'd like to use KneeKlinic to get started</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Patient Signup */}
          <Card className="bg-surface border border-bd hover:border-bs transition-colors duration-200 flex flex-col h-full">
            <CardHeader className="pb-4">
              <div className="w-10 h-10 bg-ac-muted rounded-lg flex items-center justify-center mb-3">
                <Heart className="h-5 w-5 text-ac" />
              </div>
              <CardTitle className="text-xl text-th">I'm a Patient</CardTitle>
              <CardDescription className="text-tm">Get personalized care and track your knee health</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <ul className="space-y-2 flex-1 mb-5">
                <li className="flex items-center space-x-2 text-tm text-sm">
                  <div className="w-1.5 h-1.5 bg-ac rounded-full"></div>
                  <span>Upload and analyze your X-rays with AI</span>
                </li>
                <li className="flex items-center space-x-2 text-tm text-sm">
                  <div className="w-1.5 h-1.5 bg-ac rounded-full"></div>
                  <span>Track symptoms and progress over time</span>
                </li>
                <li className="flex items-center space-x-2 text-tm text-sm">
                  <div className="w-1.5 h-1.5 bg-ac rounded-full"></div>
                  <span>Receive personalized treatment plans</span>
                </li>
                <li className="flex items-center space-x-2 text-tm text-sm">
                  <div className="w-1.5 h-1.5 bg-ac rounded-full"></div>
                  <span>Access educational resources and exercises</span>
                </li>
              </ul>
              <Button className="w-full bg-ac hover:bg-ac-hover text-primary-foreground font-medium transition-colors duration-200" onClick={() => setLocation("/signup/patient")}>
                Sign Up as Patient
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Doctor Signup */}
          <Card className="bg-surface border border-bd hover:border-bs transition-colors duration-200 flex flex-col h-full">
            <CardHeader className="pb-4">
              <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-3">
                <Stethoscope className="h-5 w-5 text-sky-500" />
              </div>
              <CardTitle className="text-xl text-th">I'm a Healthcare Provider</CardTitle>
              <CardDescription className="text-tm">Enhance your diagnostic capabilities with AI tools</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <ul className="space-y-2 flex-1 mb-5">
                <li className="flex items-center space-x-2 text-tm text-sm">
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
                  <span>AI-assisted diagnosis and KL grading</span>
                </li>
                <li className="flex items-center space-x-2 text-tm text-sm">
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
                  <span>Comprehensive patient management system</span>
                </li>
                <li className="flex items-center space-x-2 text-tm text-sm">
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
                  <span>Evidence-based treatment recommendations</span>
                </li>
                <li className="flex items-center space-x-2 text-tm text-sm">
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full"></div>
                  <span>Clinical documentation and reporting tools</span>
                </li>
              </ul>
              <Button className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium transition-colors duration-200" onClick={() => setLocation("/signup/doctor")}>
                Sign Up as Healthcare Provider
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
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
