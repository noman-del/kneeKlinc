import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FloatingChatButton } from "@/components/floating-chat-button";
import { ProtectedRoute, PublicRoute } from "@/components/protected-route";
import { RegistrationGuard } from "@/components/registration-guard";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Login from "@/pages/login";
import SignupSelection from "@/pages/signup-selection";
import SignupPatient from "@/pages/signup-patient";
import SignupDoctor from "@/pages/signup-doctor";
import About from "@/pages/about";
import Features from "@/pages/features";
import Contact from "@/pages/contact";
import DoctorRegistration from "@/pages/doctor-registration";
import PatientRegistration from "@/pages/patient-registration";
import XrayUpload from "@/pages/xray-upload";
import Profile from "@/pages/profile";
import Messages from "@/pages/messages";
import Appointments from "@/pages/appointments";
import Progress from "@/pages/progress";
import Community from "@/pages/community";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-medical-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <FloatingChatButton />
      <main className="flex-1">
        <RegistrationGuard>
          <Switch>
            {/* Public routes (only accessible when not authenticated) */}
            <Route path="/login">
              <PublicRoute>
                <Login />
              </PublicRoute>
            </Route>
            <Route path="/signup">
              <PublicRoute>
                <SignupSelection />
              </PublicRoute>
            </Route>
            <Route path="/signup/patient">
              <PublicRoute>
                <SignupPatient />
              </PublicRoute>
            </Route>
            <Route path="/signup/doctor">
              <PublicRoute>
                <SignupDoctor />
              </PublicRoute>
            </Route>

            {/* Public information pages */}
            <Route path="/about" component={About} />
            <Route path="/features" component={Features} />
            <Route path="/contact" component={Contact} />

            {/* Landing page - accessible to all */}
            <Route path="/">{isAuthenticated ? <Home /> : <Landing />}</Route>

            {/* Protected routes */}
            <Route path="/home">
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            </Route>

            <Route path="/doctor-registration">
              <ProtectedRoute requiredRole="doctor">
                <DoctorRegistration />
              </ProtectedRoute>
            </Route>

            <Route path="/patient-registration">
              <ProtectedRoute requiredRole="patient">
                <PatientRegistration />
              </ProtectedRoute>
            </Route>

            <Route path="/xray-upload">
              <ProtectedRoute>
                <XrayUpload />
              </ProtectedRoute>
            </Route>

            <Route path="/profile">
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            </Route>

            <Route path="/messages">
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            </Route>

            <Route path="/community">
              <ProtectedRoute>
                <Community />
              </ProtectedRoute>
            </Route>

            <Route path="/appointments">
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            </Route>

            <Route path="/progress">
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            </Route>

            <Route component={NotFound} />
          </Switch>
        </RegistrationGuard>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
