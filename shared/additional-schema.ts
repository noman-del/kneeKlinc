import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// ==================== AI ANALYSIS MODELS ====================

export interface IAIAnalysis extends Document {
  patientId: mongoose.Types.ObjectId;
  xrayImageUrl: string;
  klGrade: string; // "0", "1", "2", "3", "4"
  severity: string; // "Normal", "Minimal", "Moderate", "Severe"
  riskScore: number; // 0-100
  oaStatus: boolean; // true = OA detected, false = No OA
  gradCamUrl?: string; // Heatmap visualization
  recommendations: string[]; // AI-generated lifestyle recommendations
  analysisDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const aiAnalysisSchema = new Schema<IAIAnalysis>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    xrayImageUrl: { type: String, required: true },
    klGrade: { type: String, required: true, enum: ["0", "1", "2", "3", "4"] },
    severity: { type: String, required: true, enum: ["Normal", "Minimal", "Moderate", "Severe", "Very Severe"] },
    riskScore: { type: Number, required: true, min: 0, max: 100 },
    oaStatus: { type: Boolean, required: true },
    gradCamUrl: String,
    recommendations: [{ type: String }],
    analysisDate: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const AIAnalysis = mongoose.model<IAIAnalysis>("AIAnalysis", aiAnalysisSchema);

// ==================== MESSAGING MODELS ====================

export interface IMessage extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  senderType: "doctor" | "patient";
  receiverType: "doctor" | "patient";
  subject?: string;
  message: string;
  aiAnalysisId?: mongoose.Types.ObjectId; // Reference to shared AI analysis
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderType: { type: String, required: true, enum: ["doctor", "patient"] },
    receiverType: { type: String, required: true, enum: ["doctor", "patient"] },
    subject: String,
    message: { type: String, required: true },
    aiAnalysisId: { type: Schema.Types.ObjectId, ref: "AIAnalysis" },
    isRead: { type: Boolean, default: false },
    readAt: Date,
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model<IMessage>("Message", messageSchema);

// ==================== APPOINTMENT MODELS ====================

export interface IAppointment extends Document {
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  appointmentDate: Date;
  appointmentTime: string; // "09:00 AM", "02:30 PM"
  duration: number; // in minutes
  type: "in-person" | "virtual";
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  reason?: string;
  notes?: string;
  aiAnalysisId?: mongoose.Types.ObjectId; // Link to AI analysis if discussed
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    duration: { type: Number, default: 30 },
    type: { type: String, required: true, enum: ["in-person", "virtual"] },
    status: { type: String, default: "scheduled", enum: ["scheduled", "confirmed", "completed", "cancelled"] },
    reason: String,
    notes: String,
    aiAnalysisId: { type: Schema.Types.ObjectId, ref: "AIAnalysis" },
  },
  {
    timestamps: true,
  }
);

export const Appointment = mongoose.model<IAppointment>("Appointment", appointmentSchema);

// ==================== DOCTOR EDITABLE RECOMMENDATIONS ====================

export interface IDoctorRecommendation extends Document {
  aiAnalysisId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  originalRecommendations: string[]; // AI-generated
  editedRecommendations: string[]; // Doctor-edited
  doctorNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const doctorRecommendationSchema = new Schema<IDoctorRecommendation>(
  {
    aiAnalysisId: { type: Schema.Types.ObjectId, ref: "AIAnalysis", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    originalRecommendations: [{ type: String }],
    editedRecommendations: [{ type: String }],
    doctorNotes: String,
  },
  {
    timestamps: true,
  }
);

export const DoctorRecommendation = mongoose.model<IDoctorRecommendation>("DoctorRecommendation", doctorRecommendationSchema);

// ==================== DOCTOR AVAILABILITY MODELS ====================

export interface IDoctorAvailability extends Document {
  doctorId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  slotDuration: number; // minutes (e.g., 30)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorAvailabilitySchema = new Schema<IDoctorAvailability>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDuration: { type: Number, default: 30 },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

export const DoctorAvailability = mongoose.model<IDoctorAvailability>("DoctorAvailability", doctorAvailabilitySchema);

// ==================== COMMUNITY MODELS ====================

export interface ICommunityPost extends Document {
  authorId: mongoose.Types.ObjectId;
  content: string;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const communityPostSchema = new Schema<ICommunityPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 400 },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

export const CommunityPost = mongoose.model<ICommunityPost>("CommunityPost", communityPostSchema);

export interface ICommunityReply extends Document {
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const communityReplySchema = new Schema<ICommunityReply>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "CommunityPost", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true, maxlength: 400 },
    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

export const CommunityReply = mongoose.model<ICommunityReply>("CommunityReply", communityReplySchema);

// ==================== ZOD VALIDATION SCHEMAS ====================

export const insertAIAnalysisSchema = z.object({
  patientId: z.string(),
  xrayImageUrl: z.string().url(),
  klGrade: z.enum(["0", "1", "2", "3", "4"]),
  severity: z.enum(["Normal", "Minimal", "Moderate", "Severe", "Very Severe"]),
  riskScore: z.number().min(0).max(100),
  oaStatus: z.boolean(),
  gradCamUrl: z.string().url().optional(),
  recommendations: z.array(z.string()),
});

export const insertMessageSchema = z.object({
  senderId: z.string(),
  receiverId: z.string(),
  senderType: z.enum(["doctor", "patient"]),
  receiverType: z.enum(["doctor", "patient"]),
  subject: z.string().optional(),
  message: z.string().min(1),
  aiAnalysisId: z.string().optional(),
});

export const insertAppointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  appointmentDate: z.string(), // ISO date string
  appointmentTime: z.string(),
  duration: z.number().optional(),
  type: z.enum(["in-person", "virtual"]),
  reason: z.string().optional(),
  notes: z.string().optional(),
  aiAnalysisId: z.string().optional(),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]),
});

// Reschedule appointment payload
export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string(), // ISO date string (YYYY-MM-DD)
  appointmentTime: z.string(), // "HH:MM" 24-hour format
  duration: z.number().optional(),
  reason: z.string().optional(),
});

export const insertDoctorRecommendationSchema = z.object({
  aiAnalysisId: z.string(),
  doctorId: z.string(),
  patientId: z.string(),
  originalRecommendations: z.array(z.string()),
  editedRecommendations: z.array(z.string()),
  doctorNotes: z.string().optional(),
});

// Type exports for TypeScript
export type InsertAIAnalysis = z.infer<typeof insertAIAnalysisSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type UpdateAppointmentStatus = z.infer<typeof updateAppointmentStatusSchema>;
export type InsertDoctorRecommendation = z.infer<typeof insertDoctorRecommendationSchema>;
export type RescheduleAppointment = z.infer<typeof rescheduleAppointmentSchema>;
