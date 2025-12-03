import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Brain, TrendingUp, Stethoscope, Activity, Calendar, FileText, Heart, Target, X } from "lucide-react";
import { useState, useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const isDoctor = (user as any)?.userType === "doctor";
  const isPatient = (user as any)?.userType === "patient";
  const [latestRecommendations, setLatestRecommendations] = useState<any[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Load latest recommendations from localStorage
  useEffect(() => {
    const recommendations = JSON.parse(localStorage.getItem("latestRecommendations") || "[]");
    setLatestRecommendations(recommendations);

    // Auto-scroll to recommendations section if URL has hash
    if (window.location.hash === "#recommendations-section") {
      setTimeout(() => {
        const element = document.getElementById("recommendations-section");
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        // Clear the hash after scrolling to prevent auto-scroll on reload
        window.history.replaceState({}, "", window.location.pathname);
      }, 500);
    }
  }, []);


  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/10 via-transparent to-purple-900/10"></div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-40 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
                    <span className="text-4xl">🦴</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                    <span className="text-sm">✨</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight">
                    Welcome to <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl">JointSense AI</span>
                  </h1>
                  <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">{isDoctor ? "Your comprehensive platform for knee osteoarthritis patient management" : "Your intelligent companion for knee health management and recovery"}</p>
                  {!isDoctor && (
                    <div className="flex items-center justify-center space-x-6 mt-8">
                      <div className="flex items-center space-x-2 text-emerald-300">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">AI-Powered Analysis</span>
                      </div>
                      <div className="flex items-center space-x-2 text-purple-300">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Real-time Monitoring</span>
                      </div>
                      <div className="flex items-center space-x-2 text-indigo-300">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">Expert Guidance</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {/* AI Assessment Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-500/20 to-gray-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-slate-50/12 to-gray-50/12 backdrop-blur-xl border border-slate-200/25 shadow-2xl rounded-3xl p-8 hover:scale-105 transition-all duration-500 hover:bg-gradient-to-br hover:from-slate-50/18 hover:to-gray-50/18">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-slate-600 to-gray-600 rounded-3xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 shadow-2xl">
                    <Brain className="text-white w-10 h-10" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-slate-400 to-gray-400 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-xs">🧠</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-white text-2xl group-hover:text-indigo-200 transition-colors duration-300">AI Analysis</h3>
                  <p className="text-slate-300 text-sm leading-relaxed group-hover:text-white transition-colors duration-300">{isDoctor ? "Review AI assessments for your patients" : "Upload knee X-rays for instant AI-powered osteoarthritis assessment"}</p>
                </div>
                <Button className="w-full h-14 bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-slate-500/30 border border-white/20" data-testid="button-ai-analysis" onClick={() => (window.location.href = "/xray-upload")}>
                  <Brain className="w-5 h-5 mr-2" />
                  {isDoctor ? "Review Assessments" : "Start AI Analysis"}
                </Button>
              </div>
            </div>
          </div>

          {/* Tracking/Patient Management Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/25 to-teal-500/25 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-cyan-50/15 to-teal-50/15 backdrop-blur-xl border border-cyan-200/30 shadow-2xl rounded-3xl p-8 hover:scale-105 transition-all duration-500 hover:bg-gradient-to-br hover:from-cyan-50/20 hover:to-teal-50/20">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-3xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 shadow-2xl">
                    <TrendingUp className="text-white w-10 h-10" />
                  </div>
                  <div className="absolute -top-1 -right-1 px-2 py-1 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full text-xs font-bold text-slate-800">{isDoctor ? "24" : "92%"}</div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-white text-2xl group-hover:text-sky-200 transition-colors duration-300">{isDoctor ? "Active Patients" : "Progress Score"}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed group-hover:text-white transition-colors duration-300">{isDoctor ? "Monitor patient progress and treatment plans" : "Your daily lifestyle and recovery goal achievements with detailed progress tracking"}</p>
                </div>
                <Button className="w-full h-14 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-cyan-500/30 border border-white/20" data-testid="button-tracking" onClick={() => (window.location.href = "/progress")}>
                  <TrendingUp className="w-5 h-5 mr-2" />
                  {isDoctor ? "View Patients" : "View Progress"}
                </Button>
              </div>
            </div>
          </div>

          {/* Consultation Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-stone-500/20 to-neutral-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-stone-50/12 to-neutral-50/12 backdrop-blur-xl border border-stone-200/25 shadow-2xl rounded-3xl p-8 hover:scale-105 transition-all duration-500 hover:bg-gradient-to-br hover:from-stone-50/18 hover:to-neutral-50/18">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-stone-600 to-neutral-600 rounded-3xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 shadow-2xl">
                    <Stethoscope className="text-white w-10 h-10" />
                  </div>
                  <div className="absolute -top-1 -right-1 px-2 py-1 bg-gradient-to-r from-stone-400 to-neutral-400 rounded-full text-xs font-bold text-slate-800">{isDoctor ? "Today" : "Wed"}</div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-white text-2xl group-hover:text-emerald-200 transition-colors duration-300">Consultations</h3>
                  <p className="text-slate-300 text-sm leading-relaxed group-hover:text-white transition-colors duration-300">{isDoctor ? "Manage your consultation schedule" : "Connect with healthcare professionals for expert guidance"}</p>
                </div>
                <Button className="w-full h-14 bg-gradient-to-r from-stone-600 to-neutral-600 hover:from-stone-700 hover:to-neutral-700 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-stone-500/30 border border-white/20" data-testid="button-consultations" onClick={() => (window.location.href = "/appointments")}>
                  <Calendar className="w-5 h-5 mr-2" />
                  {isDoctor ? "View Schedule" : "Book Appointment"}
                </Button>
              </div>
            </div>
          </div>

          {/* IoT Monitoring Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
            <div className="relative bg-gradient-to-br from-indigo-50/12 to-blue-50/12 backdrop-blur-xl border border-indigo-200/25 shadow-2xl rounded-3xl p-8 hover:scale-105 transition-all duration-500 hover:bg-gradient-to-br hover:from-indigo-50/18 hover:to-blue-50/18">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 shadow-2xl">
                    <Activity className="text-white w-10 h-10" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-indigo-400 to-blue-400 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-800 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-bold text-white text-2xl group-hover:text-purple-200 transition-colors duration-300">{isDoctor ? "Live Monitoring" : "Smart Tracking"}</h3>
                  <p className="text-slate-300 text-sm leading-relaxed group-hover:text-white transition-colors duration-300">{isDoctor ? "Real-time patient sensor data and activity monitoring" : "IoT knee band provides continuous movement and recovery tracking"}</p>
                </div>
                <Button className="w-full h-14 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-indigo-500/30 border border-white/20" data-testid="button-monitoring">
                  <Activity className="w-5 h-5 mr-2" />
                  View Live Data
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Recent Activity */}
          <div className="relative h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 h-full">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-indigo-500 rounded-2xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">{isDoctor ? "Recent Patient Assessments" : "Recent AI Assessments"}</h2>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex items-center justify-between p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base" data-testid="text-assessment-title">
                        {isDoctor ? "Patient: Sarah Johnson" : "Knee X-ray Analysis"}
                      </h3>
                      <p className="text-white/70 text-sm" data-testid="text-assessment-details">
                        {isDoctor ? "Moderate OA progression detected" : "Moderate osteoarthritis detected"}
                      </p>
                    </div>
                  </div>
                  <span className="text-white/60 text-xs">2 hours ago</span>
                </div>

                <div className="flex items-center justify-between p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-base" data-testid="text-progress-title">
                        {isDoctor ? "Treatment Progress" : "Progress Update"}
                      </h3>
                      <p className="text-white/70 text-sm" data-testid="text-progress-details">
                        {isDoctor ? "Improved adherence score" : "Monthly assessment completed"}
                      </p>
                    </div>
                  </div>
                  <span className="text-white/60 text-xs">1 week ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations/Insights */}
          <div id="recommendations-section" className="relative h-full">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-emerald-500/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-600 to-purple-500 rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">{isDoctor ? "Clinical Insights" : "Lifestyle Recommendations"}</h2>
              </div>

              <div className="space-y-6">
                {isDoctor ? (
                  <>
                    <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-3">
                        <Brain className="text-slate-300 w-6 h-6" />
                        <span className="font-semibold text-white text-lg">AI Insights</span>
                      </div>
                      <p className="text-white/80 leading-relaxed">15% increase in Grade 3 OA cases this month. Consider preventive care protocols.</p>
                    </div>
                    <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-3">
                        <Heart className="text-blue-300 w-6 h-6" />
                        <span className="font-semibold text-white text-lg">Patient Outcomes</span>
                      </div>
                      <p className="text-white/80 leading-relaxed">Patients with IoT monitoring show 30% better adherence rates.</p>
                    </div>
                    <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300">
                      <div className="flex items-center space-x-3 mb-3">
                        <Activity className="text-orange-300 w-6 h-6" />
                        <span className="font-semibold text-white text-lg">Patient Activity</span>
                      </div>
                      <p className="text-white/80 leading-relaxed">Patients with regular physical activity show 25% better OA management.</p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Always show recommendations - AI ones first, then default ones */}
                    {latestRecommendations.length > 0 ? (
                      latestRecommendations.map((rec, index) => (
                        <div key={index} className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300">
                          <div className="flex items-center space-x-3 mb-3">
                            {rec.icon === "Activity" && <Activity className="text-orange-300 w-6 h-6" />}
                            {rec.icon === "Heart" && <Heart className="text-blue-300 w-6 h-6" />}
                            {rec.icon === "Target" && <Target className="text-purple-300 w-6 h-6" />}
                            {rec.icon === "Brain" && <Brain className="text-slate-300 w-6 h-6" />}
                            <span className="font-semibold text-white text-lg">{rec.title}</span>
                          </div>
                          <p className="text-white/80 leading-relaxed">{rec.description}</p>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300">
                          <div className="flex items-center space-x-3 mb-3">
                            <Activity className="text-orange-300 w-6 h-6" />
                            <span className="font-semibold text-white text-lg">Physical Therapy</span>
                          </div>
                          <p className="text-white/80 leading-relaxed">Continue range of motion exercises daily</p>
                        </div>
                        <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300">
                          <div className="flex items-center space-x-3 mb-3">
                            <Heart className="text-blue-300 w-6 h-6" />
                            <span className="font-semibold text-white text-lg">Anti-inflammatory Diet</span>
                          </div>
                          <p className="text-white/80 leading-relaxed">Include omega-3 rich foods and reduce processed foods</p>
                        </div>
                        <div className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300">
                          <div className="flex items-center space-x-3 mb-3">
                            <Target className="text-purple-300 w-6 h-6" />
                            <span className="font-semibold text-white text-lg">Strength Training</span>
                          </div>
                          <p className="text-white/80 leading-relaxed">Low-impact quadriceps strengthening 3x per week</p>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        </div>
      </div>
    </div>
  );
}
