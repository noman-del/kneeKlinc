import crypto from "crypto";
import { OTPVerification } from "@shared/schema";
import { emailService } from "./emailService";
import { hashPassword } from "../auth";

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

export class OTPService {
  // Generate a 6-digit OTP
  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Create and send OTP for signup
  async createAndSendOTP(email: string, password: string, firstName: string, lastName: string, userType: "doctor" | "patient" | "admin"): Promise<{ success: boolean; message: string }> {
    try {
      // Generate OTP
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Hash the password before storing
      const hashedPassword = await hashPassword(password);

      // Delete any existing OTP for this email
      await OTPVerification.deleteMany({ email: email.toLowerCase() });

      // Create new OTP record
      await OTPVerification.create({
        email: email.toLowerCase(),
        otp,
        userType,
        userData: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          userType,
        },
        expiresAt,
        verified: false,
        attempts: 0,
      });

      // Send OTP email
      const emailResult = await emailService.sendOTPEmail(email, otp, firstName, userType);

      if (!emailResult.success) {
        // Clean up OTP record if email fails
        await OTPVerification.deleteMany({ email: email.toLowerCase() });
        return {
          success: false,
          message: "Failed to send OTP email. Please try again.",
        };
      }

      console.log(`✅ OTP created and sent for: ${email}`);

      return {
        success: true,
        message: "OTP sent successfully to your email",
      };
    } catch (error) {
      console.error("❌ Error creating OTP:", error);
      return {
        success: false,
        message: "Failed to create OTP. Please try again.",
      };
    }
  }

  // Verify OTP
  async verifyOTP(
    email: string,
    otp: string
  ): Promise<{
    success: boolean;
    message: string;
    userData?: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      userType: "doctor" | "patient" | "admin";
    };
  }> {
    try {
      // Find OTP record
      const otpRecord = await OTPVerification.findOne({
        email: email.toLowerCase(),
        verified: false,
      });

      if (!otpRecord) {
        return {
          success: false,
          message: "No pending verification found. Please request a new OTP.",
        };
      }

      // Check if OTP has expired
      if (new Date() > otpRecord.expiresAt) {
        await OTPVerification.deleteOne({ _id: otpRecord._id });
        return {
          success: false,
          message: "OTP has expired. Please request a new one.",
        };
      }

      // Check max attempts
      if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
        return {
          success: false,
          message: "Maximum verification attempts exceeded. Please resend OTP to try again.",
        };
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
        // Increment attempts
        otpRecord.attempts += 1;
        await otpRecord.save();

        const remainingAttempts = MAX_OTP_ATTEMPTS - otpRecord.attempts;
        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
        };
      }

      // OTP is valid - mark as verified
      otpRecord.verified = true;
      await otpRecord.save();

      console.log(`✅ OTP verified successfully for: ${email}`);

      return {
        success: true,
        message: "Email verified successfully",
        userData: otpRecord.userData,
      };
    } catch (error) {
      console.error("❌ Error verifying OTP:", error);
      return {
        success: false,
        message: "Failed to verify OTP. Please try again.",
      };
    }
  }

  // Resend OTP
  async resendOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Find existing OTP record
      const otpRecord = await OTPVerification.findOne({
        email: email.toLowerCase(),
        verified: false,
      });

      if (!otpRecord) {
        return {
          success: false,
          message: "No pending verification found. Please sign up again.",
        };
      }

      // Generate new OTP
      const newOTP = this.generateOTP();
      const newExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

      // Update OTP record
      otpRecord.otp = newOTP;
      otpRecord.expiresAt = newExpiresAt;
      otpRecord.attempts = 0; // Reset attempts
      await otpRecord.save();

      // Send new OTP email
      const emailResult = await emailService.sendOTPEmail(email, newOTP, otpRecord.userData.firstName, otpRecord.userType);

      if (!emailResult.success) {
        return {
          success: false,
          message: "Failed to send OTP email. Please try again.",
        };
      }

      console.log(`✅ OTP resent successfully for: ${email}`);

      return {
        success: true,
        message: "New OTP sent successfully to your email",
      };
    } catch (error) {
      console.error("❌ Error resending OTP:", error);
      return {
        success: false,
        message: "Failed to resend OTP. Please try again.",
      };
    }
  }

  // Clean up verified OTP after successful account creation
  async cleanupOTP(email: string): Promise<void> {
    try {
      await OTPVerification.deleteMany({ email: email.toLowerCase() });
      console.log(`✅ OTP cleaned up for: ${email}`);
    } catch (error) {
      console.error("❌ Error cleaning up OTP:", error);
    }
  }
}

export const otpService = new OTPService();
