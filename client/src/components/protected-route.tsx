import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "doctor" | "patient" | "admin";
  redirectTo?: string;
}

export function ProtectedRoute({ children, requiredRole, redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation(redirectTo);
    } else if (!isLoading && isAuthenticated) {
      // If this route requires a specific role and user doesn't match, redirect them
      if (requiredRole && user?.userType !== requiredRole) {
        if (user?.userType === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/home");
        }
      }
      // If no specific role is required but user is admin, always send them to admin portal
      else if (!requiredRole && user?.userType === "admin" && redirectTo !== "/admin") {
        setLocation("/admin");
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

  // If route requires a specific role and user doesn't match, or user is admin on a generic protected route,
  // don't render children (navigation handled in useEffect)
  if ((requiredRole && user?.userType !== requiredRole) || (!requiredRole && user?.userType === "admin")) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}

// Public route component (only accessible when not authenticated)
export function PublicRoute({ children, redirectTo = "/" }: { children: React.ReactNode; redirectTo?: string }) {
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
