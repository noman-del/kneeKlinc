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
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [doctorAnalyses, setDoctorAnalyses] = useState<any[]>([]);
  const [isLoadingDoctorAnalyses, setIsLoadingDoctorAnalyses] = useState(false);
  const [doctorAnalysesError, setDoctorAnalysesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonalRecommendations = async () => {
      if (!isPatient) return;
      try {
        setIsLoadingRecommendations(true);
        setRecommendationsError(null);
        const token = localStorage.getItem("token");
        const response = await fetch("/api/patient/recommendations", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!response.ok) {
          if (response.status === 403 || response.status === 404) {
            return;
          }
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || "Failed to load recommendations");
        }

        const data = await response.json();
        if (data?.recommendationProfile?.recommendations?.length) {
          const mapped = data.recommendationProfile.recommendations.map((rec: string, idx: number) => ({
            icon: idx === 0 ? "Activity" : idx === 1 ? "Heart" : idx === 2 ? "Target" : "Brain",
            title: rec.split(":")[0] || "Recommendation",
            description: rec,
            isNew: false,
          }));
          setLatestRecommendations(mapped);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load recommendations";
        setRecommendationsError(message);
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    fetchPersonalRecommendations();
  }, [isPatient]);

  useEffect(() => {
    const fetchRecentAnalyses = async () => {
      if (!isPatient) return;
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/ai/analyses", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!response.ok) {
          if (response.status === 403 || response.status === 404) {
            return;
          }
          return;
        }

        const data = await response.json();
        if (Array.isArray(data?.analyses)) {
          setRecentAnalyses(data.analyses);
        }
      } catch {
        // Silent fail for recent analyses; keep static placeholder if desired
      }
    };

    fetchRecentAnalyses();
  }, [isPatient]);

  useEffect(() => {
    const fetchDoctorAnalyses = async () => {
      if (!isDoctor) return;
      try {
        setIsLoadingDoctorAnalyses(true);
        setDoctorAnalysesError(null);

        const token = localStorage.getItem("token");
        const response = await fetch("/api/ai/doctor/patient-analyses", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });

        if (!response.ok) {
          if (response.status === 403 || response.status === 404) {
            setDoctorAnalyses([]);
            return;
          }
          const data = await response.json().catch(() => null);
          throw new Error(data?.message || "Failed to load patient analyses");
        }

        const data = await response.json();
        if (Array.isArray(data?.analyses)) {
          setDoctorAnalyses(data.analyses);
        } else {
          setDoctorAnalyses([]);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load patient analyses";
        setDoctorAnalysesError(message);
      } finally {
        setIsLoadingDoctorAnalyses(false);
      }
    };

    fetchDoctorAnalyses();
  }, [isDoctor]);

  const doctorUniquePatientsCount = isDoctor ? new Set(doctorAnalyses.map((a: any) => a.patientUserId)).size : 0;
  const doctorTotalAnalyses = isDoctor ? doctorAnalyses.length : 0;
  const doctorHighRiskCount = isDoctor ? doctorAnalyses.filter((a: any) => typeof a.riskScore === "number" && a.riskScore >= 70).length : 0;
  const doctorSevereGradeCount = isDoctor
    ? doctorAnalyses.filter((a: any) => {
        const gradeNum = typeof a.klGrade === "string" ? parseInt(a.klGrade, 10) : Number(a.klGrade);
        return !isNaN(gradeNum) && gradeNum >= 3;
      }).length
    : 0;
  const doctorSevereGradePercentage = doctorTotalAnalyses ? Math.round((doctorSevereGradeCount / doctorTotalAnalyses) * 100) : 0;
  const doctorLatestAnalysisDateLabel = (() => {
    if (!isDoctor || doctorAnalyses.length === 0) return "No recent assessments";
    const latest = doctorAnalyses[0];
    if (!latest?.analysisDate) return "No recent assessments";
    const d = new Date(latest.analysisDate);
    if (isNaN(d.getTime())) return "No recent assessments";
    return d.toLocaleDateString();
  })();

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-th mb-2 tracking-tight">
            Welcome to <span className="text-ac">KneeKlinic</span>
          </h1>
          <p className="text-tm">{isDoctor ? "Your platform for knee osteoarthritis patient management" : "Your intelligent companion for knee health management and recovery"}</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-5xl mx-auto">
          <div className="bg-surface border border-bd rounded-lg p-6 hover:border-bs transition-colors duration-200 flex flex-col">
            <div className="w-10 h-10 bg-ac-muted rounded-lg flex items-center justify-center mb-4">
              <Brain className="text-ac w-5 h-5" />
            </div>
            <h3 className="font-semibold text-th text-lg mb-1">AI Analysis</h3>
            <p className="text-tm text-sm mb-4 flex-1">{isDoctor ? "Review AI assessments for your patients" : "Upload knee X-rays for AI-powered assessment"}</p>
            <Button className="w-full bg-ac hover:bg-ac-hover text-primary-foreground font-medium transition-colors duration-200" data-testid="button-ai-analysis" onClick={() => (window.location.href = "/xray-upload")}>
              <Brain className="w-4 h-4 mr-2" />
              {isDoctor ? "Review Assessments" : "Start AI Analysis"}
            </Button>
          </div>

          <div className="bg-surface border border-bd rounded-lg p-6 hover:border-bs transition-colors duration-200 flex flex-col">
            <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="text-sky-400 w-5 h-5" />
            </div>
            <h3 className="font-semibold text-th text-lg mb-1">{isDoctor ? "Active Patients" : "Progress"}</h3>
            <p className="text-tm text-sm mb-4 flex-1">{isDoctor ? "Monitor patient progress and treatment plans" : "Track your recovery and lifestyle goals"}</p>
            <Button className="w-full bg-surface-alt border border-bd hover:bg-surface text-th font-medium transition-colors duration-200" data-testid="button-tracking" onClick={() => (window.location.href = "/progress")}>
              <TrendingUp className="w-4 h-4 mr-2" />
              {isDoctor ? "View Patients" : "View Progress"}
            </Button>
          </div>

          <div className="bg-surface border border-bd rounded-lg p-6 hover:border-bs transition-colors duration-200 flex flex-col">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center mb-4">
              <Stethoscope className="text-amber-400 w-5 h-5" />
            </div>
            <h3 className="font-semibold text-th text-lg mb-1">Consultations</h3>
            <p className="text-tm text-sm mb-4 flex-1">{isDoctor ? "Manage your consultation schedule" : "Connect with healthcare professionals"}</p>
            <Button className="w-full bg-surface-alt border border-bd hover:bg-surface text-th font-medium transition-colors duration-200" data-testid="button-consultations" onClick={() => (window.location.href = "/appointments")}>
              <Calendar className="w-4 h-4 mr-2" />
              {isDoctor ? "View Schedule" : "Book Appointment"}
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch max-w-5xl mx-auto">
          {/* Recent Activity */}
          <div className="bg-surface border border-bd rounded-lg p-6 h-full">
            <div className="flex items-center space-x-3 mb-5">
              <FileText className="w-5 h-5 text-ac" />
              <h2 className="text-lg font-semibold text-th">{isDoctor ? "Recent Patient Assessments" : "Recent AI Assessments"}</h2>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {isDoctor ? (
                <>
                  {doctorAnalysesError && <div className="mb-2 text-xs text-red-400">{doctorAnalysesError}</div>}
                  {isLoadingDoctorAnalyses ? (
                    <div className="flex items-center space-x-3 p-4 bg-surface-alt border border-bd rounded-lg">
                      <div className="w-9 h-9 bg-ac-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-ac" />
                      </div>
                      <div>
                        <h3 className="font-medium text-th text-sm">Loading patient assessments...</h3>
                        <p className="text-tm text-xs">Fetching recent AI assessments.</p>
                      </div>
                    </div>
                  ) : doctorAnalyses.length > 0 ? (
                    doctorAnalyses.map((a: any, idx: number) => {
                      const date = a.analysisDate ? new Date(a.analysisDate) : null;
                      const dateLabel = date ? date.toLocaleDateString() : "";
                      const subtitle = `KL Grade ${a.klGrade} • ${a.severity} OA • Risk ${a.riskScore}%`;
                      return (
                        <div key={a.id || idx} className="flex items-center justify-between p-4 bg-surface-alt border border-bd rounded-lg hover:border-bs transition-colors duration-150">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 bg-ac-muted rounded-lg flex items-center justify-center flex-shrink-0">
                              <Brain className="w-4 h-4 text-ac" />
                            </div>
                            <div>
                              <h3 className="font-medium text-th text-sm" data-testid="text-assessment-title">
                                {a.patientName || "Patient"}
                              </h3>
                              <p className="text-tm text-xs" data-testid="text-assessment-details">
                                {subtitle}
                              </p>
                            </div>
                          </div>
                          <span className="text-tm text-xs">{dateLabel}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center space-x-3 p-4 bg-surface-alt border border-bd rounded-lg">
                      <div className="w-9 h-9 bg-ac-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <Brain className="w-4 h-4 text-ac" />
                      </div>
                      <div>
                        <h3 className="font-medium text-th text-sm">No patient assessments</h3>
                        <p className="text-tm text-xs">Patient analyses will appear here once saved.</p>
                      </div>
                    </div>
                  )}
                </>
              ) : isPatient && recentAnalyses.length > 0 ? (
                recentAnalyses.map((a, idx) => {
                  const date = a.analysisDate ? new Date(a.analysisDate) : null;
                  const dateLabel = date ? date.toLocaleDateString() : "";
                  const subtitle = `KL Grade ${a.klGrade} • ${a.severity} OA • Risk ${a.riskScore}%`;
                  return (
                    <div key={a.id || idx} className="flex items-center justify-between p-4 bg-surface-alt border border-bd rounded-lg hover:border-bs transition-colors duration-150">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 bg-ac-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <Brain className="w-4 h-4 text-ac" />
                        </div>
                        <div>
                          <h3 className="font-medium text-th text-sm" data-testid="text-assessment-title">
                            Knee X-ray Analysis
                          </h3>
                          <p className="text-tm text-xs" data-testid="text-assessment-details">
                            {subtitle}
                          </p>
                        </div>
                      </div>
                      <span className="text-tm text-xs">{dateLabel}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center space-x-3 p-4 bg-surface-alt border border-bd rounded-lg">
                  <div className="w-9 h-9 bg-ac-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-ac" />
                  </div>
                  <div>
                    <h3 className="font-medium text-th text-sm">No recent assessments</h3>
                    <p className="text-tm text-xs">Complete an AI X-ray analysis and save it to see it here.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations/Insights */}
          <div id="recommendations-section" className="bg-surface border border-bd rounded-lg p-6 h-full">
            <div className="flex items-center space-x-3 mb-5">
              <Target className="w-5 h-5 text-ac" />
              <h2 className="text-lg font-semibold text-th">{isDoctor ? "Clinical Insights" : "Lifestyle Recommendations"}</h2>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {isDoctor ? (
                <>
                  <div className="p-4 bg-surface-alt border border-bd rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Brain className="text-ac w-4 h-4" />
                      <span className="font-medium text-th text-sm">AI Insights</span>
                    </div>
                    <p className="text-tm text-sm">{doctorTotalAnalyses > 0 ? `${doctorSevereGradePercentage}% of your saved assessments are KL Grade 3 or higher across ${doctorUniquePatientsCount} patients.` : "Once your patients have saved AI assessments, you'll see grade distribution insights here."}</p>
                  </div>
                  <div className="p-4 bg-surface-alt border border-bd rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Heart className="text-sky-400 w-4 h-4" />
                      <span className="font-medium text-th text-sm">Patient Outcomes</span>
                    </div>
                    <p className="text-tm text-sm">{doctorTotalAnalyses > 0 ? `${doctorHighRiskCount} of your patients are currently flagged as high risk (risk score ≥ 70%).` : "High-risk patient counts will be highlighted here once assessments are available."}</p>
                  </div>
                  <div className="p-4 bg-surface-alt border border-bd rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity className="text-amber-400 w-4 h-4" />
                      <span className="font-medium text-th text-sm">Patient Activity</span>
                    </div>
                    <p className="text-tm text-sm">{doctorTotalAnalyses > 0 ? `Most recent saved assessment was on ${doctorLatestAnalysisDateLabel}.` : "As patients progress through treatment, the latest assessment date will appear here."}</p>
                  </div>
                </>
              ) : (
                <>
                  {latestRecommendations.length > 0 ? (
                    latestRecommendations.map((rec, index) => {
                      const iconIndex = index % 3;
                      return (
                        <div key={index} className="p-4 bg-surface-alt border border-bd rounded-lg flex items-center space-x-3">
                          <div className="w-9 h-9 bg-ac-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            {iconIndex === 0 && <Activity className="w-4 h-4 text-ac" />}
                            {iconIndex === 1 && <Heart className="w-4 h-4 text-ac" />}
                            {iconIndex === 2 && <Brain className="w-4 h-4 text-ac" />}
                          </div>
                          <p className="text-ts text-sm">{rec.description}</p>
                        </div>
                      );
                    })
                  ) : (
                    <>
                      <div className="p-4 bg-surface-alt border border-bd rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Activity className="text-amber-400 w-4 h-4" />
                          <span className="font-medium text-th text-sm">Physical Therapy</span>
                        </div>
                        <p className="text-tm text-sm">Continue range of motion exercises daily</p>
                      </div>
                      <div className="p-4 bg-surface-alt border border-bd rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Heart className="text-sky-400 w-4 h-4" />
                          <span className="font-medium text-th text-sm">Anti-inflammatory Diet</span>
                        </div>
                        <p className="text-tm text-sm">Include omega-3 rich foods and reduce processed foods</p>
                      </div>
                      <div className="p-4 bg-surface-alt border border-bd rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="text-violet-400 w-4 h-4" />
                          <span className="font-medium text-th text-sm">Strength Training</span>
                        </div>
                        <p className="text-tm text-sm">Low-impact quadriceps strengthening 3x per week</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
