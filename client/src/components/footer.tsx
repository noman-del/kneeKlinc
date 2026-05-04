import { Stethoscope } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-surface border-t border-bd py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-7 h-7 bg-ac rounded-md flex items-center justify-center">
                <Stethoscope className="text-primary-foreground w-4 h-4" />
              </div>
              <span className="text-base font-semibold text-th">KneeKlinic</span>
            </div>
            <p className="text-tm text-sm leading-relaxed">AI-powered knee osteoarthritis management for healthcare professionals and patients.</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-ts mb-3 uppercase tracking-wider">For Doctors</h4>
            <ul className="space-y-2 text-sm text-tm">
              <li>
                <a href="#" className="hover:text-ac transition-colors duration-150">
                  AI Diagnostics
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-ac transition-colors duration-150">
                  Patient Management
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-ac transition-colors duration-150">
                  Research Tools
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm text-ts mb-3 uppercase tracking-wider">For Patients</h4>
            <ul className="space-y-2 text-sm text-tm">
              <li>
                <a href="#" className="hover:text-ac transition-colors duration-150">
                  Health Tracking
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-ac transition-colors duration-150">
                  Lifestyle Guidance
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-ac transition-colors duration-150">
                  Doctor Connect
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm text-ts mb-3 uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm text-tm">
              <li>
                <a href="#" className="hover:text-ac transition-colors duration-150">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-ac transition-colors duration-150">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-ac transition-colors duration-150">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-bd mt-8 pt-6 text-center text-xs text-tf">
          <p>&copy; 2024 KneeKlinic. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
