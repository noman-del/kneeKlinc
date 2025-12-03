import mongoose, { Schema, Document } from "mongoose";
import { z } from "zod";

// Interfaces for TypeScript
export interface IUser extends Document {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  userType: "doctor" | "patient";
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDoctor extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  gender?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  medicalLicenseNumber: string;
  licenseState: string;
  deaNumber?: string;
  npiNumber?: string;
  primarySpecialization: string;
  subSpecialization?: string;
  yearsOfExperience?: string;
  boardCertifications?: string;
  hospitalName?: string;
  department?: string;
  practiceAddress?: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatient extends Document {
  userId: mongoose.Types.ObjectId;
  gender?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  emergencyContactPhone?: string;
  height?: string;
  weight?: string;
  activityLevel?: string;
  occupationType?: string;
  weeklyExerciseHours?: number;
  smokingStatus?: string;
  insuranceProvider?: string;
  policyNumber?: string;
  primaryCarePhysician?: string;
  currentOrthopedist?: string;
  currentKLGrade?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPatientSymptoms extends Document {
  patientId: mongoose.Types.ObjectId;
  kneePain: boolean;
  jointStiffness: boolean;
  swelling: boolean;
  limitedMobility: boolean;
  grindingSensation: boolean;
  kneeInstability: boolean;
  createdAt: Date;
}

export interface IPatientInjuries extends Document {
  patientId: mongoose.Types.ObjectId;
  aclInjury: boolean;
  meniscusTear: boolean;
  kneeFracture: boolean;
  kneeReplacement: boolean;
  createdAt: Date;
}

export interface IOTPVerification extends Document {
  email: string;
  otp: string;
  userType: "doctor" | "patient";
  userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    userType: "doctor" | "patient";
  };
  expiresAt: Date;
  verified: boolean;
  attempts: number;
  createdAt: Date;
}

// Session Schema (for Replit Auth)
const sessionSchema = new Schema({
  sid: { type: String, required: true, unique: true },
  sess: { type: Schema.Types.Mixed, required: true },
  expire: { type: Date, required: true, index: true },
});

// User Schema
const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    profileImageUrl: String,
    userType: { type: String, required: true, enum: ["doctor", "patient"] },
    isEmailVerified: { type: Boolean, default: false },
    lastLoginAt: Date,
  },
  {
    timestamps: true,
  }
);

// Doctor Schema
const doctorSchema = new Schema<IDoctor>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    gender: String,
    dateOfBirth: String,
    phoneNumber: String,
    medicalLicenseNumber: { type: String, required: true },
    licenseState: { type: String, required: true },
    deaNumber: String,
    npiNumber: String,
    primarySpecialization: { type: String, required: true },
    subSpecialization: String,
    yearsOfExperience: String,
    boardCertifications: String,
    hospitalName: String,
    department: String,
    practiceAddress: String,
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Patient Schema
const patientSchema = new Schema<IPatient>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    gender: String,
    dateOfBirth: Date,
    phoneNumber: String,
    emergencyContactPhone: String,
    height: String,
    weight: String,
    activityLevel: String,
    occupationType: String,
    weeklyExerciseHours: Number,
    smokingStatus: String,
    insuranceProvider: String,
    policyNumber: String,
    primaryCarePhysician: String,
    currentOrthopedist: String,
    currentKLGrade: String,
  },
  {
    timestamps: true,
  }
);

// Patient Symptoms Schema
const patientSymptomsSchema = new Schema<IPatientSymptoms>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    kneePain: { type: Boolean, default: false },
    jointStiffness: { type: Boolean, default: false },
    swelling: { type: Boolean, default: false },
    limitedMobility: { type: Boolean, default: false },
    grindingSensation: { type: Boolean, default: false },
    kneeInstability: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Patient Injuries Schema
const patientInjuriesSchema = new Schema<IPatientInjuries>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "Patient", required: true },
    aclInjury: { type: Boolean, default: false },
    meniscusTear: { type: Boolean, default: false },
    kneeFracture: { type: Boolean, default: false },
    kneeReplacement: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// OTP Verification Schema
const otpVerificationSchema = new Schema<IOTPVerification>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    otp: { type: String, required: true },
    userType: { type: String, required: true, enum: ["doctor", "patient"] },
    userData: {
      email: { type: String, required: true },
      password: { type: String, required: true },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      userType: { type: String, required: true, enum: ["doctor", "patient"] },
    },
    expiresAt: { type: Date, required: true, index: true },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for automatic deletion of expired OTPs (server-side only)
if (typeof window === "undefined") {
  otpVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}

// Models
export const Session = mongoose.model("Session", sessionSchema);
export const User = mongoose.model<IUser>("User", userSchema);
export const Doctor = mongoose.model<IDoctor>("Doctor", doctorSchema);
export const Patient = mongoose.model<IPatient>("Patient", patientSchema);
export const PatientSymptoms = mongoose.model<IPatientSymptoms>("PatientSymptoms", patientSymptomsSchema);
export const PatientInjuries = mongoose.model<IPatientInjuries>("PatientInjuries", patientInjuriesSchema);
export const OTPVerification = mongoose.model<IOTPVerification>("OTPVerification", otpVerificationSchema);

// Zod validation schemas
export const insertDoctorSchema = z.object({
  userId: z.string(),
  title: z.string().min(1, "Title is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  gender: z.union([z.string(), z.null()]).optional(),
  dateOfBirth: z.union([z.string(), z.null()]).optional(),
  phoneNumber: z.union([z.string(), z.null()]).optional(),
  medicalLicenseNumber: z.string().min(1, "Medical license is required"),
  licenseState: z.string().min(1, "License state is required"),
  deaNumber: z.union([z.string(), z.null()]).optional(),
  npiNumber: z.union([z.string(), z.null()]).optional(),
  // Only knee-related specializations allowed
  primarySpecialization: z.enum(["Orthopedic Surgery", "Rheumatology", "Sports Medicine", "Physical Medicine & Rehabilitation"], { required_error: "Specialization must be knee-related" }),
  subSpecialization: z.union([z.string(), z.null()]).optional(),
  yearsOfExperience: z.union([z.string(), z.null()]).optional(),
  boardCertifications: z.union([z.string(), z.null()]).optional(),
  hospitalName: z.union([z.string(), z.null()]).optional(),
  department: z.union([z.string(), z.null()]).optional(),
  practiceAddress: z.union([z.string(), z.null()]).optional(),
  isVerified: z.boolean().optional(),
});

export const insertPatientSchema = z.object({
  userId: z.string(),
  gender: z.string().optional(),
  dateOfBirth: z.date().optional(),
  phoneNumber: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
  activityLevel: z.string().optional(),
  occupationType: z.string().optional(),
  weeklyExerciseHours: z.number().optional(),
  smokingStatus: z.string().optional(),
  insuranceProvider: z.string().optional(),
  policyNumber: z.string().optional(),
  primaryCarePhysician: z.string().optional(),
  currentOrthopedist: z.string().optional(),
  currentKLGrade: z.string().optional(),
});

export const insertPatientSymptomsSchema = z.object({
  patientId: z.string(),
  kneePain: z.boolean().optional(),
  jointStiffness: z.boolean().optional(),
  swelling: z.boolean().optional(),
  limitedMobility: z.boolean().optional(),
  grindingSensation: z.boolean().optional(),
  kneeInstability: z.boolean().optional(),
});

export const insertPatientInjuriesSchema = z.object({
  patientId: z.string(),
  aclInjury: z.boolean().optional(),
  meniscusTear: z.boolean().optional(),
  kneeFracture: z.boolean().optional(),
  kneeReplacement: z.boolean().optional(),
});

// Auth validation schemas
export const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    userType: z.enum(["doctor", "patient"], { required_error: "Please select user type" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// OTP validation schemas
export const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resendOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Types
export type UpsertUser = Partial<IUser>;
export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertPatientSymptoms = z.infer<typeof insertPatientSymptomsSchema>;
export type InsertPatientInjuries = z.infer<typeof insertPatientInjuriesSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type VerifyOTPData = z.infer<typeof verifyOTPSchema>;
export type ResendOTPData = z.infer<typeof resendOTPSchema>;
