import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDoctorSchema, insertPatientSchema, insertPatientSymptomsSchema, insertPatientInjuriesSchema, signupSchema, loginSchema, verifyOTPSchema, resendOTPSchema, User } from "@shared/schema";
import { z } from "zod";
import { generateToken, hashPassword, comparePassword, authenticateToken, authorizeRole, optionalAuth, AuthRequest } from "./auth";
import { nanoid } from "nanoid";
import { uploadProfilePicture } from "./middleware/upload";
import path from "path";
import fs from "fs";
import { registerAIRoutes } from "./routes-ai";
import { otpService } from "./services/otpService";
import { Appointment, AIAnalysis } from "@shared/additional-schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register AI, Messaging, and Appointment routes
  registerAIRoutes(app);

  // Health check route
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", message: "KneeKlinic API is running" });
  });

  // Auth user route
  app.get("/api/auth/user", optionalAuth, async (req: AuthRequest, res) => {
    if (req.user) {
      const user = await User.findById(req.user.id).select("-password");

      // Check if user has completed registration
      // Only doctors need registration, patients can use system immediately
      let hasCompletedRegistration = true; // Default to true for patients

      if (user?.userType === "doctor") {
        const { Doctor } = await import("@shared/schema");
        const doctorProfile = await Doctor.findOne({ userId: user._id });
        hasCompletedRegistration = !!doctorProfile;
      }
      // Patients don't need registration - always set to true

      res.json({
        user,
        authenticated: true,
        hasCompletedRegistration,
      });
    } else {
      res.json({ user: null, authenticated: false, hasCompletedRegistration: false });
    }
  });

  // Signup route - Step 1: Send OTP
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const validatedData = signupSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await User.findOne({ email: validatedData.email });
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create and send OTP
      const result = await otpService.createAndSendOTP(validatedData.email, validatedData.password, validatedData.firstName, validatedData.lastName, validatedData.userType);

      if (!result.success) {
        return res.status(500).json({ message: result.message });
      }

      res.status(200).json({
        message: "OTP sent to your email. Please verify to complete registration.",
        email: validatedData.email,
        requiresVerification: true,
      });
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        });
      }
      res.status(500).json({ message: "Failed to initiate signup" });
    }
  });

  // Verify OTP and create account - Step 2
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const validatedData = verifyOTPSchema.parse(req.body);

      // Verify OTP
      const result = await otpService.verifyOTP(validatedData.email, validatedData.otp);

      if (!result.success || !result.userData) {
        return res.status(400).json({ message: result.message });
      }

      // Create user account
      const user = new User({
        email: result.userData.email,
        password: result.userData.password, // Already hashed in OTP service
        firstName: result.userData.firstName,
        lastName: result.userData.lastName,
        userType: result.userData.userType,
        isEmailVerified: true,
      });

      await user.save();

      // Clean up OTP record
      await otpService.cleanupOTP(validatedData.email);

      // Generate token
      const token = generateToken((user._id as any).toString(), user.email, user.userType);

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Return user without password
      const userResponse = user.toObject();
      delete (userResponse as any).password;

      res.status(201).json({
        message: "Account created successfully",
        user: userResponse,
        token,
        authenticated: true,
      });
    } catch (error) {
      console.error("OTP verification error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        });
      }
      res.status(500).json({ message: "Failed to verify OTP" });
    }
  });

  // Resend OTP
  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const validatedData = resendOTPSchema.parse(req.body);

      const result = await otpService.resendOTP(validatedData.email);

      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      res.status(200).json({ message: result.message });
    } catch (error) {
      console.error("Resend OTP error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        });
      }
      res.status(500).json({ message: "Failed to resend OTP" });
    }
  });

  // Login route
  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user by email
      const user = await User.findOne({ email: validatedData.email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Block suspended users
      if (user.isSuspended) {
        return res.status(403).json({ message: "Your account has been suspended. Please contact support." });
      }

      // Check password
      const isValidPassword = await comparePassword(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Generate token
      const token = generateToken((user._id as any).toString(), user.email, user.userType);

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Return user without password
      const userResponse = user.toObject();
      delete (userResponse as any).password;

      res.json({
        message: "Login successful",
        user: userResponse,
        token,
        authenticated: true,
      });
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Update profile route with file upload
  app.put(
    "/api/auth/update-profile",
    authenticateToken,
    (req: AuthRequest, res, next) => {
      uploadProfilePicture(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err);
          return res.status(400).json({
            message: err.message || "File upload error",
            error: "UPLOAD_ERROR",
          });
        }
        next();
      });
    },
    async (req: AuthRequest, res) => {
      try {
        const { firstName, lastName, email } = req.body;
        const userId = req.user!.id;

        console.log("Profile update request:", { userId, firstName, lastName, email, hasFile: !!req.file });

        // Find the user
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Update user fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email;

        // Handle profile picture upload
        if (req.file) {
          console.log("Processing file upload:", req.file.filename);

          // Delete old profile picture if it exists
          if (user.profileImageUrl) {
            const oldImagePath = path.join(process.cwd(), "public", user.profileImageUrl);
            if (fs.existsSync(oldImagePath)) {
              fs.unlinkSync(oldImagePath);
              console.log("Deleted old profile picture:", oldImagePath);
            }
          }

          // Set new profile picture URL (relative path for serving)
          user.profileImageUrl = `/uploads/profile-images/${req.file.filename}`;
        }

        await user.save();
        console.log("User updated successfully");

        // Return updated user without password
        const userResponse = user.toObject();
        delete (userResponse as any).password;

        res.json({
          message: "Profile updated successfully",
          user: userResponse,
        });
      } catch (error) {
        console.error("Profile update error:", error);
        res.status(500).json({
          message: "Failed to update profile",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // Delete profile picture route
  app.delete("/api/auth/delete-profile-picture", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Delete profile picture file if it exists
      if (user.profileImageUrl) {
        const imagePath = path.join(process.cwd(), "public", user.profileImageUrl);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log("Deleted profile picture:", imagePath);
        }

        // Remove profile picture URL from database
        user.profileImageUrl = undefined;
        await user.save();
      }

      // Return updated user without password
      const userResponse = user.toObject();
      delete (userResponse as any).password;

      res.json({
        message: "Profile picture deleted successfully",
        user: userResponse,
      });
    } catch (error) {
      console.error("Profile picture deletion error:", error);
      res.status(500).json({
        message: "Failed to delete profile picture",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Change password route
  app.put("/api/auth/change-password", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      // Find the user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValidPassword = await comparePassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash and update new password
      user.password = await hashPassword(newPassword);
      await user.save();

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Logout route
  app.post("/api/auth/logout", authenticateToken, async (req: AuthRequest, res) => {
    // In a JWT system, logout is handled client-side by removing the token
    // But we can track logout on server side if needed
    res.json({ message: "Logged out successfully", authenticated: false });
  });

  // Simple admin-only route
  app.get("/api/admin/overview", authenticateToken, authorizeRole("admin"), async (req: AuthRequest, res) => {
    res.json({
      message: "Admin access granted",
      user: req.user,
    });
  });

  // ==================== ADMIN MANAGEMENT ROUTES ====================

  // List users with optional filters
  app.get("/api/admin/users", authenticateToken, authorizeRole("admin"), async (req: AuthRequest, res) => {
    try {
      const { role, suspended } = req.query as { role?: string; suspended?: string };

      const query: any = {};
      if (role && ["doctor", "patient", "admin"].includes(role)) {
        // Explicit role filter (including admin if requested)
        query.userType = role;
      } else {
        // By default, exclude admin users from the users list
        query.userType = { $in: ["doctor", "patient"] };
      }
      if (typeof suspended === "string") {
        if (suspended === "true") query.isSuspended = true;
        if (suspended === "false") query.isSuspended = { $ne: true };
      }

      const users = await User.find(query).select("-password").sort({ createdAt: -1 });
      res.json({ users });
    } catch (error) {
      console.error("Admin list users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Suspend user
  app.post("/api/admin/users/:id/suspend", authenticateToken, authorizeRole("admin"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isSuspended = true;
      await user.save();

      const userResponse = user.toObject();
      delete (userResponse as any).password;

      res.json({ message: "User suspended successfully", user: userResponse });
    } catch (error) {
      console.error("Admin suspend user error:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  // Unsuspend user
  app.post("/api/admin/users/:id/unsuspend", authenticateToken, authorizeRole("admin"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.isSuspended = false;
      await user.save();

      const userResponse = user.toObject();
      delete (userResponse as any).password;

      res.json({ message: "User unsuspended successfully", user: userResponse });
    } catch (error) {
      console.error("Admin unsuspend user error:", error);
      res.status(500).json({ message: "Failed to unsuspend user" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:id", authenticateToken, authorizeRole("admin"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const user = await User.findByIdAndDelete(id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Also clean up any linked doctor/patient profiles for this user
      try {
        const { Doctor, Patient } = await import("@shared/schema");
        await Promise.all([Doctor.deleteMany({ userId: id }), Patient.deleteMany({ userId: id })]);
      } catch (cleanupError) {
        console.error("Error cleaning up linked doctor/patient profiles for deleted user:", cleanupError);
      }

      res.json({ message: "User and linked profiles deleted successfully" });
    } catch (error) {
      console.error("Admin delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // List doctors (with linked user details)
  app.get("/api/admin/doctors", authenticateToken, authorizeRole("admin"), async (_req: AuthRequest, res) => {
    try {
      const { Doctor } = await import("@shared/schema");
      const doctors = await Doctor.find().populate("userId").sort({ createdAt: -1 });
      res.json({ doctors });
    } catch (error) {
      console.error("Admin list doctors error:", error);
      res.status(500).json({ message: "Failed to fetch doctors" });
    }
  });

  // Verify / unverify doctor
  app.post("/api/admin/doctors/:id/verify", authenticateToken, authorizeRole("admin"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { isVerified } = req.body as { isVerified?: boolean };
      const { Doctor } = await import("@shared/schema");

      const doctor = await Doctor.findById(id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      doctor.isVerified = isVerified === undefined ? true : !!isVerified;
      await doctor.save();

      res.json({ message: "Doctor verification status updated", doctor });
    } catch (error) {
      console.error("Admin verify doctor error:", error);
      res.status(500).json({ message: "Failed to update doctor" });
    }
  });

  // List patients (all user accounts with userType = "patient")
  app.get("/api/admin/patients", authenticateToken, authorizeRole("admin"), async (_req: AuthRequest, res) => {
    try {
      const patients = await User.find({ userType: "patient" }).select("-password").sort({ createdAt: -1 });
      res.json({ patients });
    } catch (error) {
      console.error("Admin list patients error:", error);
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  // List appointments (with doctor and patient + linked user details)
  app.get("/api/admin/appointments", authenticateToken, authorizeRole("admin"), async (_req: AuthRequest, res) => {
    try {
      const appointments = await Appointment.find()
        .populate("doctorId")
        .populate({ path: "patientId", populate: { path: "userId" } })
        .sort({ appointmentDate: -1 });

      res.json({ appointments });
    } catch (error) {
      console.error("Admin list appointments error:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // Update appointment status (e.g., cancel, complete)
  app.post("/api/admin/appointments/:id/status", authenticateToken, authorizeRole("admin"), async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: "scheduled" | "confirmed" | "completed" | "cancelled" };

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      appointment.status = status;
      await appointment.save();

      res.json({ message: "Appointment status updated", appointment });
    } catch (error) {
      console.error("Admin update appointment status error:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  // Admin stats
  app.get("/api/admin/stats", authenticateToken, authorizeRole("admin"), async (_req: AuthRequest, res) => {
    try {
      const [totalUsers, totalDoctors, totalPatients, totalAdmins, totalAppointments, statusCounts, aiTotalAnalyses, aiByKlGradeAgg, aiByOaStatusAgg] = await Promise.all([
        // Only count non-admin users in totalUsers
        User.countDocuments({ userType: { $in: ["doctor", "patient"] } }),
        User.countDocuments({ userType: "doctor" }),
        User.countDocuments({ userType: "patient" }),
        User.countDocuments({ userType: "admin" }),
        Appointment.countDocuments(),
        Appointment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
        AIAnalysis.countDocuments(),
        AIAnalysis.aggregate([{ $group: { _id: "$klGrade", count: { $sum: 1 } } }]),
        AIAnalysis.aggregate([{ $group: { _id: "$oaStatus", count: { $sum: 1 } } }]),
      ]);

      const appointmentsByStatus: Record<string, number> = {};
      for (const row of statusCounts as any[]) {
        appointmentsByStatus[row._id] = row.count;
      }

      const aiByKlGrade: Record<string, number> = {};
      for (const row of aiByKlGradeAgg as any[]) {
        aiByKlGrade[row._id] = row.count;
      }

      const aiByOaStatus: { withOA: number; withoutOA: number } = { withOA: 0, withoutOA: 0 };
      for (const row of aiByOaStatusAgg as any[]) {
        if (row._id === true) aiByOaStatus.withOA = row.count;
        if (row._id === false) aiByOaStatus.withoutOA = row.count;
      }

      res.json({
        totalUsers,
        totalDoctors,
        totalPatients,
        totalAdmins,
        totalAppointments,
        appointmentsByStatus,
        aiTotalAnalyses,
        aiByKlGrade,
        aiByOaStatus,
      });
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Contact form route
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, category, message } = req.body;

      // Import email service
      const { emailService } = await import("./services/emailService.js");

      // Send email using the email service (fire-and-forget)
      emailService
        .sendContactEmail({
          name,
          email,
          subject,
          category: category || "General",
          message,
        })
        .catch((err: unknown) => {
          console.error("Contact form email error:", err);
        });

      // Immediately respond without waiting for email delivery
      res.json({
        message: "Your message has been received. We will contact you shortly.",
        success: true,
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({
        message: "Failed to send message. Please try again later or contact support directly at jointsenseai2024@gmail.com",
        success: false,
      });
    }
  });

  // Email test route (development only)
  app.get("/api/test-email", async (req, res) => {
    try {
      const { emailService } = await import("./services/emailService.js");
      const result = await emailService.testEmailConfiguration();
      res.json(result);
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test email configuration",
      });
    }
  });

  // Doctor registration (protected route)
  app.post("/api/doctors/register", authenticateToken, authorizeRole("doctor"), async (req: AuthRequest, res) => {
    try {
      const doctorData = insertDoctorSchema.parse(req.body);

      // Use authenticated user's ID
      const userId = req.user!.id;
      const doctorDataWithUserId = { ...doctorData, userId };
      const doctor = await storage.createDoctor(doctorDataWithUserId);
      const user = await User.findById(userId).select("-password");

      res.status(201).json({ user, doctor });
    } catch (error) {
      console.error("Error creating doctor:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create doctor profile" });
    }
  });

  // Patient registration (protected route)
  app.post("/api/patients/register", authenticateToken, authorizeRole("patient"), async (req: AuthRequest, res) => {
    try {
      const { symptoms = {}, injuries = {}, ...patientData } = req.body;
      const validatedPatientData = insertPatientSchema.parse(patientData);

      // Use authenticated user's ID
      const userId = req.user!.id;
      const patientDataWithUserId = { ...validatedPatientData, userId };
      const patient = await storage.createPatient(patientDataWithUserId);
      const user = await User.findById(userId).select("-password");

      // Create symptoms and injuries if provided
      let patientSymptoms, patientInjuries;

      if (Object.keys(symptoms).length > 0) {
        const symptomsData = insertPatientSymptomsSchema.parse({
          patientId: patient.id,
          ...symptoms,
        });
        patientSymptoms = await storage.createPatientSymptoms(symptomsData);
      }

      if (Object.keys(injuries).length > 0) {
        const injuriesData = insertPatientInjuriesSchema.parse({
          patientId: patient.id,
          ...injuries,
        });
        patientInjuries = await storage.createPatientInjuries(injuriesData);
      }

      res.status(201).json({ user, patient, symptoms: patientSymptoms, injuries: patientInjuries });
    } catch (error) {
      console.error("Error creating patient:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create patient profile" });
    }
  });

  // Get current doctor's profile (logged-in doctor)
  app.get("/api/doctors/me", authenticateToken, authorizeRole("doctor"), async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { Doctor } = await import("@shared/schema");

      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }

      res.json({ doctor });
    } catch (error) {
      console.error("Error fetching current doctor profile:", error);
      res.status(500).json({ message: "Failed to fetch doctor profile" });
    }
  });

  // Update current doctor's professional profile
  app.put("/api/doctors/me", authenticateToken, authorizeRole("doctor"), async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { Doctor } = await import("@shared/schema");

      const doctor = await Doctor.findOne({ userId });
      if (!doctor) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }

      const { title, gender, dateOfBirth, primarySpecialization, subSpecialization, yearsOfExperience, medicalLicenseNumber, licenseState, deaNumber, npiNumber, hospitalName, department, practiceAddress, phoneNumber, boardCertifications } = req.body || {};

      if (typeof title === "string") doctor.title = title;
      if (typeof gender === "string" || gender === null) doctor.gender = gender;
      if (typeof dateOfBirth === "string" || dateOfBirth === null) doctor.dateOfBirth = dateOfBirth;
      if (typeof primarySpecialization === "string") doctor.primarySpecialization = primarySpecialization;
      if (typeof subSpecialization === "string" || subSpecialization === null) doctor.subSpecialization = subSpecialization;
      if (typeof yearsOfExperience === "string" || yearsOfExperience === null) doctor.yearsOfExperience = yearsOfExperience;
      if (typeof medicalLicenseNumber === "string") doctor.medicalLicenseNumber = medicalLicenseNumber;
      if (typeof licenseState === "string") doctor.licenseState = licenseState;
      if (typeof deaNumber === "string" || deaNumber === null) doctor.deaNumber = deaNumber;
      if (typeof npiNumber === "string" || npiNumber === null) doctor.npiNumber = npiNumber;
      if (typeof hospitalName === "string" || hospitalName === null) doctor.hospitalName = hospitalName;
      if (typeof department === "string" || department === null) doctor.department = department;
      if (typeof practiceAddress === "string" || practiceAddress === null) doctor.practiceAddress = practiceAddress;
      if (typeof phoneNumber === "string" || phoneNumber === null) doctor.phoneNumber = phoneNumber;
      if (typeof boardCertifications === "string" || boardCertifications === null) doctor.boardCertifications = boardCertifications;

      await doctor.save();

      res.json({
        message: "Doctor profile updated successfully",
        doctor,
      });
    } catch (error) {
      console.error("Error updating doctor profile:", error);
      res.status(500).json({ message: "Failed to update doctor profile" });
    }
  });

  // Get doctor profile by ID (protected route)
  app.get("/api/doctors/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const paramId = req.params.id;
      // Support special "/me" alias by resolving to authenticated user ID when present
      const userId = paramId === "me" && req.user ? req.user.id : paramId;
      const profile = await storage.getDoctorProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error fetching doctor profile:", error);
      res.status(500).json({ message: "Failed to fetch doctor profile" });
    }
  });

  // Get patient profile by ID (protected route)
  app.get("/api/patients/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const paramId = req.params.id;
      const userId = paramId === "me" && req.user ? req.user.id : paramId;
      const profile = await storage.getPatientProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error fetching patient profile:", error);
      res.status(500).json({ message: "Failed to fetch patient profile" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
