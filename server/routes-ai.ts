import type { Express } from "express";
import { z } from "zod";
import { authenticateToken, authorizeRole, AuthRequest } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import { AIAnalysis, Message, Appointment, DoctorRecommendation, CommunityPost, CommunityReply, DefaultRecommendation, PatientRecommendationProfile, insertAIAnalysisSchema, insertMessageSchema, insertAppointmentSchema, updateAppointmentStatusSchema, insertDoctorRecommendationSchema, rescheduleAppointmentSchema } from "@shared/additional-schema";
import { User } from "@shared/schema";
import { emailService } from "./services/emailService";

// Configure multer for X-ray image uploads
const xrayStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "xrays");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `xray-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadXray = multer({
  storage: xrayStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow any file type to pass through; AI or downstream validation will handle invalid content.
    cb(null, true);
  },
}).single("xray");

// Configure multer for chat image attachments
const chatAttachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "public", "uploads", "chat");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `chat-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadChatAttachment = multer({
  storage: chatAttachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedMime = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExt = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".jfif"];

    if (!allowedMime.includes(file.mimetype) || !allowedExt.includes(ext)) {
      return cb(new Error("Only image files (JPG, JPEG, PNG, GIF, WEBP, JFIF) are allowed"));
    }
    cb(null, true);
  },
}).single("file");

export function registerAIRoutes(app: Express) {
  // ==================== AI ANALYSIS ROUTES ====================

  /**
   * POST /api/ai/analyze-xray
   * Upload X-ray and get AI analysis (dummy response for now)
   */
  app.post(
    "/api/ai/analyze-xray",
    authenticateToken,
    (req: AuthRequest, res, next) => {
      uploadXray(req, res, (err) => {
        if (err) {
          console.error("X-ray upload error:", err);
          return res.status(400).json({ message: err.message || "File upload error" });
        }
        next();
      });
    },
    async (req: AuthRequest, res) => {
      try {
        const userId = req.user!.id;

        if (!req.file) {
          return res.status(400).json({ message: "No X-ray image uploaded" });
        }

        const xrayImageUrl = `/uploads/xrays/${req.file.filename}`;
        const aiEndpoint = process.env.AI_MODEL_API;
        if (!aiEndpoint) {
          return res.status(500).json({ message: "AI model API is not configured" });
        }

        const formData = new FormData();
        // External API expects image file under key "file" based on provided examples
        formData.append("file", fs.createReadStream(req.file.path));

        // Keep AI request alive but cap at 10 minutes using AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

        let aiResponse;
        try {
          aiResponse = await fetch(aiEndpoint, {
            method: "POST",
            body: formData as any,
            // @ts-ignore node-fetch signal type
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        if (!aiResponse.ok) {
          console.error("External AI API error:", aiResponse.status, aiResponse.statusText);
          return res.status(502).json({
            message: "Failed to retrieve AI analysis. Please try again later.",
          });
        }

        const aiJson: any = await aiResponse.json();

        if (!aiJson?.success || !aiJson?.prediction) {
          return res.status(400).json({
            message: "The image does not appear to show knee osteoarthritis. Please upload a valid knee OA X-ray.",
          });
        }

        const gradeIndex: number = aiJson.prediction.grade_index;
        const label: string = aiJson.prediction.label;
        const confidence: number = aiJson.prediction.confidence_score;

        // Allow KL grades 0-5 from external model
        const klGrade = String(gradeIndex);
        const oaStatus = klGrade !== "0";

        // Fetch default recommendations for this KL grade from DB
        const defaultRecDoc = await DefaultRecommendation.findOne({ klGrade });

        if (!defaultRecDoc) {
          throw new Error(`No default configuration found for KL grade ${klGrade}. Please run the seed script: npm run seed:defaults`);
        }

        // Read all config from DB
        const docAny = defaultRecDoc as any;
        const recommendations: string[] = docAny.items || [];
        const severity: string | undefined = docAny.severity;
        const riskScore: number | undefined = docAny.riskScore;

        if (!severity) {
          throw new Error(`DefaultRecommendation for KL grade ${klGrade} is missing a valid severity. Please update the database or rerun the seed script.`);
        }

        if (typeof riskScore !== "number") {
          throw new Error(`DefaultRecommendation for KL grade ${klGrade} is missing a numeric riskScore. Please update the database or rerun the seed script.`);
        }

        if (recommendations.length === 0) {
          throw new Error(`DefaultRecommendation for KL grade ${klGrade} has no items. Please update the database.`);
        }

        // Save analysis to database but mark as not yet saved to profile/history
        const analysis = new AIAnalysis({
          patientId: userId,
          xrayImageUrl,
          klGrade,
          severity,
          riskScore,
          oaStatus,
          recommendations,
          analysisDate: new Date(),
          isSavedToProfile: false,
        });

        await analysis.save();

        res.json({
          message: "AI analysis completed successfully",
          analysis: {
            id: analysis._id,
            klGrade: analysis.klGrade,
            severity: analysis.severity,
            riskScore: analysis.riskScore,
            oaStatus: analysis.oaStatus,
            recommendations: analysis.recommendations,
            xrayImageUrl: analysis.xrayImageUrl,
            analysisDate: analysis.analysisDate,
            externalLabel: label,
            externalConfidence: confidence,
          },
        });
      } catch (error) {
        console.error("AI analysis error:", error);
        res.status(500).json({ message: "Failed to analyze X-ray" });
      }
    }
  );

  // ==================== CHAT ATTACHMENT ROUTES ====================

  /**
   * POST /api/messages/attachments
   * Upload an image attachment for chat messages
   */
  app.post("/api/messages/attachments", authenticateToken, (req: AuthRequest, res) => {
    uploadChatAttachment(req, res, (err) => {
      if (err) {
        console.error("Chat attachment upload error:", err);
        return res.status(400).json({ message: err.message || "Failed to upload attachment" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No attachment provided" });
      }

      const attachmentUrl = `/uploads/chat/${req.file.filename}`;

      res.status(201).json({
        attachmentUrl,
        originalName: req.file.originalname,
      });
    });
  });

  /**
   * GET /api/patient/recommendations
   * Get saved recommendation profile for the authenticated patient user
   */
  app.get("/api/patient/recommendations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      if (req.user!.userType !== "patient") {
        return res.status(403).json({ message: "Only patients can access personal recommendations" });
      }

      const profile = await PatientRecommendationProfile.findOne({ userId });
      if (!profile) {
        return res.json({ recommendationProfile: null });
      }

      res.json({
        recommendationProfile: {
          id: profile._id,
          klGrade: profile.klGrade,
          label: profile.label,
          recommendations: profile.recommendations,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        },
      });
    } catch (error) {
      console.error("Fetch patient recommendations error:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  /**
   * POST /api/patient/recommendations
   * Save or update the authenticated patient's recommendation profile
   */
  app.post("/api/patient/recommendations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      if (req.user!.userType !== "patient") {
        return res.status(403).json({ message: "Only patients can save personal recommendations" });
      }

      const schema = z.object({
        klGrade: z.string(),
        label: z.string().optional(),
        recommendations: z.array(z.string()).min(1),
      });

      const payload = schema.parse(req.body);

      const profile = await PatientRecommendationProfile.findOneAndUpdate(
        { userId },
        {
          userId,
          klGrade: payload.klGrade,
          label: payload.label,
          recommendations: payload.recommendations,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      res.status(201).json({
        message: "Recommendations saved successfully",
        recommendationProfile: {
          id: profile._id,
          klGrade: profile.klGrade,
          label: profile.label,
          recommendations: profile.recommendations,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
        },
      });
    } catch (error) {
      console.error("Save patient recommendations error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save recommendations" });
    }
  });

  /**
   * GET /api/ai/analyses
   * Get all AI analyses for the authenticated user that are saved to profile/history
   */
  app.get("/api/ai/analyses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const analyses = await AIAnalysis.find({ patientId: userId, isSavedToProfile: true }).sort({ createdAt: -1 });

      res.json({
        analyses: analyses.map((a) => ({
          id: a._id,
          klGrade: a.klGrade,
          severity: a.severity,
          riskScore: a.riskScore,
          oaStatus: a.oaStatus,
          recommendations: a.recommendations,
          xrayImageUrl: a.xrayImageUrl,
          analysisDate: a.analysisDate,
          createdAt: a.createdAt,
        })),
      });
    } catch (error) {
      console.error("Fetch analyses error:", error);
      res.status(500).json({ message: "Failed to fetch AI analyses" });
    }
  });

  /**
   * GET /api/ai/doctor/patient-analyses
   * Get all saved AI analyses for patients who have appointments with the authenticated doctor
   */
  app.get("/api/ai/doctor/patient-analyses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.user?.userType !== "doctor") {
        return res.status(403).json({ message: "Only doctors can access patient analyses" });
      }

      const doctorUserId = req.user!.id;
      const { Doctor, Patient } = await import("@shared/schema");

      const doctorProfile = await Doctor.findOne({ userId: doctorUserId });
      if (!doctorProfile) {
        return res.json({ analyses: [] });
      }

      // Find all appointments for this doctor
      const appointments = await Appointment.find({ doctorId: doctorProfile._id }).select("patientId");
      if (appointments.length === 0) {
        return res.json({ analyses: [] });
      }

      const uniquePatientIds = Array.from(new Set(appointments.map((a: any) => String(a.patientId)).filter(Boolean)));

      // Resolve patients -> userIds
      const patients = await Patient.find({ _id: { $in: uniquePatientIds } }).populate("userId", "firstName lastName email");

      const userIdToPatient: Record<string, { name: string; email?: string }> = {};
      for (const p of patients as any[]) {
        const user: any = p.userId;
        if (!user?._id) continue;
        const name = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Patient";
        userIdToPatient[String(user._id)] = {
          name,
          email: user.email,
        };
      }

      const userIds = Object.keys(userIdToPatient);
      if (userIds.length === 0) {
        return res.json({ analyses: [] });
      }

      const analyses = await AIAnalysis.find({ patientId: { $in: userIds }, isSavedToProfile: true }).sort({ createdAt: -1 });

      const result = analyses.map((a: any) => {
        const patientMeta = userIdToPatient[String(a.patientId)] || { name: "Patient" };
        return {
          id: a._id,
          patientUserId: a.patientId,
          patientName: patientMeta.name,
          patientEmail: patientMeta.email,
          klGrade: a.klGrade,
          severity: a.severity,
          riskScore: a.riskScore,
          oaStatus: a.oaStatus,
          recommendations: a.recommendations,
          xrayImageUrl: a.xrayImageUrl,
          analysisDate: a.analysisDate,
          createdAt: a.createdAt,
        };
      });

      res.json({ analyses: result });
    } catch (error) {
      console.error("Fetch doctor patient analyses error:", error);
      res.status(500).json({ message: "Failed to fetch patient analyses" });
    }
  });

  /**
   * POST /api/doctor/analyses/:id/recommendations
   * Doctor edits patient-specific recommendations for a given AI analysis.
   * This updates DoctorRecommendation and the patient's PatientRecommendationProfile,
   * but never touches DefaultRecommendation.
   */
  app.post("/api/doctor/analyses/:id/recommendations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      if (req.user?.userType !== "doctor") {
        return res.status(403).json({ message: "Only doctors can edit patient recommendations" });
      }

      const { id } = req.params;
      const doctorUserId = req.user!.id;

      const { Doctor, Patient } = await import("@shared/schema");

      const doctorDoc = await Doctor.findOne({ userId: doctorUserId });
      if (!doctorDoc) {
        return res.status(404).json({ message: "Doctor profile not found" });
      }

      const analysis = await AIAnalysis.findById(id);
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      const payloadSchema = z.object({
        recommendations: z.array(z.string()).min(1),
        doctorNotes: z.string().optional(),
      });

      const payload = payloadSchema.parse(req.body);

      // Resolve or create Patient profile (schema Patient references userId)
      let patientDoc = await Patient.findOne({ userId: analysis.patientId });
      if (!patientDoc) {
        patientDoc = await Patient.create({ userId: analysis.patientId });
      }

      // Upsert doctor-specific recommendation record
      const doctorRecommendation = await DoctorRecommendation.findOneAndUpdate(
        {
          aiAnalysisId: analysis._id,
          doctorId: doctorDoc._id,
          patientId: patientDoc._id,
        },
        {
          aiAnalysisId: analysis._id,
          doctorId: doctorDoc._id,
          patientId: patientDoc._id,
          originalRecommendations: analysis.recommendations,
          editedRecommendations: payload.recommendations,
          doctorNotes: payload.doctorNotes,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Update the patient's saved recommendation profile used on home/progress pages
      const patientProfile = await PatientRecommendationProfile.findOneAndUpdate(
        { userId: analysis.patientId },
        {
          userId: analysis.patientId,
          klGrade: analysis.klGrade,
          label: undefined,
          recommendations: payload.recommendations,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Also update this specific AI analysis so patient's history shows edited recs
      analysis.recommendations = payload.recommendations;
      await analysis.save();

      res.status(200).json({
        message: "Patient recommendations updated successfully",
        doctorRecommendation: {
          id: doctorRecommendation._id,
          aiAnalysisId: doctorRecommendation.aiAnalysisId,
          doctorId: doctorRecommendation.doctorId,
          patientId: doctorRecommendation.patientId,
          editedRecommendations: doctorRecommendation.editedRecommendations,
          doctorNotes: doctorRecommendation.doctorNotes,
        },
        patientProfile: patientProfile
          ? {
              id: patientProfile._id,
              klGrade: patientProfile.klGrade,
              recommendations: patientProfile.recommendations,
            }
          : null,
      });
    } catch (error) {
      console.error("Doctor edit recommendations error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update recommendations" });
    }
  });

  /**
   * POST /api/ai/analyses/:id/save-to-profile
   * Mark an analysis as saved to profile/progress for the authenticated user
   */
  app.post("/api/ai/analyses/:id/save-to-profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const analysis = await AIAnalysis.findOne({ _id: id, patientId: userId });
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      if (!analysis.isSavedToProfile) {
        analysis.isSavedToProfile = true;
        await analysis.save();
      }

      res.json({
        message: "Analysis saved to profile successfully",
        analysis: {
          id: analysis._id,
          klGrade: analysis.klGrade,
          severity: analysis.severity,
          riskScore: analysis.riskScore,
          oaStatus: analysis.oaStatus,
          recommendations: analysis.recommendations,
          xrayImageUrl: analysis.xrayImageUrl,
          analysisDate: analysis.analysisDate,
          createdAt: analysis.createdAt,
        },
      });
    } catch (error) {
      console.error("Save analysis to profile error:", error);
      res.status(500).json({ message: "Failed to save analysis to profile" });
    }
  });

  /**
   * GET /api/ai/analyses/:id
   * Get a specific AI analysis by ID
   */
  app.get("/api/ai/analyses/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const analysis = await AIAnalysis.findById(id);

      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      res.json({
        analysis: {
          id: analysis._id,
          klGrade: analysis.klGrade,
          severity: analysis.severity,
          riskScore: analysis.riskScore,
          oaStatus: analysis.oaStatus,
          recommendations: analysis.recommendations,
          xrayImageUrl: analysis.xrayImageUrl,
          gradCamUrl: analysis.gradCamUrl,
          analysisDate: analysis.analysisDate,
          createdAt: analysis.createdAt,
        },
      });
    } catch (error) {
      console.error("Fetch analysis error:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  // ==================== MESSAGING ROUTES ====================

  /**
   * POST /api/messages/send
   * Send a message to a doctor or patient
   */
  app.post("/api/messages/send", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log("📨 POST /api/messages/send called");
      console.log("Request body:", req.body);
      console.log("User:", req.user);

      // Always take sender from auth token
      const senderId = req.user!.id.toString();

      // receiverId is now always a userId (not Doctor._id)
      const receiverId = req.body.receiverId as string | undefined;
      const receiverType = req.body.receiverType as "doctor" | "patient" | undefined;

      if (!receiverId) {
        return res.status(400).json({ message: "receiverId is required" });
      }

      // Verify receiver exists
      const receiverUser = await User.findById(receiverId);
      if (!receiverUser) {
        return res.status(404).json({ message: "Receiver not found" });
      }

      // Build payload for validation (schema expects senderId/receiverId strings)
      const payload = {
        ...req.body,
        senderId,
        receiverId,
      };

      const validatedData = insertMessageSchema.parse(payload);

      // Require either text or attachment (or both)
      const hasText = typeof validatedData.message === "string" && validatedData.message.trim().length > 0;
      const hasAttachment = typeof validatedData.attachmentUrl === "string" && validatedData.attachmentUrl.trim().length > 0;

      if (!hasText && !hasAttachment) {
        return res.status(400).json({ message: "Message text or an attachment is required" });
      }

      const message = new Message({
        ...validatedData,
      });

      await message.save();

      res.status(201).json({
        message: "Message sent successfully",
        messageData: {
          id: message._id,
          subject: message.subject,
          message: message.message,
          createdAt: message.createdAt,
        },
      });
    } catch (error) {
      console.error("Send message error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  /**
   * GET /api/messages/inbox
   * Get all messages for the authenticated user
   */
  app.get("/api/messages/inbox", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const messages = await Message.find({ receiverId: userId }).populate("senderId", "firstName lastName email userType").sort({ createdAt: -1 });

      res.json({
        messages: messages.map((m) => ({
          id: m._id,
          sender: m.senderId,
          subject: m.subject,
          message: m.message,
          isRead: m.isRead,
          aiAnalysisId: m.aiAnalysisId,
          attachmentUrl: m.attachmentUrl,
          attachmentType: m.attachmentType,
          attachmentOriginalName: m.attachmentOriginalName,
          createdAt: m.createdAt,
        })),
      });
    } catch (error) {
      console.error("Fetch inbox error:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  /**
   * GET /api/messages/sent
   * Get all sent messages for the authenticated user
   */
  app.get("/api/messages/sent", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const messages = await Message.find({ senderId: userId }).populate("receiverId", "firstName lastName email userType").sort({ createdAt: -1 });

      res.json({
        messages: messages.map((m) => ({
          id: m._id,
          receiver: m.receiverId,
          subject: m.subject,
          message: m.message,
          isRead: m.isRead,
          aiAnalysisId: m.aiAnalysisId,
          attachmentUrl: m.attachmentUrl,
          attachmentType: m.attachmentType,
          attachmentOriginalName: m.attachmentOriginalName,
          createdAt: m.createdAt,
        })),
      });
    } catch (error) {
      console.error("Fetch sent messages error:", error);
      res.status(500).json({ message: "Failed to fetch sent messages" });
    }
  });

  /**
   * PUT /api/messages/:id/read
   * Mark a message as read
   */
  app.put("/api/messages/:id/read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const message = await Message.findOne({ _id: id, receiverId: userId });
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      message.isRead = true;
      message.readAt = new Date();
      await message.save();

      res.json({ message: "Message marked as read" });
    } catch (error) {
      console.error("Mark as read error:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  /**
   * GET /api/messages/conversations
   * Get all conversations (unique users with last message)
   */
  app.get("/api/messages/conversations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;

      // Get all messages where user is sender or receiver
      const messages = await Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      })
        .populate("senderId", "firstName lastName email userType profileImageUrl")
        .populate("receiverId", "firstName lastName email userType profileImageUrl")
        .sort({ createdAt: -1 });

      // Group by conversation partner
      const conversationsMap = new Map();

      // Fetch doctor details for enrichment
      const { Doctor } = await import("@shared/schema");

      for (const msg of messages) {
        const partnerId = msg.senderId._id.toString() === userId.toString() ? msg.receiverId._id.toString() : msg.senderId._id.toString();

        if (!conversationsMap.has(partnerId)) {
          const partner = msg.senderId._id.toString() === userId.toString() ? msg.receiverId : msg.senderId;
          // senderId/receiverId are populated at runtime, but TS types them as ObjectId.
          const partnerAny = partner as any;

          const convData: any = {
            userId: partnerId,
            name: `${partnerAny?.firstName ?? ""} ${partnerAny?.lastName ?? ""}`.trim(),
            lastMessage: msg.message,
            lastMessageTime: msg.createdAt,
            unreadCount: 0,
            profileImage: partnerAny?.profileImageUrl,
            userType: partnerAny?.userType,
          };

          // If partner is a doctor, fetch their professional details
          if (partnerAny?.userType === "doctor") {
            const doctorProfile = await Doctor.findOne({ userId: partnerId });
            if (doctorProfile) {
              convData.title = doctorProfile.title;
              convData.specialization = doctorProfile.primarySpecialization;
              convData.experience = doctorProfile.yearsOfExperience ? `${doctorProfile.yearsOfExperience} years exp` : undefined;
              convData.hospital = doctorProfile.hospitalName;
            }
          }

          conversationsMap.set(partnerId, convData);
        }
      }

      // Count unread messages
      const unreadMessages = await Message.find({
        receiverId: userId,
        isRead: false,
      });

      unreadMessages.forEach((msg: any) => {
        const senderId = msg.senderId.toString();
        if (conversationsMap.has(senderId)) {
          conversationsMap.get(senderId).unreadCount++;
        }
      });

      const conversations = Array.from(conversationsMap.values());

      res.json({ conversations });
    } catch (error) {
      console.error("Fetch conversations error:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  /**
   * GET /api/messages/conversation/:userId
   * Get all messages in a conversation with a specific user
   */
  app.get("/api/messages/conversation/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const currentUserId = req.user!.id;
      const { userId } = req.params;

      const messages = await Message.find({
        $or: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId },
        ],
      }).sort({ createdAt: 1 });

      const formattedMessages = messages.map((m: any) => ({
        id: m._id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        message: m.message,
        attachmentUrl: m.attachmentUrl,
        attachmentType: m.attachmentType,
        attachmentOriginalName: m.attachmentOriginalName,
        createdAt: m.createdAt,
        isRead: m.isRead,
        isMine: m.senderId.toString() === currentUserId.toString(),
      }));

      // Mark messages as read
      await Message.updateMany({ senderId: userId, receiverId: currentUserId, isRead: false }, { isRead: true, readAt: new Date() });

      res.json({ messages: formattedMessages });
    } catch (error) {
      console.error("Fetch conversation messages error:", error);
      res.status(500).json({ message: "Failed to fetch conversation messages" });
    }
  });

  /**
   * GET /api/users/:userId
   * Get user details by ID
   */
  app.get("/api/users/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId).select("firstName lastName email userType profileImageUrl");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const userData: any = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        profileImageUrl: user.profileImageUrl,
      };

      // If user is a doctor, fetch professional details
      if (user.userType === "doctor") {
        const { Doctor } = await import("@shared/schema");
        const doctorProfile = await Doctor.findOne({ userId: user._id });
        if (doctorProfile) {
          userData.title = doctorProfile.title;
          userData.specialization = doctorProfile.primarySpecialization;
          userData.experience = doctorProfile.yearsOfExperience ? `${doctorProfile.yearsOfExperience} years exp` : undefined;
          userData.hospital = doctorProfile.hospitalName;
        }
      }

      res.json({ user: userData });
    } catch (error) {
      console.error("Fetch user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ==================== APPOINTMENT ROUTES ====================

  /**
   * POST /api/appointments/book
   * Book an appointment with a doctor
   */
  app.post("/api/appointments/book", authenticateToken, authorizeRole("patient"), async (req: AuthRequest, res) => {
    try {
      const patientUserId = req.user!.id;

      // Convert doctorId (Doctor._id) to userId
      const { Doctor, Patient } = await import("@shared/schema");
      const doctorDoc = await Doctor.findById(req.body.doctorId);

      if (!doctorDoc) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      const doctorUserId = String(doctorDoc.userId);

      // Resolve Patient profile by authenticated userId; auto-create if missing
      let patientDoc = await Patient.findOne({ userId: patientUserId });
      if (!patientDoc) {
        patientDoc = await Patient.create({ userId: patientUserId });
      }

      // Don't validate patientId from body - we get it from auth
      const bookingData = {
        ...req.body,
        patientId: String(patientDoc._id), // Store Patient._id as per schema
        doctorId: String(doctorDoc._id), // Store Doctor._id to match schema ref and population
      };

      const validatedData = insertAppointmentSchema.parse(bookingData);

      // Auto-generate meeting URL for virtual appointments using Jitsi
      let meetingUrl: string | undefined;
      if (validatedData.type === "virtual") {
        const baseUrl = process.env.VIRTUAL_VISIT_BASE_URL || "https://meet.jit.si";
        const roomName = `kneeklinic-${doctorUserId}-${patientUserId}-${Date.now()}`;
        meetingUrl = `${baseUrl}/${roomName}`;
      }

      const appointment = new Appointment({
        ...validatedData,
        appointmentDate: new Date(validatedData.appointmentDate),
        meetingUrl,
      });

      await appointment.save();

      // Send booking confirmation email to doctor (fire-and-forget)
      (async () => {
        try {
          const patientUser = await User.findById(patientUserId);
          const patientName = patientUser ? `${patientUser.firstName || ""} ${patientUser.lastName || ""}`.trim() || "Patient" : "Patient";
          const doctorNameParts = [doctorDoc.title, doctorDoc.firstName, doctorDoc.lastName].filter(Boolean);
          const doctorName = doctorNameParts.join(" ") || "Doctor";

          await emailService.sendAppointmentBookedEmail({
            doctorEmail: doctorDoc.email,
            doctorName,
            patientName,
            appointmentDate: appointment.appointmentDate.toISOString().split("T")[0],
            appointmentTime: appointment.appointmentTime,
            type: appointment.type,
          });
        } catch (emailError) {
          console.error("Failed to send appointment booked email:", emailError);
        }
      })();

      // Schedule reminder emails for virtual visits ~N minutes before start (server best-effort)
      if (appointment.type === "virtual" && appointment.meetingUrl) {
        const joinLeadMinutes = parseInt(process.env.VIRTUAL_VISIT_JOIN_LEAD_MINUTES || "15", 10);
        const reminderMinutes = parseInt(process.env.VIRTUAL_VISIT_REMINDER_MINUTES || "5", 10);

        const appointmentStart = new Date(appointment.appointmentDate);
        const [timePart, period] = (appointment.appointmentTime || "00:00").split(" ");
        const [hStr, mStr] = (timePart || "00:00").split(":");
        let hours = parseInt(hStr || "0", 10);
        const minutes = parseInt(mStr || "0", 10);
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        appointmentStart.setHours(hours, minutes, 0, 0);

        const reminderTime = new Date(appointmentStart.getTime() - reminderMinutes * 60 * 1000);
        const delayMs = reminderTime.getTime() - Date.now();

        if (delayMs > 0 && delayMs < 24 * 60 * 60 * 1000) {
          setTimeout(async () => {
            try {
              const { Patient, Doctor } = await import("@shared/schema");
              const doctor = await Doctor.findById(appointment.doctorId);
              const patient = await Patient.findById(appointment.patientId).populate("userId");

              const doctorNameParts = doctor ? [doctor.title, doctor.firstName, doctor.lastName].filter(Boolean) : [];
              const doctorName = doctorNameParts.join(" ") || "Doctor";

              const patientUser: any = patient?.userId || null;
              const patientName = patientUser ? `${patientUser.firstName || ""} ${patientUser.lastName || ""}`.trim() || "Patient" : "Patient";
              const patientEmail = patientUser?.email;
              const doctorEmail = doctor?.email;
              const dateStr = appointment.appointmentDate.toISOString().split("T")[0];

              if (doctorEmail) {
                emailService
                  .sendVirtualVisitReminderEmail({
                    targetEmail: doctorEmail,
                    targetName: doctorName,
                    doctorName,
                    patientName,
                    appointmentDate: dateStr,
                    appointmentTime: appointment.appointmentTime,
                    meetingUrl: appointment.meetingUrl!,
                  })
                  .catch((err: unknown) => console.error("Failed to send virtual visit reminder to doctor:", err));
              }

              if (patientEmail) {
                emailService
                  .sendVirtualVisitReminderEmail({
                    targetEmail: patientEmail,
                    targetName: patientName,
                    doctorName,
                    patientName,
                    appointmentDate: dateStr,
                    appointmentTime: appointment.appointmentTime,
                    meetingUrl: appointment.meetingUrl!,
                  })
                  .catch((err: unknown) => console.error("Failed to send virtual visit reminder to patient:", err));
              }
            } catch (reminderError) {
              console.error("Error while sending virtual visit reminder:", reminderError);
            }
          }, delayMs);
        }
      }

      res.status(201).json({
        message: "Appointment booked successfully",
        appointment: {
          id: appointment._id,
          doctorId: appointment.doctorId,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          type: appointment.type,
          status: appointment.status,
          meetingUrl: appointment.meetingUrl,
        },
      });
    } catch (error) {
      console.error("Book appointment error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to book appointment" });
    }
  });

  /**
   * GET /api/appointments/my-appointments
   * Get all appointments for the authenticated user (patient or doctor)
   */
  app.get("/api/appointments/my-appointments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const userType = req.user!.userType;

      const { Patient, Doctor } = await import("@shared/schema");

      let appointments;
      if (userType === "patient") {
        const patientProfile = await Patient.findOne({ userId });
        if (!patientProfile) {
          return res.json({ appointments: [] });
        }
        // Fetch without populate to allow legacy doctorId values (userId) fallback
        appointments = await Appointment.find({ patientId: patientProfile._id }).sort({ appointmentDate: 1 });
      } else {
        const doctorProfile = await Doctor.findOne({ userId });
        if (!doctorProfile) {
          return res.json({ appointments: [] });
        }
        appointments = await Appointment.find({ doctorId: doctorProfile._id }).sort({ appointmentDate: 1 });
      }

      const joinLeadMinutes = parseInt(process.env.VIRTUAL_VISIT_JOIN_LEAD_MINUTES || "15", 10);

      res.json({
        appointments: await Promise.all(
          appointments.map(async (a: any) => {
            // Extract doctor meta if populated and user is patient
            let doctorMeta: any = {};
            let patientMeta: any = {};

            if (userType === "patient") {
              const { Doctor } = await import("@shared/schema");
              let d: any = null;
              // a.doctorId may be Doctor._id (correct) or legacy userId string
              try {
                d = await Doctor.findById(a.doctorId).lean();
              } catch {}
              if (!d && a.doctorId) {
                d = await Doctor.findOne({ userId: a.doctorId }).lean();
              }
              if (d) {
                const nameParts = [d.title, d.firstName, d.lastName].filter(Boolean);
                doctorMeta = {
                  doctorName: nameParts.join(" ") || undefined,
                  doctorSpecialization: d.primarySpecialization || undefined,
                  doctorExperience: d.yearsOfExperience ? `${d.yearsOfExperience}` : undefined,
                  doctorHospital: d.hospitalName || undefined,
                };
              }
            } else if (userType === "doctor") {
              // Extract patient meta if populated and user is doctor
              const { Patient } = await import("@shared/schema");
              try {
                const patient = await Patient.findById(a.patientId).populate("userId").lean();
                if (patient && patient.userId) {
                  const user = patient.userId as any;
                  patientMeta = {
                    patientUserId: patient.userId._id.toString(),
                    patientName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Patient",
                    patientEmail: user.email || "",
                    patientPhone: patient.phoneNumber || "",
                    patientGender: patient.gender || "",
                    patientAge: patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : undefined,
                  };
                }
              } catch (error) {
                console.error("Error fetching patient data:", error);
              }
            }

            // Compute whether this virtual appointment is currently joinable based on env-configured lead time
            let canJoinVideoVisit = false;
            if (a.type === "virtual" && a.meetingUrl && (a.status === "scheduled" || a.status === "confirmed")) {
              const start = new Date(a.appointmentDate);
              if (a.appointmentTime) {
                const [timePart, period] = (a.appointmentTime || "00:00").split(" ");
                const [hStr, mStr] = (timePart || "00:00").split(":");
                let hours = parseInt(hStr || "0", 10);
                const minutes = parseInt(mStr || "0", 10);
                if (period === "PM" && hours !== 12) hours += 12;
                if (period === "AM" && hours === 12) hours = 0;
                start.setHours(hours, minutes, 0, 0);
              }

              const durationMinutes = typeof a.duration === "number" && !isNaN(a.duration) ? a.duration : 30;
              const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

              const now = new Date();
              const msUntilStart = start.getTime() - now.getTime();
              const minutesUntilStart = msUntilStart / (60 * 1000);

              canJoinVideoVisit = minutesUntilStart <= joinLeadMinutes && end > now;
            }

            return {
              id: a._id,
              patientId: a.patientId,
              doctorId: a.doctorId,
              appointmentDate: a.appointmentDate,
              appointmentTime: a.appointmentTime,
              duration: a.duration,
              type: a.type,
              status: a.status,
              reason: a.reason,
              notes: a.notes,
              meetingUrl: a.meetingUrl,
              canJoinVideoVisit,
              aiAnalysisId: a.aiAnalysisId,
              createdAt: a.createdAt,
              ...doctorMeta,
              ...patientMeta,
            };
          })
        ),
      });
    } catch (error) {
      console.error("Fetch appointments error:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  /**
   * PUT /api/appointments/:id/status
   * Update appointment status (doctor or patient)
   */
  app.put("/api/appointments/:id/status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateAppointmentStatusSchema.parse(req.body);

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      appointment.status = validatedData.status;
      await appointment.save();

      // Send status change emails when appointment is confirmed or cancelled (fire-and-forget)
      if (validatedData.status === "confirmed" || validatedData.status === "cancelled") {
        (async () => {
          try {
            const { Patient, Doctor } = await import("@shared/schema");

            const doctor = await Doctor.findById(appointment.doctorId);
            const patient = await Patient.findById(appointment.patientId).populate("userId");

            const doctorNameParts = doctor ? [doctor.title, doctor.firstName, doctor.lastName].filter(Boolean) : [];
            const doctorName = doctorNameParts.join(" ") || "Doctor";

            const patientUser: any = patient?.userId || null;
            const patientName = patientUser ? `${patientUser.firstName || ""} ${patientUser.lastName || ""}`.trim() || "Patient" : "Patient";
            const patientEmail = patientUser?.email;
            const doctorEmail = doctor?.email;

            const dateStr = appointment.appointmentDate.toISOString().split("T")[0];

            if (doctorEmail) {
              emailService
                .sendAppointmentStatusChangedEmail({
                  targetEmail: doctorEmail,
                  targetName: doctorName,
                  doctorName,
                  patientName,
                  appointmentDate: dateStr,
                  appointmentTime: appointment.appointmentTime,
                  type: appointment.type,
                  newStatus: validatedData.status,
                })
                .catch((err) => console.error("Failed to send status email to doctor:", err));
            }
            if (patientEmail) {
              emailService
                .sendAppointmentStatusChangedEmail({
                  targetEmail: patientEmail,
                  targetName: patientName,
                  doctorName,
                  patientName,
                  appointmentDate: dateStr,
                  appointmentTime: appointment.appointmentTime,
                  type: appointment.type,
                  newStatus: validatedData.status,
                })
                .catch((err) => console.error("Failed to send status email to patient:", err));
            }
          } catch (emailError) {
            console.error("Failed to prepare appointment status emails:", emailError);
          }
        })();
      }

      res.json({
        message: "Appointment status updated successfully",
        appointment: {
          id: appointment._id,
          status: appointment.status,
        },
      });
    } catch (error) {
      console.error("Update appointment status error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update appointment status" });
    }
  });

  /**
   * PUT /api/appointments/:id/reschedule
   * Reschedule an appointment (doctor or patient)
   */
  app.put("/api/appointments/:id/reschedule", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userType = req.user!.userType;

      const validatedData = rescheduleAppointmentSchema.parse(req.body);

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // Disallow reschedule for completed or cancelled appointments
      if (appointment.status === "completed" || appointment.status === "cancelled") {
        return res.status(400).json({ message: "This appointment cannot be rescheduled" });
      }

      const { Patient, Doctor } = await import("@shared/schema");

      // Verify ownership based on user type
      if (userType === "patient") {
        const patientProfile = await Patient.findOne({ userId });
        if (!patientProfile || appointment.patientId.toString() !== patientProfile.id.toString()) {
          return res.status(403).json({ message: "You are not allowed to reschedule this appointment" });
        }
      } else if (userType === "doctor") {
        const doctorProfile = await Doctor.findOne({ userId });
        if (!doctorProfile || appointment.doctorId.toString() !== doctorProfile.id.toString()) {
          return res.status(403).json({ message: "You are not allowed to reschedule this appointment" });
        }
      } else {
        return res.status(403).json({ message: "You are not allowed to reschedule this appointment" });
      }

      const now = new Date();

      // Original appointment start and end datetime
      const originalStart = new Date(appointment.appointmentDate);
      const [origHourStr, origMinStr] = (appointment.appointmentTime || "00:00").split(":");
      originalStart.setHours(parseInt(origHourStr || "0", 10), parseInt(origMinStr || "0", 10), 0, 0);

      const durationMinutes = typeof appointment.duration === "number" && !isNaN(appointment.duration) ? appointment.duration : 30;
      const originalEnd = new Date(originalStart.getTime() + durationMinutes * 60 * 1000);

      // Allow reschedule any time before appointment end
      if (originalEnd <= now) {
        return res.status(400).json({ message: "Past appointments cannot be rescheduled" });
      }

      // New appointment datetime
      const newDate = new Date(validatedData.appointmentDate);
      const [newHourStr, newMinStr] = (validatedData.appointmentTime || "00:00").split(":");
      newDate.setHours(parseInt(newHourStr || "0", 10), parseInt(newMinStr || "0", 10), 0, 0);

      if (isNaN(newDate.getTime())) {
        return res.status(400).json({ message: "Invalid new appointment date/time" });
      }

      if (newDate <= now) {
        return res.status(400).json({ message: "New appointment time must be in the future" });
      }

      // Check if new slot is already taken for the same doctor (same date + time, scheduled/confirmed)
      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctorId: appointment.doctorId,
        appointmentDate: new Date(validatedData.appointmentDate),
        appointmentTime: validatedData.appointmentTime,
        status: { $in: ["scheduled", "confirmed"] },
      });

      if (conflict) {
        return res.status(400).json({ message: "Selected slot is already booked" });
      }

      const oldDateForEmail = appointment.appointmentDate;
      const oldTimeForEmail = appointment.appointmentTime;

      // Apply changes
      appointment.appointmentDate = new Date(validatedData.appointmentDate);
      appointment.appointmentTime = validatedData.appointmentTime;
      if (typeof validatedData.duration === "number") {
        appointment.duration = validatedData.duration;
      }
      if (validatedData.reason) {
        appointment.reason = validatedData.reason;
      }

      await appointment.save();

      // Prepare email notifications
      (async () => {
        try {
          const doctor = await Doctor.findById(appointment.doctorId);
          const patient = await Patient.findById(appointment.patientId).populate("userId");

          const doctorNameParts = doctor ? [doctor.title, doctor.firstName, doctor.lastName].filter(Boolean) : [];
          const doctorName = doctorNameParts.join(" ") || "Doctor";

          const patientUser: any = patient?.userId || null;
          const patientName = patientUser ? `${patientUser.firstName || ""} ${patientUser.lastName || ""}`.trim() || "Patient" : "Patient";
          const patientEmail = patientUser?.email;
          const doctorEmail = doctor?.email;

          const oldDateStr = oldDateForEmail.toISOString().split("T")[0];
          const newDateStr = appointment.appointmentDate.toISOString().split("T")[0];

          if (userType === "doctor" && patientEmail) {
            const targetName = patientName;
            emailService
              .sendAppointmentRescheduledEmail({
                targetEmail: patientEmail,
                targetName,
                actorType: "doctor",
                doctorName,
                patientName,
                oldDate: oldDateStr,
                oldTime: oldTimeForEmail,
                newDate: newDateStr,
                newTime: appointment.appointmentTime,
                type: appointment.type,
              })
              .catch((err) => console.error("Failed to send reschedule email to patient:", err));
          } else if (userType === "patient" && doctorEmail) {
            const targetName = doctorName;
            emailService
              .sendAppointmentRescheduledEmail({
                targetEmail: doctorEmail,
                targetName,
                actorType: "patient",
                doctorName,
                patientName,
                oldDate: oldDateStr,
                oldTime: oldTimeForEmail,
                newDate: newDateStr,
                newTime: appointment.appointmentTime,
                type: appointment.type,
              })
              .catch((err) => console.error("Failed to send reschedule email to doctor:", err));
          }
        } catch (emailError) {
          console.error("Failed to prepare reschedule emails:", emailError);
        }
      })();

      res.json({
        message: "Appointment rescheduled successfully",
        appointment: {
          id: appointment._id,
          appointmentDate: appointment.appointmentDate,
          appointmentTime: appointment.appointmentTime,
          duration: appointment.duration,
          type: appointment.type,
          status: appointment.status,
          reason: appointment.reason,
        },
      });
    } catch (error) {
      console.error("Reschedule appointment error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to reschedule appointment" });
    }
  });

  /**
   * DELETE /api/appointments/:id
   * Cancel an appointment
   */
  app.delete("/api/appointments/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userType = req.user!.userType;

      const { Patient, Doctor } = await import("@shared/schema");

      // Build ownership filter based on whether the current user is patient or doctor
      const baseFilter: any = { _id: id };

      if (userType === "patient") {
        const patientProfile = await Patient.findOne({ userId });
        if (!patientProfile) {
          return res.status(404).json({ message: "Patient profile not found" });
        }
        baseFilter.patientId = patientProfile._id;
      } else if (userType === "doctor") {
        const doctorProfile = await Doctor.findOne({ userId });
        if (!doctorProfile) {
          return res.status(404).json({ message: "Doctor profile not found" });
        }
        baseFilter.doctorId = doctorProfile._id;
      } else {
        return res.status(403).json({ message: "You are not allowed to cancel this appointment" });
      }

      const appointment = await Appointment.findOne(baseFilter);

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      appointment.status = "cancelled";
      await appointment.save();

      // Send cancellation emails to both doctor and patient (fire-and-forget)
      (async () => {
        try {
          const { Patient, Doctor } = await import("@shared/schema");

          const doctor = await Doctor.findById(appointment.doctorId);
          const patient = await Patient.findById(appointment.patientId).populate("userId");

          const doctorNameParts = doctor ? [doctor.title, doctor.firstName, doctor.lastName].filter(Boolean) : [];
          const doctorName = doctorNameParts.join(" ") || "Doctor";

          const patientUser: any = patient?.userId || null;
          const patientName = patientUser ? `${patientUser.firstName || ""} ${patientUser.lastName || ""}`.trim() || "Patient" : "Patient";
          const patientEmail = patientUser?.email;
          const doctorEmail = doctor?.email;

          const dateStr = appointment.appointmentDate.toISOString().split("T")[0];

          if (doctorEmail) {
            emailService
              .sendAppointmentCancelledEmail({
                targetEmail: doctorEmail,
                targetName: doctorName,
                doctorName,
                patientName,
                appointmentDate: dateStr,
                appointmentTime: appointment.appointmentTime,
                type: appointment.type,
              })
              .catch((err) => console.error("Failed to send cancellation email to doctor:", err));
          }
          if (patientEmail) {
            emailService
              .sendAppointmentCancelledEmail({
                targetEmail: patientEmail,
                targetName: patientName,
                doctorName,
                patientName,
                appointmentDate: dateStr,
                appointmentTime: appointment.appointmentTime,
                type: appointment.type,
              })
              .catch((err) => console.error("Failed to send cancellation email to patient:", err));
          }
        } catch (emailError) {
          console.error("Failed to prepare appointment cancelled emails:", emailError);
        }
      })();

      res.json({ message: "Appointment cancelled successfully" });
    } catch (error) {
      console.error("Cancel appointment error:", error);
      res.status(500).json({ message: "Failed to cancel appointment" });
    }
  });

  // ==================== DOCTOR RECOMMENDATION ROUTES ====================

  /**
   * POST /api/recommendations/edit
   * Doctor edits AI-generated recommendations
   */
  app.post("/api/recommendations/edit", authenticateToken, authorizeRole("doctor"), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertDoctorRecommendationSchema.parse(req.body);
      const doctorId = req.user!.id;

      const recommendation = new DoctorRecommendation({
        ...validatedData,
        doctorId,
      });

      await recommendation.save();

      res.status(201).json({
        message: "Recommendations updated successfully",
        recommendation: {
          id: recommendation._id,
          editedRecommendations: recommendation.editedRecommendations,
          doctorNotes: recommendation.doctorNotes,
        },
      });
    } catch (error) {
      console.error("Edit recommendations error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to edit recommendations" });
    }
  });

  /**
   * GET /api/recommendations/:analysisId
   * Get doctor-edited recommendations for an AI analysis
   */
  app.get("/api/recommendations/:analysisId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { analysisId } = req.params;

      const recommendation = await DoctorRecommendation.findOne({ aiAnalysisId: analysisId }).populate("doctorId", "title primarySpecialization hospitalName");

      if (!recommendation) {
        return res.status(404).json({ message: "No doctor recommendations found for this analysis" });
      }

      res.json({
        recommendation: {
          id: recommendation._id,
          doctor: recommendation.doctorId,
          originalRecommendations: recommendation.originalRecommendations,
          editedRecommendations: recommendation.editedRecommendations,
          doctorNotes: recommendation.doctorNotes,
          createdAt: recommendation.createdAt,
        },
      });
    } catch (error) {
      console.error("Fetch recommendations error:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  /**
   * POST /api/doctors/set-availability
   * Doctor sets their weekly availability schedule
   */
  app.post("/api/doctors/set-availability", authenticateToken, authorizeRole("doctor"), async (req: AuthRequest, res) => {
    try {
      const doctorId = req.user!.id;
      const { schedule } = req.body; // Array of { dayOfWeek, startTime, endTime, slotDuration }

      const { DoctorAvailability } = await import("@shared/additional-schema");

      // Delete existing availability
      await DoctorAvailability.deleteMany({ doctorId });

      // Create new availability slots
      const availabilityDocs = schedule.map((slot: any) => ({
        doctorId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotDuration: slot.slotDuration || 30,
        isActive: true,
      }));

      await DoctorAvailability.insertMany(availabilityDocs);

      res.json({ message: "Availability set successfully" });
    } catch (error) {
      console.error("Set availability error:", error);
      res.status(500).json({ message: "Failed to set availability" });
    }
  });

  /**
   * GET /api/doctors/my-availability
   * Get the authenticated doctor's weekly availability schedule
   */
  app.get("/api/doctors/my-availability", authenticateToken, authorizeRole("doctor"), async (req: AuthRequest, res) => {
    try {
      const doctorId = req.user!.id;
      const { DoctorAvailability } = await import("@shared/additional-schema");

      const availability = await DoctorAvailability.find({ doctorId, isActive: true }).sort({ dayOfWeek: 1 }).lean();

      const schedule = availability.map((slot: any) => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotDuration: slot.slotDuration,
      }));

      res.json({ schedule });
    } catch (error) {
      console.error("Get my availability error:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  /**
   * GET /api/doctors/:doctorId/available-slots
   * Get available time slots for a doctor on a specific date
   */
  app.get("/api/doctors/:doctorId/available-slots", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { doctorId } = req.params; // Doctor document _id
      const { date } = req.query; // Format: YYYY-MM-DD

      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      const selectedDate = new Date(date as string);
      const dayOfWeek = selectedDate.getDay();

      console.log(`📅 Checking availability for doctor ${doctorId} on ${date} (day ${dayOfWeek})`);

      // Get Doctor document to resolve both userId and Doctor._id
      const { Doctor } = await import("@shared/schema");
      const doctorDoc = await Doctor.findById(doctorId);

      if (!doctorDoc) {
        console.log(`❌ Doctor not found with id ${doctorId}`);
        return res.status(404).json({ message: "Doctor not found" });
      }

      const doctorUserId = doctorDoc.userId; // Used for availability
      console.log(`✅ Found doctor, userId: ${doctorUserId}`);

      // Get doctor's availability for this day
      const { DoctorAvailability } = await import("@shared/additional-schema");

      const availability = await DoctorAvailability.findOne({
        doctorId: doctorUserId,
        dayOfWeek,
        isActive: true,
      });

      if (!availability) {
        console.log(`❌ No availability set for day ${dayOfWeek}`);
        return res.json({ availableSlots: [], availability: null });
      }

      console.log(`✅ Found availability: ${availability.startTime} - ${availability.endTime}, ${availability.slotDuration} min slots`);

      // Generate time slots in 24h minutes, then convert to display format
      const allSlots: string[] = [];
      const [startHour, startMin] = availability.startTime.split(":").map(Number);
      const [endHour, endMin] = availability.endTime.split(":").map(Number);

      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // Current time in minutes if selected date is today
      const now = new Date();
      const isToday = selectedDate.toDateString() === now.toDateString();
      const currentDayMinutes = now.getHours() * 60 + now.getMinutes();

      while (currentMinutes < endMinutes) {
        // Skip past slots for today
        if (!isToday || currentMinutes > currentDayMinutes) {
          const hour24 = Math.floor(currentMinutes / 60);
          const min = currentMinutes % 60;
          const period = hour24 >= 12 ? "PM" : "AM";
          let hour12 = hour24 % 12;
          if (hour12 === 0) hour12 = 12;
          const timeLabel = `${hour12.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")} ${period}`;
          allSlots.push(timeLabel);
        }
        currentMinutes += availability.slotDuration;
      }

      console.log(`📋 Generated ${allSlots.length} possible slots:`, allSlots);

      // Check if slots are already booked for this doctor (using Doctor._id)
      const bookedAppointments = await Appointment.find({
        doctorId: doctorDoc._id,
        appointmentDate: new Date(date as string),
        status: { $in: ["scheduled", "confirmed"] },
      });

      const bookedTimes = bookedAppointments.map((apt: any) => apt.appointmentTime);
      console.log(`🚫 Booked slots (scheduled/confirmed):`, bookedTimes);

      // Filter out booked slots
      const availableSlots = allSlots.filter((slot) => !bookedTimes.includes(slot));

      console.log(`✅ Available slots (after filtering):`, availableSlots);

      res.json({
        availableSlots,
        availability: {
          dayOfWeek: availability.dayOfWeek,
          startTime: availability.startTime,
          endTime: availability.endTime,
          slotDuration: availability.slotDuration,
        },
      });
    } catch (error) {
      console.error("Fetch available slots error:", error);
      res.status(500).json({ message: "Failed to fetch available slots" });
    }
  });

  // ==================== DOCTOR RECOMMENDATION ROUTES ====================

  /**
   * POST /api/recommendations/edit
   * Doctor edits AI-generated recommendations
   */
  app.post("/api/recommendations/edit", authenticateToken, authorizeRole("doctor"), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertDoctorRecommendationSchema.parse(req.body);
      const doctorId = req.user!.id;

      const recommendation = new DoctorRecommendation({
        ...validatedData,
        doctorId,
      });

      await recommendation.save();

      res.status(201).json({
        message: "Recommendations updated successfully",
        recommendation: {
          id: recommendation._id,
          editedRecommendations: recommendation.editedRecommendations,
          doctorNotes: recommendation.doctorNotes,
        },
      });
    } catch (error) {
      console.error("Edit recommendations error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to edit recommendations" });
    }
  });

  /**
   * GET /api/recommendations/:analysisId
   * Get doctor-edited recommendations for an AI analysis
   */
  app.get("/api/recommendations/:analysisId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { analysisId } = req.params;

      const recommendation = await DoctorRecommendation.findOne({ aiAnalysisId: analysisId }).populate("doctorId", "title primarySpecialization hospitalName");

      if (!recommendation) {
        return res.status(404).json({ message: "No doctor recommendations found for this analysis" });
      }

      res.json({
        recommendation: {
          id: recommendation._id,
          doctor: recommendation.doctorId,
          originalRecommendations: recommendation.originalRecommendations,
          editedRecommendations: recommendation.editedRecommendations,
          doctorNotes: recommendation.doctorNotes,
          createdAt: recommendation.createdAt,
        },
      });
    } catch (error) {
      console.error("Fetch recommendations error:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  /**
   * POST /api/doctors/set-availability
   * Doctor sets their weekly availability schedule
   */
  app.post("/api/doctors/set-availability", authenticateToken, authorizeRole("doctor"), async (req: AuthRequest, res) => {
    try {
      const doctorId = req.user!.id;
      const { schedule } = req.body; // Array of { dayOfWeek, startTime, endTime, slotDuration }

      const { DoctorAvailability } = await import("@shared/additional-schema");

      // Delete existing availability
      await DoctorAvailability.deleteMany({ doctorId });

      // Create new availability slots
      const availabilityDocs = schedule.map((slot: any) => ({
        doctorId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotDuration: slot.slotDuration || 30,
        isActive: true,
      }));

      await DoctorAvailability.insertMany(availabilityDocs);

      res.json({ message: "Availability set successfully" });
    } catch (error) {
      console.error("Set availability error:", error);
      res.status(500).json({ message: "Failed to set availability" });
    }
  });

  /**
   * GET /api/doctors/:doctorId/available-slots
   * Get available time slots for a doctor on a specific date
   */
  app.get("/api/doctors/:doctorId/available-slots", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { doctorId } = req.params; // This is the Doctor document _id
      const { date } = req.query; // Format: YYYY-MM-DD

      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      const selectedDate = new Date(date as string);
      const dayOfWeek = selectedDate.getDay();

      console.log(`📅 Checking availability for doctor ${doctorId} on ${date} (day ${dayOfWeek})`);

      // First, get the Doctor document to find the userId
      const { Doctor } = await import("@shared/schema");
      const doctorDoc = await Doctor.findById(doctorId);

      if (!doctorDoc) {
        console.log(`❌ Doctor not found with id ${doctorId}`);
        return res.status(404).json({ message: "Doctor not found" });
      }

      const userId = doctorDoc.userId;
      console.log(`✅ Found doctor, userId: ${userId}`);

      // Get doctor's availability for this day - CORRECT IMPORT
      const { DoctorAvailability } = await import("@shared/additional-schema");

      const availability = await DoctorAvailability.findOne({
        doctorId: userId, // Use userId, not Doctor _id
        dayOfWeek,
        isActive: true,
      });

      if (!availability) {
        console.log(`❌ No availability set for day ${dayOfWeek}`);
        return res.json({ availableSlots: [], availability: null });
      }

      console.log(`✅ Found availability: ${availability.startTime} - ${availability.endTime}, ${availability.slotDuration} min slots`);

      // Generate time slots
      const allSlots: string[] = [];
      const [startHour, startMin] = availability.startTime.split(":").map(Number);
      const [endHour, endMin] = availability.endTime.split(":").map(Number);

      let currentTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      while (currentTime < endTime) {
        const hour = Math.floor(currentTime / 60);
        const min = currentTime % 60;
        const timeString = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
        allSlots.push(timeString);
        currentTime += availability.slotDuration;
      }

      console.log(`📋 Generated ${allSlots.length} possible slots:`, allSlots);

      // Check if slots are already booked (use userId for appointments too)
      const bookedAppointments = await Appointment.find({
        doctorId: userId,
        appointmentDate: date,
        status: { $in: ["scheduled", "confirmed"] },
      });

      const bookedTimes = bookedAppointments.map((apt: any) => apt.appointmentTime);
      console.log(`🚫 Booked slots:`, bookedTimes);

      // Filter out booked slots
      const availableSlots = allSlots.filter((slot) => !bookedTimes.includes(slot));

      console.log(`✅ Available slots:`, availableSlots);

      res.json({
        availableSlots,
        availability: {
          dayOfWeek: availability.dayOfWeek,
          startTime: availability.startTime,
          endTime: availability.endTime,
          slotDuration: availability.slotDuration,
        },
      });
    } catch (error) {
      console.error("Fetch available slots error:", error);
      res.status(500).json({ message: "Failed to fetch available slots" });
    }
  });

  /**
   * GET /api/doctors/list
   * Get list of all doctors for patient to choose from
   */
  app.get("/api/doctors/list", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Import Doctor model
      const { Doctor } = await import("@shared/schema");

      // Get all doctor profiles (only those who completed registration)
      const doctorProfiles = await Doctor.find({}).populate("userId", "email profileImageUrl").limit(50);

      console.log("📋 Doctors found:", doctorProfiles.length);
      console.log(
        "📋 Doctor profiles:",
        doctorProfiles.map((d: any) => ({
          name: `${d.firstName} ${d.lastName}`,
          specialization: d.primarySpecialization,
        }))
      );

      res.json({
        doctors: doctorProfiles.map((d: any) => ({
          id: d._id,
          userId: d.userId._id,
          name: `${d.title} ${d.firstName} ${d.lastName}`,
          email: d.email,
          profileImageUrl: d.userId.profileImageUrl,
          specialization: d.primarySpecialization,
          hospital: d.hospitalName,
          phoneNumber: d.phoneNumber,
          experience: d.yearsOfExperience ? `${d.yearsOfExperience}` : undefined,
        })),
      });
    } catch (error) {
      console.error("Fetch doctors error:", error);
      res.status(500).json({ message: "Failed to fetch doctors list" });
    }
  });

  // ==================== COMMUNITY ROUTES ====================

  /**
   * GET /api/community/posts
   * Get latest community posts for authenticated users
   */
  app.get("/api/community/posts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const currentUserId = req.user!.id;

      const posts = await CommunityPost.find({}).sort({ createdAt: -1 }).limit(100).populate("authorId", "firstName lastName userType");

      const responsePosts = await Promise.all(
        posts.map(async (p: any) => {
          const repliesCount = await CommunityReply.countDocuments({ postId: p._id });

          const author: any = p.authorId;
          const fullName = `${author?.firstName ?? ""} ${author?.lastName ?? ""}`.trim() || "User";
          const authorRole = author?.userType ?? "patient";
          const isVerifiedDoctor = authorRole === "doctor";

          const likesArray: any[] = Array.isArray(p.likes) ? p.likes : [];
          const likedByCurrentUser = likesArray.some((id) => id.toString() === currentUserId.toString());

          const isOwner = author?._id ? author._id.toString() === currentUserId.toString() : p.authorId?.toString?.() === currentUserId.toString();

          return {
            id: p._id,
            authorName: fullName,
            authorRole,
            isVerifiedDoctor,
            content: p.content,
            createdAt: p.createdAt,
            likesCount: likesArray.length,
            repliesCount,
            likedByCurrentUser,
            isOwner,
          };
        })
      );

      res.json({ posts: responsePosts });
    } catch (error) {
      console.error("Fetch community posts error:", error);
      res.status(500).json({ message: "Failed to fetch community posts" });
    }
  });

  /**
   * POST /api/community/posts
   * Create a new community post (question)
   */
  app.post("/api/community/posts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { content } = req.body as { content?: string };

      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      const trimmed = content.trim();
      if (trimmed.length > 400) {
        return res.status(400).json({ message: "Content must be 400 characters or less" });
      }

      const post = new CommunityPost({
        authorId: userId,
        content: trimmed,
        likes: [],
      });

      await post.save();

      res.status(201).json({
        message: "Post created successfully",
        postId: post._id,
      });
    } catch (error) {
      console.error("Create community post error:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  /**
   * GET /api/community/posts/:postId/replies
   * Get replies for a specific post
   */
  app.get("/api/community/posts/:postId/replies", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { postId } = req.params;
      const currentUserId = req.user!.id;

      const replies = await CommunityReply.find({ postId }).sort({ createdAt: 1 }).populate("authorId", "firstName lastName userType");

      const responseReplies = replies.map((r: any) => {
        const author: any = r.authorId;
        const fullName = `${author?.firstName ?? ""} ${author?.lastName ?? ""}`.trim() || "User";
        const authorRole = author?.userType ?? "patient";
        const isVerifiedDoctor = authorRole === "doctor";

        const likesArray: any[] = Array.isArray(r.likes) ? r.likes : [];
        const likedByCurrentUser = likesArray.some((id) => id.toString() === currentUserId.toString());

        const isOwner = author?._id ? author._id.toString() === currentUserId.toString() : r.authorId?.toString?.() === currentUserId.toString();

        return {
          id: r._id,
          postId: r.postId,
          authorName: fullName,
          authorRole,
          isVerifiedDoctor,
          content: r.content,
          createdAt: r.createdAt,
          likesCount: likesArray.length,
          likedByCurrentUser,
          isOwner,
        };
      });

      res.json({ replies: responseReplies });
    } catch (error) {
      console.error("Fetch community replies error:", error);
      res.status(500).json({ message: "Failed to fetch replies" });
    }
  });

  /**
   * POST /api/community/posts/:postId/replies
   * Create a reply for a specific post
   */
  app.post("/api/community/posts/:postId/replies", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;
      const { content } = req.body as { content?: string };

      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      const post = await CommunityPost.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const trimmed = content.trim();
      if (trimmed.length > 400) {
        return res.status(400).json({ message: "Content must be 400 characters or less" });
      }

      const reply = new CommunityReply({
        postId: post._id,
        authorId: userId,
        content: trimmed,
        likes: [],
      });

      await reply.save();

      res.status(201).json({
        message: "Reply created successfully",
        replyId: reply._id,
      });
    } catch (error) {
      console.error("Create community reply error:", error);
      res.status(500).json({ message: "Failed to create reply" });
    }
  });

  /**
   * POST /api/community/posts/:postId/like
   * Toggle like on a post
   */
  app.post("/api/community/posts/:postId/like", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;

      const post = await CommunityPost.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      const alreadyLiked = post.likes.some((id) => id.toString() === userId.toString());

      if (alreadyLiked) {
        post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
      } else {
        // Mongoose will cast string userId to ObjectId
        (post.likes as any).push(userId);
      }

      await post.save();

      res.json({
        message: "Post like updated successfully",
        likesCount: post.likes.length,
        likedByCurrentUser: !alreadyLiked,
      });
    } catch (error) {
      console.error("Toggle like on post error:", error);
      res.status(500).json({ message: "Failed to update like" });
    }
  });

  /**
   * POST /api/community/replies/:replyId/like
   * Toggle like on a reply
   */
  app.post("/api/community/replies/:replyId/like", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { replyId } = req.params;
      const userId = req.user!.id;

      const reply = await CommunityReply.findById(replyId);
      if (!reply) {
        return res.status(404).json({ message: "Reply not found" });
      }

      const alreadyLiked = reply.likes.some((id) => id.toString() === userId.toString());

      if (alreadyLiked) {
        reply.likes = reply.likes.filter((id) => id.toString() !== userId.toString());
      } else {
        (reply.likes as any).push(userId);
      }

      await reply.save();

      res.json({
        message: "Reply like updated successfully",
        likesCount: reply.likes.length,
        likedByCurrentUser: !alreadyLiked,
      });
    } catch (error) {
      console.error("Toggle like on reply error:", error);
      res.status(500).json({ message: "Failed to update like" });
    }
  });

  /**
   * DELETE /api/community/posts/:postId
   * Delete a community post (only by its author). Also deletes its replies.
   */
  app.delete("/api/community/posts/:postId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;

      const post = await CommunityPost.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.authorId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }

      await CommunityReply.deleteMany({ postId: post._id });
      await post.deleteOne();

      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error("Delete community post error:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  /**
   * DELETE /api/community/replies/:replyId
   * Delete a community reply (only by its author)
   */
  app.delete("/api/community/replies/:replyId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { replyId } = req.params;
      const userId = req.user!.id;

      const reply = await CommunityReply.findById(replyId);
      if (!reply) {
        return res.status(404).json({ message: "Reply not found" });
      }

      if (reply.authorId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You can only delete your own replies" });
      }

      await reply.deleteOne();

      res.json({ message: "Reply deleted successfully" });
    } catch (error) {
      console.error("Delete community reply error:", error);
      res.status(500).json({ message: "Failed to delete reply" });
    }
  });

  /**
   * PUT /api/community/posts/:postId
   * Edit a community post (only by its author)
   */
  app.put("/api/community/posts/:postId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;
      const { content } = req.body as { content?: string };

      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      const trimmed = content.trim();
      if (trimmed.length > 400) {
        return res.status(400).json({ message: "Content must be 400 characters or less" });
      }

      const post = await CommunityPost.findById(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }

      if (post.authorId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You can only edit your own posts" });
      }

      post.content = trimmed;
      await post.save();

      res.json({ message: "Post updated successfully" });
    } catch (error) {
      console.error("Edit community post error:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  /**
   * PUT /api/community/replies/:replyId
   * Edit a community reply (only by its author)
   */
  app.put("/api/community/replies/:replyId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { replyId } = req.params;
      const userId = req.user!.id;
      const { content } = req.body as { content?: string };

      if (!content || typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ message: "Content is required" });
      }

      const trimmed = content.trim();
      if (trimmed.length > 400) {
        return res.status(400).json({ message: "Content must be 400 characters or less" });
      }

      const reply = await CommunityReply.findById(replyId);
      if (!reply) {
        return res.status(404).json({ message: "Reply not found" });
      }

      if (reply.authorId.toString() !== userId.toString()) {
        return res.status(403).json({ message: "You can only edit your own replies" });
      }

      reply.content = trimmed;
      await reply.save();

      res.json({ message: "Reply updated successfully" });
    } catch (error) {
      console.error("Edit community reply error:", error);
      res.status(500).json({ message: "Failed to update reply" });
    }
  });
}
