import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-page">
      <div className="w-full max-w-md mx-4 text-center">
        <div className="w-16 h-16 rounded-lg bg-red-500/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-4xl font-bold text-th mb-2">404</h1>
        <p className="text-lg text-tm mb-6">Page not found</p>
        <p className="text-sm text-tm mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Button onClick={() => (window.location.href = "/")} className="bg-ac hover:bg-ac-hover text-primary-foreground font-medium transition-colors duration-200">
          Back to Home
        </Button>
      </div>
    </div>
  );
}
