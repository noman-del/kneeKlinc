import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-page">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-th mb-6 tracking-tight">
            About <span className="text-ac">KneeKlinic</span>
          </h1>
          <p className="text-lg text-tm max-w-3xl mx-auto leading-relaxed">Revolutionizing knee osteoarthritis diagnosis and management through cutting-edge AI technology, empowering both patients and healthcare providers with intelligent insights.</p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="pb-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-surface border border-bd hover:border-bs transition-colors duration-200">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-ac-muted rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-ac" />
                  </div>
                  <CardTitle className="text-xl text-th font-semibold">Our Mission</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-tm leading-relaxed">To democratize access to advanced knee osteoarthritis diagnosis and treatment recommendations through AI-powered analysis, making quality healthcare accessible to patients worldwide while supporting healthcare providers with intelligent diagnostic tools.</p>
              </CardContent>
            </Card>

            <Card className="bg-surface border border-bd hover:border-bs transition-colors duration-200">
              <CardHeader>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-sky-500/10 rounded-lg flex items-center justify-center">
                    <Eye className="h-5 w-5 text-sky-500" />
                  </div>
                  <CardTitle className="text-xl text-th font-semibold">Our Vision</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-tm leading-relaxed">To become the leading platform for AI-assisted orthopedic care, where every patient receives personalized, evidence-based treatment recommendations, and every healthcare provider has access to cutting-edge diagnostic support.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-surface border border-bd rounded-xl p-10 text-center">
            <h2 className="text-3xl font-bold text-th mb-4">Our Commitment</h2>
            <p className="text-tm leading-relaxed mb-10 max-w-3xl mx-auto">We are dedicated to improving patient outcomes through innovative technology, continuous research, and collaboration with healthcare professionals worldwide. Our team combines expertise in artificial intelligence, medical imaging, and clinical practice to deliver solutions that make a real difference.</p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-ac mb-2">10,000+</div>
                <div className="text-tm text-sm font-medium">X-rays Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-sky-500 mb-2">95%</div>
                <div className="text-tm text-sm font-medium">Diagnostic Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-violet-500 mb-2">500+</div>
                <div className="text-tm text-sm font-medium">Healthcare Partners</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
