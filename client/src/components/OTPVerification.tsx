import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface OTPVerificationProps {
  email: string;
  onVerificationSuccess: (token: string, user: any) => void;
  onBack: () => void;
}

export default function OTPVerification({ email, onVerificationSuccess, onBack }: OTPVerificationProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { toast } = useToast();

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(pastedData)) {
      toast({
        title: "Invalid OTP",
        description: "Please paste only numeric digits",
        variant: "destructive",
      });
      return;
    }

    const newOtp = pastedData.split("").concat(Array(6 - pastedData.length).fill(""));
    setOtp(newOtp);

    // Focus the next empty input or last input
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpToVerify = otp.join("");

    if (otpToVerify.length !== 6) {
      toast({
        title: "Incomplete OTP",
        description: "Please enter all 6 digits",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpToVerify }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      toast({
        title: "Email Verified! ✓",
        description: "Your account has been created successfully",
      });

      // Call success callback with token and user data
      onVerificationSuccess(data.token, data.user);
    } catch (error: any) {
      const errorMessage = error.message || "Invalid OTP. Please try again.";

      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // If max attempts exceeded, enable resend immediately
      if (errorMessage.includes("Maximum verification attempts exceeded")) {
        setCanResend(true);
        setCountdown(0);
      }

      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      toast({
        title: "OTP Resent",
        description: "A new verification code has been sent to your email",
      });

      // Reset countdown and OTP
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      toast({
        title: "Resend Failed",
        description: error.message || "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl border-bd bg-surface">
      <CardHeader className="text-center space-y-4 pb-8">
        <div className="mx-auto w-20 h-20 bg-ac-muted rounded-full flex items-center justify-center mb-4">
          <Mail className="w-10 h-10 text-ac" />
        </div>
        <CardTitle className="text-3xl font-bold text-th">Verify Your Email</CardTitle>
        <CardDescription className="text-lg text-ts">
          We've sent a 6-digit verification code to
          <br />
          <span className="font-semibold text-ac text-xl">{email}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-8 px-8 pb-8">
        {/* OTP Input */}
        <div className="space-y-6">
          <div className="flex justify-center gap-3">
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="w-16 h-20 text-center text-3xl font-bold bg-surface-alt border-2 border-bd text-th focus:border-ac focus:ring-ac transition-all"
                disabled={isVerifying}
              />
            ))}
          </div>

          <Button onClick={handleVerify} disabled={isVerifying || otp.some((digit) => digit === "")} className="w-full bg-ac hover:bg-ac-hover text-primary-foreground font-semibold py-7 text-lg transition-colors duration-200">
            {isVerifying ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Verify Email
              </>
            )}
          </Button>
        </div>

        {/* Resend Section */}
        <div className="text-center space-y-4">
          <div className="text-base text-tm">
            {canResend ? (
              <span className="text-emerald-500 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                You can now resend the code
              </span>
            ) : (
              <span>
                Resend code in <span className="font-semibold text-ac">{countdown}s</span>
              </span>
            )}
          </div>

          <Button variant="outline" onClick={handleResend} disabled={!canResend || isResending} className="w-full border-bd bg-surface-alt text-th hover:bg-surface-alt/80 py-6 text-base">
            {isResending ? (
              <>
                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Resend OTP
              </>
            )}
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-ac-muted border border-bd rounded-lg p-5 text-base text-ts">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-ac flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-ac-text text-base">Didn't receive the code?</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Check your spam/junk folder</li>
                <li>Verify the email address is correct</li>
                <li>Wait for the timer to resend</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <Button variant="ghost" onClick={onBack} className="w-full text-tm hover:text-th hover:bg-surface-alt py-6 text-base">
          ← Back to Sign Up
        </Button>
      </CardContent>
    </Card>
  );
}
