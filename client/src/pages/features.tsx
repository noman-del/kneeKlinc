import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { 
  Brain, 
  Camera, 
  FileText, 
  TrendingUp, 
  Shield, 
  Clock,
  Users,
  Zap,
  CheckCircle,
  ArrowRight
} from "lucide-react";

export default function Features() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze X-ray images with 95%+ accuracy",
      details: [
        "Automated Kellgren-Lawrence grading",
        "Joint space narrowing detection",
        "Osteophyte identification",
        "Subchondral sclerosis assessment"
      ]
    },
    {
      icon: Camera,
      title: "X-Ray Image Processing",
      description: "Upload and process knee X-rays instantly with our advanced imaging system",
      details: [
        "DICOM format support",
        "Image enhancement algorithms",
        "Multi-angle analysis",
        "Quality assessment tools"
      ]
    },
    {
      icon: FileText,
      title: "Comprehensive Reports",
      description: "Detailed diagnostic reports with treatment recommendations",
      details: [
        "Clinical grade documentation",
        "Treatment pathway suggestions",
        "Progress tracking metrics",
        "Exportable PDF reports"
      ]
    },
    {
      icon: TrendingUp,
      title: "Progress Monitoring",
      description: "Track patient progress over time with detailed analytics",
      details: [
        "Symptom progression tracking",
        "Treatment response monitoring",
        "Pain level assessments",
        "Mobility improvement metrics"
      ]
    },
    {
      icon: Shield,
      title: "HIPAA Compliant",
      description: "Enterprise-grade security ensuring patient data protection",
      details: [
        "End-to-end encryption",
        "Secure data storage",
        "Access control management",
        "Audit trail logging"
      ]
    },
    {
      icon: Clock,
      title: "Real-Time Processing",
      description: "Get instant results with our optimized processing pipeline",
      details: [
        "Sub-second image analysis",
        "Real-time notifications",
        "Instant report generation",
        "Live collaboration tools"
      ]
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-emerald-900/10"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-40 right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl shadow-2xl">
              <Zap className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            Powerful <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">Features</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Discover the comprehensive suite of tools designed to revolutionize knee osteoarthritis 
            diagnosis and management for both patients and healthcare providers.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/15 transition-all duration-300 shadow-2xl">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg shadow-xl">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-white">{feature.title}</CardTitle>
                    <CardDescription className="text-base mt-1 text-slate-300">
                      {feature.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center space-x-2 text-white/90">
                      <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Types Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Designed for Everyone</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/15 transition-all duration-300 shadow-2xl">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-xl">
                    <Users className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-white">For Patients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  Take control of your knee health with personalized insights and tracking tools.
                </p>
                <ul className="text-left space-y-2 text-white/90">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span>Upload and analyze your X-rays</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span>Track symptoms and progress</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span>Receive personalized recommendations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    <span>Access educational resources</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/15 transition-all duration-300 shadow-2xl">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-xl">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-white">For Healthcare Providers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-300">
                  Enhance your diagnostic capabilities with AI-powered tools and comprehensive patient data.
                </p>
                <ul className="text-left space-y-2 text-white/90">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-cyan-400" />
                    <span>AI-assisted diagnosis and grading</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-cyan-400" />
                    <span>Comprehensive patient profiles</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-cyan-400" />
                    <span>Evidence-based treatment plans</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-cyan-400" />
                    <span>Clinical documentation tools</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
