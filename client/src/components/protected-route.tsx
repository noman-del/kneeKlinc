import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'doctor' | 'patient';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo = "/login" 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation(redirectTo);
    } else if (!isLoading && isAuthenticated && requiredRole && user?.userType !== requiredRole) {
      // Redirect to appropriate page based on user type
      if (user?.userType === 'doctor') {
        setLocation('/doctor-dashboard');
      } else {
        setLocation('/patient-dashboard');
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, redirectTo, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-medical-blue" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  if (requiredRole && user?.userType !== requiredRole) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

// Public route component (only accessible when not authenticated)
export function PublicRoute({ 
  children, 
  redirectTo = "/" 
}: { 
  children: React.ReactNode; 
  redirectTo?: string; 
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setLocation(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-medical-blue" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
