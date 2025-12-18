import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Activity, Calendar, Download, Eye } from "lucide-react";

interface PatientAnalysisBase {
  id: string;
  klGrade: string;
  severity: string;
  riskScore: number;
  oaStatus: boolean;
  recommendations: string[];
  xrayImageUrl: string;
  analysisDate: string;
  createdAt: string;
}

interface PatientAnalysis extends PatientAnalysisBase {}

interface DoctorPatientAnalysis extends PatientAnalysisBase {
  patientUserId: string;
  patientName: string;
  patientEmail?: string;
}

export default function Progress() {
  const [analyses, setAnalyses] = useState<PatientAnalysis[]>([]);
  const [doctorAnalyses, setDoctorAnalyses] = useState<DoctorPatientAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<PatientAnalysisBase | null>(null);
  const [userType, setUserType] = useState<string | null>(null);
  const [editableRecommendations, setEditableRecommendations] = useState<string[]>([]);
  const [savingDoctorRecs, setSavingDoctorRecs] = useState(false);
  const [doctorRecsError, setDoctorRecsError] = useState<string | null>(null);
  const [doctorRecsSuccess, setDoctorRecsSuccess] = useState<string | null>(null);

  useEffect(() => {
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw);
        setUserType(parsed.userType || null);
      } catch {
        setUserType(null);
      }
    }

    fetchAnalyses();
  }, []);

  // Auto-clear doctor error/success messages after a few seconds
  useEffect(() => {
    if (!doctorRecsError && !doctorRecsSuccess) return;
    const timer = setTimeout(() => {
      setDoctorRecsError(null);
      setDoctorRecsSuccess(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [doctorRecsError, doctorRecsSuccess]);

  const fetchAnalyses = async () => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (user.userType === "doctor") {
        const response = await fetch("/api/ai/doctor/patient-analyses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setDoctorAnalyses(data.analyses || []);
      } else {
        const response = await fetch("/api/ai/analyses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setAnalyses(data.analyses || []);
      }
    } catch (error) {
      console.error("Failed to fetch analyses:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "0":
        return "text-emerald-400 bg-emerald-900/30 border-emerald-700";
      case "1":
        return "text-green-400 bg-green-900/30 border-green-700";
      case "2":
        return "text-yellow-400 bg-yellow-900/30 border-yellow-700";
      case "3":
        return "text-orange-400 bg-orange-900/30 border-orange-700";
      case "4":
        return "text-red-400 bg-red-900/30 border-red-700";
      default:
        return "text-slate-400 bg-slate-900/30 border-slate-700";
    }
  };

  const getTrendIcon = () => {
    if (analyses.length < 2) return null;
    const latest = parseInt(analyses[0].klGrade);
    const previous = parseInt(analyses[1].klGrade);
    if (latest < previous) {
      return <TrendingDown className="w-5 h-5 text-emerald-400" />;
    } else if (latest > previous) {
      return <TrendingUp className="w-5 h-5 text-red-400" />;
    }
    return <Activity className="w-5 h-5 text-blue-400" />;
  };

  const downloadReport = (analysis: PatientAnalysisBase) => {
    const report = `
KneeKlinic AI Analysis Report
=============================
Date: ${new Date(analysis.analysisDate).toLocaleDateString()}
KL Grade: ${analysis.klGrade}
Severity: ${analysis.severity}
Risk Score: ${analysis.riskScore}%
OA Status: ${analysis.oaStatus ? "Detected" : "Not Detected"}

Recommendations:
${analysis.recommendations.map((rec: string, idx: number) => `${idx + 1}. ${rec}`).join("\n")}
    `;
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `knee-analysis-${analysis.id}.txt`;
    a.click();
  };

  const startEditingDoctorAnalysis = (analysis: DoctorPatientAnalysis) => {
    if (selectedAnalysis?.id === analysis.id) {
      // toggle off
      setSelectedAnalysis(null);
      setEditableRecommendations([]);
      setDoctorRecsError(null);
      return;
    }
    setSelectedAnalysis(analysis);
    setEditableRecommendations(analysis.recommendations.slice());
    setDoctorRecsError(null);
  };

  const saveDoctorRecommendations = async () => {
    if (!selectedAnalysis) return;
    const trimmed = editableRecommendations.map((r) => r.trim()).filter((r) => r.length > 0);
    if (trimmed.length === 0) {
      setDoctorRecsError("Please provide at least one recommendation.");
      return;
    }

    try {
      setSavingDoctorRecs(true);
      setDoctorRecsError(null);
      setDoctorRecsSuccess(null);
      const token = localStorage.getItem("token");

      const resp = await fetch(`/api/doctor/analyses/${selectedAnalysis.id}/recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ recommendations: trimmed }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setDoctorRecsError(data.message || "Failed to update recommendations.");
        return;
      }

      // Update local doctorAnalyses so doctor sees latest edited recs
      setDoctorAnalyses((prev) => prev.map((a) => (a.id === selectedAnalysis.id ? { ...a, recommendations: trimmed } : a)));

      setDoctorRecsSuccess("Recommendations updated successfully.");

      // Close editor after successful save
      setSelectedAnalysis(null);
      setEditableRecommendations([]);
    } catch (error) {
      console.error("Failed to save doctor recommendations", error);
      setDoctorRecsError("Failed to update recommendations. Please try again.");
    } finally {
      setSavingDoctorRecs(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{userType === "doctor" ? "Patient Analysis Overview" : "Progress Dashboard"}</h1>
          <p className="text-slate-300">{userType === "doctor" ? "Review AI analysis history for your patients" : "Track your knee health journey over time"}</p>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading your progress...</p>
        ) : userType === "doctor" ? (
          doctorAnalyses.length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="text-center py-12">
                <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 mb-2">No patient analyses available yet</p>
                <p className="text-slate-500 text-sm">Patient AI analyses will appear here once they save their results to progress.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800/60 border-slate-700/80 shadow-2xl shadow-black/40">
              <CardHeader>
                <CardTitle className="text-white">Analysis History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {doctorAnalyses
                    .reduce((acc: DoctorPatientAnalysis[], analysis) => {
                      if (!acc.some((a) => a.patientUserId === analysis.patientUserId)) {
                        acc.push(analysis);
                      }
                      return acc;
                    }, [])
                    .map((analysis) => (
                      <div key={analysis.id} className="bg-slate-900/70 border border-slate-700/80 rounded-2xl px-5 py-4 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <span className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-slate-800/80 text-emerald-300 border-emerald-500/60">{analysis.patientName}</span>
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getGradeColor(analysis.klGrade)}`}>KL Grade {analysis.klGrade}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <p className="text-slate-400 text-xs mb-1">Severity</p>
                                <p className="text-white font-medium text-sm">{analysis.severity}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs mb-1">Risk Score</p>
                                <p className="text-white font-medium text-sm">{analysis.riskScore}%</p>
                              </div>
                              <div>
                                <p className="text-slate-400 text-xs mb-1">OA Status</p>
                                <p className={`font-medium text-sm ${analysis.oaStatus ? "text-yellow-400" : "text-emerald-400"}`}>{analysis.oaStatus ? "Detected" : "Not Detected"}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-stretch gap-2 min-w-[170px]">
                            <Button size="sm" variant="outline" onClick={() => startEditingDoctorAnalysis(analysis)} className="border-slate-600 bg-slate-800/80 text-slate-100 hover:bg-slate-700 hover:text-white text-xs">
                              <Eye className="w-4 h-4 mr-1" />
                              {selectedAnalysis?.id === analysis.id ? "Hide Editor" : "View & Edit Recommendations"}
                            </Button>
                          </div>
                        </div>

                        {selectedAnalysis?.id === analysis.id && (
                          <div className="mt-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-4">
                            {doctorRecsError && <p className="text-xs text-red-400 mb-2">{doctorRecsError}</p>}
                            {doctorRecsSuccess && !doctorRecsError && <p className="text-xs text-emerald-400 mb-2">{doctorRecsSuccess}</p>}
                            <p className="text-slate-200 text-sm mb-3 font-medium">Edit lifestyle recommendations for this patient:</p>
                            <div className="space-y-3 mb-3">
                              {editableRecommendations.map((rec, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                  <div className="flex-1 bg-slate-800 border border-slate-700 rounded-full px-4 py-3 flex items-center">
                                    <textarea
                                      value={rec}
                                      onChange={(e) => {
                                        const next = editableRecommendations.slice();
                                        next[idx] = e.target.value;
                                        setEditableRecommendations(next);
                                      }}
                                      className="w-full bg-transparent text-sm text-slate-100 resize-none leading-snug outline-none"
                                      rows={1}
                                    />
                                  </div>
                                  <Button type="button" size="icon" variant="outline" onClick={() => setEditableRecommendations((prev) => prev.filter((_, i) => i !== idx))} className="h-8 w-8 rounded-full border-slate-500 bg-slate-100 text-slate-800 hover:bg-red-500 hover:text-white hover:border-red-500 flex items-center justify-center">
                                    ×
                                  </Button>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <Button type="button" size="sm" variant="outline" onClick={() => setEditableRecommendations((prev) => [...prev, ""])} className="rounded-full px-4 border-slate-500 bg-slate-100 text-slate-900 hover:bg-slate-200 text-xs">
                                + Add Recommendation
                              </Button>
                              <Button type="button" size="sm" onClick={saveDoctorRecommendations} disabled={savingDoctorRecs || editableRecommendations.some((r) => !r.trim())} className="rounded-full px-5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs disabled:opacity-60">
                                {savingDoctorRecs ? "Saving..." : "Save Changes"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )
        ) : analyses.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="text-center py-12">
              <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-4">No AI analyses yet</p>
              <Button onClick={() => (window.location.href = "/xray-upload")} className="bg-indigo-600 hover:bg-indigo-700">
                Upload Your First X-ray
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Latest Grade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold text-white">KL {analyses[0].klGrade}</p>
                      <p className="text-slate-400 text-sm mt-1">{analyses[0].severity}</p>
                    </div>
                    {getTrendIcon()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Risk Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-white">{analyses[0].riskScore}%</p>
                  <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                    <div className="bg-gradient-to-r from-emerald-500 to-yellow-500 h-2 rounded-full" style={{ width: `${analyses[0].riskScore}%` }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Total Scans
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-white">{analyses.length}</p>
                  <p className="text-slate-400 text-sm mt-1">Analyses completed</p>
                </CardContent>
              </Card>
            </div>

            {/* Analysis History */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Analysis History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <div key={analysis.id} className="bg-slate-700/30 border border-slate-600 rounded-lg p-6 hover:bg-slate-700/50 transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <span className={`px-4 py-2 rounded-full text-sm font-bold border ${getGradeColor(analysis.klGrade)}`}>KL Grade {analysis.klGrade}</span>
                            <span className="text-slate-400 text-sm">{new Date(analysis.analysisDate).toLocaleDateString()}</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <p className="text-slate-400 text-xs mb-1">Severity</p>
                              <p className="text-white font-medium">{analysis.severity}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs mb-1">Risk Score</p>
                              <p className="text-white font-medium">{analysis.riskScore}%</p>
                            </div>
                            <div>
                              <p className="text-slate-400 text-xs mb-1">OA Status</p>
                              <p className={`font-medium ${analysis.oaStatus ? "text-yellow-400" : "text-emerald-400"}`}>{analysis.oaStatus ? "Detected" : "Not Detected"}</p>
                            </div>
                          </div>
                          {selectedAnalysis?.id === analysis.id && (
                            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg">
                              <h4 className="text-white font-semibold mb-3">Recommendations:</h4>
                              <ul className="space-y-2">
                                {analysis.recommendations.map((rec, idx) => (
                                  <li key={idx} className="text-slate-300 text-sm flex items-start">
                                    <span className="text-indigo-400 mr-2">•</span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col space-y-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => setSelectedAnalysis(selectedAnalysis?.id === analysis.id ? null : analysis)} className="border-slate-600 text-white bg-transparent hover:bg-slate-700 hover:text-white">
                            <Eye className="w-4 h-4 mr-1" />
                            {selectedAnalysis?.id === analysis.id ? "Hide" : "View"}
                          </Button>
                          <Button size="sm" onClick={() => downloadReport(analysis)} className="bg-indigo-600 hover:bg-indigo-700">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
