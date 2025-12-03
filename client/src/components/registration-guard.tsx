import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

/**
 * RegistrationGuard - Redirects users to registration if not completed
 * Place this in protected routes to ensure users complete registration
 */
export function RegistrationGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, hasCompletedRegistration, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Don't redirect while loading
    if (isLoading) return;

    // Don't redirect if not authenticated
    if (!isAuthenticated || !user) return;

    // Don't redirect if already on registration pages
    if (location === "/doctor-registration" || location === "/patient-registration") {
      return;
    }

    // Redirect to appropriate registration page if not completed
    // Only doctors need registration, patients can use system immediately
    if (!hasCompletedRegistration && user.userType === "doctor") {
      console.log("🔄 Redirecting doctor to registration page");
      setLocation("/doctor-registration");
    }
  }, [isAuthenticated, hasCompletedRegistration, user, location, setLocation, isLoading]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // If authenticated but registration not completed, show nothing (will redirect)
  if (isAuthenticated && !hasCompletedRegistration && location !== "/doctor-registration" && location !== "/patient-registration") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Redirecting to registration...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
