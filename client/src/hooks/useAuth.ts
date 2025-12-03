import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  userType: "doctor" | "patient";
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: User | null;
  authenticated: boolean;
  hasCompletedRegistration: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/auth/user", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      return response.json();
    },
    retry: false,
  });

  const logout = () => {
    // Clear all auth-related storage keys on logout
    localStorage.removeItem("auth_token");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    queryClient.setQueryData(["/api/auth/user"], { user: null, authenticated: false });
    setLocation("/login");
  };

  const login = (token: string, user: User) => {
    // Store token under both keys for backward compatibility
    localStorage.setItem("auth_token", token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    queryClient.setQueryData(["/api/auth/user"], { user, authenticated: true });
  };

  const refreshUser = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  return {
    user: data?.user || null,
    isLoading,
    isAuthenticated: data?.authenticated || false,
    hasCompletedRegistration: data?.hasCompletedRegistration || false,
    error,
    logout,
    login,
    refreshUser,
  };
}
