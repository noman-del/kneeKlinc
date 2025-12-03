import { Stethoscope } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-medical-blue rounded-lg flex items-center justify-center">
                <Stethoscope className="text-white text-sm" />
              </div>
              <span className="text-lg font-bold">JointSense AI</span>
            </div>
            <p className="text-slate-400 text-sm">
              Advanced AI-powered knee osteoarthritis management platform for healthcare professionals and patients.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">For Doctors</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-emerald-300 transition-colors">AI Diagnostics</a></li>
              <li><a href="#" className="hover:text-emerald-300 transition-colors">Patient Management</a></li>
              <li><a href="#" className="hover:text-emerald-300 transition-colors">Research Tools</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">For Patients</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-emerald-300 transition-colors">Health Tracking</a></li>
              <li><a href="#" className="hover:text-emerald-300 transition-colors">Lifestyle Guidance</a></li>
              <li><a href="#" className="hover:text-emerald-300 transition-colors">Doctor Connect</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li><a href="#" className="hover:text-emerald-300 transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-emerald-300 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-emerald-300 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm text-slate-400">
          <p>&copy; 2024 JointSense AI. All rights reserved. HIPAA Compliant Healthcare Platform.</p>
        </div>
      </div>
    </footer>
  );
}
