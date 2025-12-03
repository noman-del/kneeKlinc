import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stethoscope, Target, Eye, Users, Brain, Shield, Zap, Heart, Sparkles } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-emerald-900/10"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute top-40 right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      
      {/* Hero Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-12">
            <div className="relative">
              <div className="p-6 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Heart className="h-20 w-20 text-white" />
              </div>
              <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="text-yellow-800 text-sm" />
              </div>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-8 tracking-tight">
            About <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">JointSense AI</span>
          </h1>
          <p className="text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed">
            Revolutionizing knee osteoarthritis diagnosis and management through cutting-edge AI technology, 
            empowering both patients and healthcare providers with intelligent insights.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-500 group">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl text-white font-bold">Our Mission</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-blue-100 text-lg leading-relaxed">
                  To democratize access to advanced knee osteoarthritis diagnosis and treatment recommendations 
                  through AI-powered analysis, making quality healthcare accessible to patients worldwide while 
                  supporting healthcare providers with intelligent diagnostic tools.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-500 group">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg group-hover:shadow-indigo-500/50 transition-all duration-300">
                    <Eye className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-3xl text-white font-bold">Our Vision</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-blue-100 text-lg leading-relaxed">
                  To become the leading platform for AI-assisted orthopedic care, where every patient receives 
                  personalized, evidence-based treatment recommendations, and every healthcare provider has access 
                  to cutting-edge diagnostic support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      {/* Team Commitment */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl">
            <CardContent className="p-12 text-center">
              <div className="flex justify-center mb-12">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-xl">
                  <Target className="h-10 w-10 text-white" />
                </div>
              </div>
              <h2 className="text-5xl font-bold text-white mb-8 tracking-tight">Our Commitment</h2>
              <p className="text-xl text-blue-100 leading-relaxed mb-12 max-w-4xl mx-auto">
                We are dedicated to improving patient outcomes through innovative technology, 
                continuous research, and collaboration with healthcare professionals worldwide. 
                Our team combines expertise in artificial intelligence, medical imaging, and 
                clinical practice to deliver solutions that make a real difference.
              </p>
              <div className="grid md:grid-cols-3 gap-12 mt-16">
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-4">10,000+</div>
                  <div className="text-blue-100 text-lg font-medium">X-rays Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent mb-4">95%</div>
                  <div className="text-blue-100 text-lg font-medium">Diagnostic Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">500+</div>
                  <div className="text-blue-100 text-lg font-medium">Healthcare Partners</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
