import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileImage, CheckCircle, Brain, TrendingUp } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function XrayUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

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

    try {
      // Real AI API integration
      const formData = new FormData();
      formData.append('xray', selectedFile);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/analyze-xray', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const analysisText = `KL Grade ${result.analysis.klGrade} - ${result.analysis.severity} OA`;
      setAnalysisResult(analysisText);

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
        icon: idx === 0 ? "Activity" : idx === 1 ? "Heart" : "Target",
        title: rec.split(':')[0] || "Recommendation",
        description: rec,
        isNew: false,
      }));
      localStorage.setItem("latestRecommendations", JSON.stringify(recommendations));
      localStorage.setItem("latestAnalysisId", result.analysis.id);

    } catch (error) {
      console.error("AI Analysis Error:", error);
      setApiError(error instanceof Error ? error.message : "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/20 via-transparent to-purple-900/20"></div>

      {/* Professional Floating Elements */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-60 right-20 w-56 h-56 bg-gradient-to-r from-purple-500/15 to-cyan-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }}></div>
      <div className="absolute bottom-32 left-1/3 w-32 h-32 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "4s" }}></div>
      <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-gradient-to-r from-slate-500/15 to-indigo-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "6s" }}></div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Enhanced Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl">
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
                    <Brain className="text-white w-12 h-12" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                    <span className="text-sm">🔬</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                    AI <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">X-ray Analysis</span>
                  </h1>
                  <p className="text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">Upload your knee X-ray images for instant AI-powered osteoarthritis assessment using advanced Kellgren-Lawrence grading system</p>
                  <div className="flex items-center justify-center space-x-6 mt-8">
                    <div className="flex items-center space-x-2 text-indigo-300">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">AI-Powered</span>
                    </div>
                    <div className="flex items-center space-x-2 text-purple-300">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Instant Results</span>
                    </div>
                    <div className="flex items-center space-x-2 text-cyan-300">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">Medical Grade</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!analysisResult ? (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-500/10 to-indigo-500/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-3xl p-10">
              <div className="text-center pb-10">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Upload className="text-white w-8 h-8" />
                  </div>
                  <h2 className="text-3xl font-bold text-white">Upload X-ray Images</h2>
                </div>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">Drag and drop your knee X-ray images or click to browse. We support all major image formats for accurate AI analysis.</p>
              </div>

              <div className="space-y-8">
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-3xl p-16 text-center transition-all duration-500 transform hover:scale-[1.02] ${
                    isDragOver ? "border-indigo-400 bg-indigo-400/20 shadow-2xl shadow-indigo-500/25" : selectedFile ? "border-emerald-400 bg-emerald-400/20 shadow-2xl shadow-emerald-500/25" : "border-slate-600/50 bg-slate-800/30 hover:bg-slate-800/50 hover:border-slate-500/60"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="file-upload" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex flex-col items-center space-y-6">
                      {selectedFile ? (
                        <>
                          <div className="relative">
                            <CheckCircle className="w-20 h-20 text-emerald-400" />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center">
                              <span className="text-xs">✓</span>
                            </div>
                          </div>
                          <div className="text-white text-center">
                            <p className="text-2xl font-bold mb-2">{selectedFile.name}</p>
                            <p className="text-slate-300 text-lg">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for Analysis</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="relative">
                            <Upload className="w-20 h-20 text-white/60" />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
                              <span className="text-xs">📁</span>
                            </div>
                          </div>
                          <div className="text-white text-center">
                            <p className="text-2xl font-bold mb-3">Drop your X-ray images here</p>
                            <p className="text-slate-300 text-lg">
                              or <span className="text-indigo-300 underline font-semibold">browse files</span> from your device
                            </p>
                            <p className="text-slate-400 text-sm mt-4">Supports: JPG, PNG, JPEG, GIF, BMP, WEBP</p>
                          </div>
                        </>
                      )}
                    </div>
                  </label>
                </div>

                {/* Error Messages */}
                {errorMessage && (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl">
                    <p className="text-red-300 font-semibold">❌ {errorMessage}</p>
                    <p className="text-red-200/80 text-sm mt-1">Supported formats: JPG, JPEG, PNG, GIF, BMP, WEBP</p>
                  </div>
                )}

                {/* API Error Message */}
                {apiError && (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-2xl">
                    <p className="text-red-300 font-semibold">⚠️ Analysis Failed</p>
                    <p className="text-red-200 text-sm mt-1">{apiError}</p>
                    <p className="text-red-200/80 text-xs mt-2">Check your internet connection or try again later.</p>
                  </div>
                )}

                {/* Enhanced File Info */}
                {selectedFile && (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-lg"></div>
                    <div className="relative flex items-center space-x-4 p-6 bg-slate-800/70 backdrop-blur-sm border border-slate-600/50 rounded-2xl">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                        <FileImage className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-lg">{selectedFile.name}</p>
                        <p className="text-emerald-300 text-sm font-medium">✓ Ready for AI analysis • {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                )}

                {/* Enhanced Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 pt-8">
                  <Link href="/" className="flex-1">
                    <Button variant="outline" className="w-full h-14 rounded-2xl border-slate-600/50 text-white hover:bg-slate-700/30 bg-slate-800/20 font-semibold text-lg transition-all duration-300 hover:scale-105">
                      ← Back to Dashboard
                    </Button>
                  </Link>
                  <Button onClick={handleSubmit} disabled={!selectedFile || isAnalyzing} className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold text-lg disabled:opacity-50 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-indigo-500/30 border border-white/20">
                    {isAnalyzing ? (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>AI Analyzing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <Brain className="w-6 h-6" />
                        <span>Start AI Analysis</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Enhanced Results Display */
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 shadow-2xl rounded-3xl p-12">
              <div className="text-center">
                <div className="relative mx-auto mb-8">
                  <div className="w-28 h-28 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
                    <CheckCircle className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center">
                    <span className="text-sm">🎉</span>
                  </div>
                </div>

                <h2 className="text-4xl font-bold text-white mb-6">
                  Analysis <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Complete</span>
                </h2>

                <div className="relative mb-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-lg"></div>
                  <div className="relative bg-slate-800/80 backdrop-blur-sm border border-slate-600/60 rounded-3xl p-8">
                    <h3 className="text-2xl font-bold text-white mb-4">AI Diagnosis Result</h3>
                    <p className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">{analysisResult}</p>
                    <p className="text-slate-300 text-lg leading-relaxed">Your X-ray has been successfully analyzed using our advanced AI-powered Kellgren-Lawrence grading system with medical-grade accuracy.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="bg-slate-800/70 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                        <span className="text-xs">📊</span>
                      </div>
                      <h4 className="font-bold text-white text-lg">Severity Level</h4>
                    </div>
                    <p className="text-emerald-300 font-semibold text-xl">Minimal Osteoarthritis</p>
                  </div>
                  <div className="bg-slate-800/70 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-xs">💡</span>
                      </div>
                      <h4 className="font-bold text-white text-lg">Recommendation</h4>
                    </div>
                    <p className="text-indigo-300 font-semibold text-xl">Lifestyle modifications</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
                  <Button
                    onClick={() => {
                      setSelectedFile(null);
                      setAnalysisResult(null);
                    }}
                    className="flex-1 h-14 rounded-2xl bg-slate-700/70 hover:bg-slate-600/80 text-white font-semibold text-lg transition-all duration-300 hover:scale-105 border border-slate-600/50"
                  >
                    🔄 Analyze Another
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/progress")}
                    className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-lg transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-emerald-500/30 border border-white/20"
                  >
                    <TrendingUp className="w-5 h-5 mr-2" />
                    View Progress
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
