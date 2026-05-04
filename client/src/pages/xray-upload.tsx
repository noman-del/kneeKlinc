import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileImage, CheckCircle, Brain, TrendingUp, X, Activity } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function XrayUpload() {
  const { user } = useAuth();
  const isPatient = (user as any)?.userType === "patient";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [klGrade, setKlGrade] = useState<string | null>(null);
  const [externalLabel, setExternalLabel] = useState<string | null>(null);
  const [severityText, setSeverityText] = useState<string | null>(null);
  const [xrayImageUrl, setXrayImageUrl] = useState<string | null>(null);
  const [heatmapUrl, setHeatmapUrl] = useState<string | null>(null);
  const [recommendationList, setRecommendationList] = useState<{ icon: string; title: string; description: string; isNew: boolean }[]>([]);
  const [isSavingRecommendations, setIsSavingRecommendations] = useState(false);
  const [hasSavedRecommendations, setHasSavedRecommendations] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Auto-hide API error after 5 seconds
  useEffect(() => {
    if (!apiError) return;
    const timer = setTimeout(() => {
      setApiError(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [apiError]);

  // Generate AI recommendations based on analysis result
  const generateRecommendations = (grade: string) => {
    const baseRecommendations = [
      {
        icon: "Activity",
        title: "Physical Therapy",
        description: "Range of motion exercises and gentle stretching daily",
        isNew: false,
      },
      {
        icon: "Heart",
        title: "Anti-inflammatory Diet",
        description: "Include omega-3 rich foods, turmeric, and reduce processed foods",
        isNew: false,
      },
    ];

    if (grade.includes("Grade 2") || grade.includes("Minimal")) {
      baseRecommendations.push({
        icon: "Target",
        title: "Low-Impact Exercise",
        description: "Swimming, cycling, or walking 30 minutes, 3x per week",
        isNew: false,
      });
    } else if (grade.includes("Grade 3") || grade.includes("Moderate")) {
      baseRecommendations.push({
        icon: "Brain",
        title: "Pain Management",
        description: "Consider consultation for advanced treatment options",
        isNew: false,
      });
    }

    return baseRecommendations;
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    setApiError(null);
    setKlGrade(null);
    setExternalLabel(null);
    setSeverityText(null);
    setXrayImageUrl(null);
    setHeatmapUrl(null);
    setRecommendationList([]);
    setSaveMessage(null);
    setHasSavedRecommendations(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        setAnalysisResult(null);
        setErrorMessage(null);
      } else {
        setErrorMessage(`Invalid file type: ${file.name}. Please upload an image file (JPG, PNG, etc.).`);
        setSelectedFile(null);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        setAnalysisResult(null);
        setErrorMessage(null);
      } else {
        setErrorMessage(`Invalid file type: ${file.name}. Please upload an image file (JPG, PNG, etc.).`);
        setSelectedFile(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setApiError(null);
    setSaveMessage(null);
    setHasSavedRecommendations(false);

    try {
      // Real AI API integration
      const formData = new FormData();
      formData.append("xray", selectedFile);

      const token = localStorage.getItem("token");
      const response = await fetch("/api/ai/analyze-xray", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.message || "Analysis failed. Please try again.";
        throw new Error(message);
      }

      const result = data;
      const analysisText = `KL Grade ${result.analysis.klGrade} - ${result.analysis.severity} OA`;
      setAnalysisResult(analysisText);
      setKlGrade(result.analysis.klGrade);
      setExternalLabel(result.analysis.externalLabel || null);
      setSeverityText(result.analysis.severity || null);
      setXrayImageUrl(result.analysis.xrayImageUrl || null);
      setHeatmapUrl(result.analysis.gradCamUrl || null);

      // Add to recent assessments
      const newAssessment = {
        id: result.analysis.id,
        title: "Knee X-ray Analysis",
        result: analysisText,
        date: new Date().toLocaleDateString(),
        timestamp: "Just now",
        riskScore: result.analysis.riskScore,
      };

      const existingAssessments = JSON.parse(localStorage.getItem("recentAssessments") || "[]");
      existingAssessments.unshift(newAssessment);
      localStorage.setItem("recentAssessments", JSON.stringify(existingAssessments.slice(0, 5)));

      // Store AI recommendations
      const recommendations = result.analysis.recommendations.map((rec: string, idx: number) => ({
        icon: idx === 0 ? "Activity" : idx === 1 ? "Heart" : idx === 2 ? "Target" : "Brain",
        title: rec.split(":")[0] || "Recommendation",
        description: rec,
        isNew: false,
      }));
      setRecommendationList(recommendations);
      localStorage.setItem("latestRecommendations", JSON.stringify(recommendations));
      localStorage.setItem("latestAnalysisId", result.analysis.id);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      setApiError(error instanceof Error ? error.message : "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAsMyRecommendations = async () => {
    if (!isPatient || !klGrade || recommendationList.length === 0) return;

    try {
      setIsSavingRecommendations(true);
      setSaveMessage(null);
      const token = localStorage.getItem("token");
      const response = await fetch("/api/patient/recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          klGrade,
          label: externalLabel || analysisResult || undefined,
          recommendations: recommendationList.map((r) => r.description),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to save recommendations");
      }

      setSaveMessage("Recommendations saved to your profile.");
      setHasSavedRecommendations(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save recommendations";
      setSaveMessage(message);
    } finally {
      setIsSavingRecommendations(false);
    }
  };

  const handleViewProgress = async () => {
    if (isPatient && recommendationList.length > 0 && !hasSavedRecommendations) {
      await handleSaveAsMyRecommendations();
    }

    try {
      const latestAnalysisId = localStorage.getItem("latestAnalysisId");
      const token = localStorage.getItem("token");
      if (latestAnalysisId && token) {
        await fetch(`/api/ai/analyses/${latestAnalysisId}/save-to-profile`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.error("Failed to mark analysis as saved to profile", err);
      // Do not block navigation on this error; still allow user to view progress
    }

    window.location.href = "/progress";
  };

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-th mb-2 tracking-tight">
            AI <span className="text-ac">X-ray Analysis</span>
          </h1>
          <p className="text-tm">Upload your knee X-ray images for instant AI-powered osteoarthritis assessment</p>
        </div>

        {!analysisResult ? (
          <div className="bg-surface border border-bd rounded-lg p-6 md:p-8">
            <div className="text-center pb-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-ac-muted rounded-lg flex items-center justify-center">
                  <Upload className="text-ac w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold text-th">Upload X-ray Images</h2>
              </div>
              <p className="text-tm max-w-2xl mx-auto">Drag and drop your knee X-ray images or click to browse.</p>
            </div>

            <div className="space-y-6">
              {/* File Upload Area */}
              <div className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-200 ${isDragOver ? "border-ac bg-ac/5" : selectedFile ? "border-ac/50 bg-ac/5" : "border-bd bg-surface-alt/30 hover:bg-surface-alt/50 hover:border-bs"}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="file-upload" />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center space-y-4">
                    {selectedFile ? (
                      <>
                        <CheckCircle className="w-12 h-12 text-ac" />
                        <div className="text-center">
                          <p className="text-lg font-semibold text-th mb-1">{selectedFile.name}</p>
                          <p className="text-tm text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB - Ready for Analysis</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-tm" />
                        <div className="text-center">
                          <p className="text-lg font-semibold text-th mb-1">Drop your X-ray images here</p>
                          <p className="text-tm text-sm">
                            or <span className="text-ac underline">browse files</span> from your device
                          </p>
                          <p className="text-tm text-xs mt-3">Supports: JPG, PNG, JPEG, GIF, BMP, WEBP</p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              </div>

              {/* Error Messages */}
              {errorMessage && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                  <p className="text-red-400 font-medium text-sm">{errorMessage}</p>
                  <p className="text-red-500 text-xs mt-1">Supported formats: JPG, JPEG, PNG, GIF, BMP, WEBP</p>
                </div>
              )}

              {/* API Error Message */}
              {apiError && (
                <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg">
                  <p className="text-red-400 font-medium text-sm">Analysis Failed</p>
                  <p className="text-red-500 text-xs mt-1">{apiError}</p>
                </div>
              )}

              {/* File Info */}
              {selectedFile && (
                <div className="flex items-center space-x-4 p-4 bg-surface-alt border border-bd rounded-lg">
                  <div className="w-10 h-10 bg-ac-muted rounded-lg flex items-center justify-center">
                    <FileImage className="w-5 h-5 text-ac" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-th">{selectedFile.name}</p>
                    <p className="text-ac text-xs">Ready for AI analysis - {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  {!isAnalyzing && (
                    <button type="button" onClick={handleClearFile} className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-bd text-tm hover:text-th hover:bg-surface-alt transition-colors" aria-label="Clear selected X-ray image">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full bg-surface-alt border-bd text-ts hover:bg-surface hover:text-th font-medium transition-colors duration-200">
                    Back to Dashboard
                  </Button>
                </Link>
                <Button onClick={handleSubmit} disabled={!selectedFile || isAnalyzing} className="flex-1 bg-ac hover:bg-ac-hover text-primary-foreground font-medium disabled:opacity-50 transition-colors duration-200">
                  {isAnalyzing ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>AI Analyzing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4" />
                      <span>Start AI Analysis</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Results Display */
          <div className="bg-surface border border-bd rounded-lg p-6 md:p-8">
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-ac-muted rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-ac" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-th">
                    Analysis <span className="text-ac">Complete</span>
                  </h2>
                  {klGrade && (
                    <div className="inline-flex items-center mt-1 px-3 py-1 rounded-lg border border-ac/30 bg-ac/10">
                      <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded bg-ac text-primary-foreground text-xs font-bold">KL</span>
                      <span className="text-sm text-th font-medium">Grade {klGrade}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* X-ray and Heatmap Display */}
              {xrayImageUrl && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-th mb-4">AI Analysis Results</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Original X-ray */}
                    <div className="bg-surface-alt border border-bd rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <FileImage className="w-4 h-4 text-ac" />
                        <h4 className="font-medium text-th">Original X-Ray</h4>
                      </div>
                      <div className="relative bg-surface rounded-lg overflow-hidden">
                        <img src={xrayImageUrl} alt="Original Knee X-Ray" className="w-full h-auto max-h-64 object-contain" />
                      </div>
                    </div>

                    {/* Heatmap */}
                    {heatmapUrl && (
                      <div className="bg-surface-alt border border-bd rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <Brain className="w-4 h-4 text-ac" />
                          <h4 className="font-medium text-th">AI Diagnostic Heatmap</h4>
                        </div>
                        <div className="relative bg-surface rounded-lg overflow-hidden">
                          <img src={heatmapUrl} alt="Grad-CAM Heatmap" className="w-full h-auto max-h-64 object-contain border-2 border-blue-500/30" />
                        </div>
                        <p className="text-xs text-tm mt-2">Areas highlighted in red indicate regions the AI focused on for diagnosis</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Severity & OA status row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-surface-alt border border-bd rounded-lg p-5">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-ac" />
                    <h4 className="font-medium text-th">Severity Level</h4>
                  </div>
                  <p className="text-ac font-semibold">{severityText ? `${severityText} Osteoarthritis` : "Severity not available"}</p>
                </div>
                <div className="bg-surface-alt border border-bd rounded-lg p-5">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="w-4 h-4 text-ac" />
                    <h4 className="font-medium text-th">Osteoarthritis Status</h4>
                  </div>
                  <p className={klGrade === "0" ? "text-ac font-semibold" : "text-amber-400 font-semibold"}>{klGrade === "0" ? "No radiographic OA detected" : "Radiographic OA detected"}</p>
                </div>
              </div>

              {/* AI Lifestyle Recommendations */}
              {recommendationList.length > 0 && (
                <div className="bg-surface-alt border border-bd rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-th mb-4">AI Lifestyle Recommendations</h3>
                  <div className="space-y-3">
                    {recommendationList.map((rec, index) => {
                      const iconIndex = index % 3;
                      return (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-surface border border-bd rounded-lg">
                          <div className="w-9 h-9 bg-ac-muted rounded-lg flex items-center justify-center flex-shrink-0">
                            {iconIndex === 0 && <Activity className="w-4 h-4 text-ac" />}
                            {iconIndex === 1 && <Brain className="w-4 h-4 text-ac" />}
                            {iconIndex === 2 && <FileImage className="w-4 h-4 text-ac" />}
                          </div>
                          <p className="text-ts text-sm">{rec.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    setSelectedFile(null);
                    setAnalysisResult(null);
                    setRecommendationList([]);
                    setKlGrade(null);
                    setExternalLabel(null);
                    setSeverityText(null);
                    setXrayImageUrl(null);
                    setHeatmapUrl(null);
                  }}
                  className="bg-surface-alt border border-bd hover:bg-surface text-th font-medium transition-colors duration-200"
                >
                  Analyze Another
                </Button>
                {isPatient ? (
                  <Button onClick={handleViewProgress} disabled={isSavingRecommendations} className="bg-ac hover:bg-ac-hover text-primary-foreground font-medium transition-colors duration-200 disabled:opacity-60">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Save & View Progress
                  </Button>
                ) : (
                  <Button onClick={() => (window.location.href = "/progress")} className="bg-ac hover:bg-ac-hover text-primary-foreground font-medium transition-colors duration-200">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View Patient Analyses
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
