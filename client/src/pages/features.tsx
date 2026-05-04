import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Brain, Camera, FileText, TrendingUp, Shield, Clock, Users, CheckCircle } from "lucide-react";

export default function Features() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Brain,
      iconColor: "text-ac",
      iconBg: "bg-ac-muted",
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze X-ray images with 95%+ accuracy",
      details: ["Automated Kellgren-Lawrence grading", "Joint space narrowing detection", "Osteophyte identification", "Subchondral sclerosis assessment"],
    },
    {
      icon: Camera,
      iconColor: "text-sky-400",
      iconBg: "bg-sky-500/10",
      title: "X-Ray Image Processing",
      description: "Upload and process knee X-rays instantly with our advanced imaging system",
      details: ["DICOM format support", "Image enhancement algorithms", "Multi-angle analysis", "Quality assessment tools"],
    },
    {
      icon: FileText,
      iconColor: "text-violet-400",
      iconBg: "bg-violet-500/10",
      title: "Comprehensive Reports",
      description: "Detailed diagnostic reports with treatment recommendations",
      details: ["Clinical grade documentation", "Treatment pathway suggestions", "Progress tracking metrics", "Exportable PDF reports"],
    },
    {
      icon: TrendingUp,
      iconColor: "text-amber-400",
      iconBg: "bg-amber-500/10",
      title: "Progress Monitoring",
      description: "Track patient progress over time with detailed analytics",
      details: ["Symptom progression tracking", "Treatment response monitoring", "Pain level assessments", "Mobility improvement metrics"],
    },
    {
      icon: Shield,
      iconColor: "text-emerald-400",
      iconBg: "bg-emerald-500/10",
      title: "Secure Platform",
      description: "Enterprise-grade security ensuring patient data protection",
      details: ["End-to-end encryption", "Secure data storage", "Access control management", "Audit trail logging"],
    },
    {
      icon: Clock,
      iconColor: "text-rose-400",
      iconBg: "bg-rose-500/10",
      title: "Real-Time Processing",
      description: "Get instant results with our optimized processing pipeline",
      details: ["Sub-second image analysis", "Real-time notifications", "Instant report generation", "Live collaboration tools"],
    },
  ];

  return (
    <div className="min-h-screen bg-page">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-th mb-4 tracking-tight">
            Powerful <span className="text-ac">Features</span>
          </h1>
          <p className="text-lg text-tm max-w-3xl mx-auto leading-relaxed">Discover the comprehensive suite of tools designed to revolutionize knee osteoarthritis diagnosis and management for both patients and healthcare providers.</p>
        </div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-5 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-surface border border-bd hover:border-bs transition-colors duration-200">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${feature.iconBg} rounded-lg flex items-center justify-center`}>
                    <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-th">{feature.title}</CardTitle>
                    <CardDescription className="text-sm mt-0.5 text-tm">{feature.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center space-x-2 text-tm text-sm">
                      <CheckCircle className="h-3.5 w-3.5 text-ac flex-shrink-0" />
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
          <h2 className="text-2xl font-bold text-center text-th mb-8">Designed for Everyone</h2>
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="bg-surface border border-bd hover:border-bs transition-colors duration-200">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-1">
                  <div className="w-10 h-10 bg-ac-muted rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-ac" />
                  </div>
                  <CardTitle className="text-xl text-th">For Patients</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-tm text-sm">Take control of your knee health with personalized insights and tracking tools.</p>
                <ul className="space-y-1.5">
                  <li className="flex items-center space-x-2 text-tm text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-ac" />
                    <span>Upload and analyze your X-rays</span>
                  </li>
                  <li className="flex items-center space-x-2 text-tm text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-ac" />
                    <span>Track symptoms and progress</span>
                  </li>
                  <li className="flex items-center space-x-2 text-tm text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-ac" />
                    <span>Receive personalized recommendations</span>
                  </li>
                  <li className="flex items-center space-x-2 text-tm text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-ac" />
                    <span>Access educational resources</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-surface border border-bd hover:border-bs transition-colors duration-200">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-1">
                  <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-sky-400" />
                  </div>
                  <CardTitle className="text-xl text-th">For Healthcare Providers</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-tm text-sm">Enhance your diagnostic capabilities with AI-powered tools and comprehensive patient data.</p>
                <ul className="space-y-1.5">
                  <li className="flex items-center space-x-2 text-tm text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-sky-500" />
                    <span>AI-assisted diagnosis and grading</span>
                  </li>
                  <li className="flex items-center space-x-2 text-tm text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-sky-500" />
                    <span>Comprehensive patient profiles</span>
                  </li>
                  <li className="flex items-center space-x-2 text-tm text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-sky-500" />
                    <span>Evidence-based treatment plans</span>
                  </li>
                  <li className="flex items-center space-x-2 text-tm text-sm">
                    <CheckCircle className="h-3.5 w-3.5 text-sky-500" />
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
