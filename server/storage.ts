import { User, Doctor, Patient, PatientSymptoms, PatientInjuries, type IUser, type IDoctor, type IPatient, type IPatientSymptoms, type IPatientInjuries, type UpsertUser, type InsertDoctor, type InsertPatient, type InsertPatientSymptoms, type InsertPatientInjuries } from "@shared/schema";
import { Types } from "mongoose";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT - mandatory for Replit Auth)
  getUser(id: string): Promise<IUser | undefined>;
  upsertUser(user: UpsertUser): Promise<IUser>;

  // Doctor operations
  createDoctor(doctor: InsertDoctor): Promise<IDoctor>;
  getDoctorByUserId(userId: string): Promise<IDoctor | undefined>;
  getDoctorProfile(userId: string): Promise<{ user: IUser; doctor: IDoctor } | undefined>;

  // Patient operations
  createPatient(patient: InsertPatient): Promise<IPatient>;
  getPatientByUserId(userId: string): Promise<IPatient | undefined>;
  getPatientProfile(userId: string): Promise<
    | {
        user: IUser;
        patient: IPatient;
        symptoms?: IPatientSymptoms;
        injuries?: IPatientInjuries;
      }
    | undefined
  >;
  createPatientSymptoms(symptoms: InsertPatientSymptoms): Promise<IPatientSymptoms>;
  createPatientInjuries(injuries: InsertPatientInjuries): Promise<IPatientInjuries>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT - mandatory for Replit Auth)
  async getUser(id: string): Promise<IUser | undefined> {
    // Avoid CastError for invalid Mongo ObjectId values (e.g. literal "me")
    if (!Types.ObjectId.isValid(id)) {
      return undefined;
    }

    const user = await User.findById(id);
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<IUser> {
    const user = await User.findOneAndUpdate({ _id: userData._id || userData.id }, { ...userData, updatedAt: new Date() }, { upsert: true, new: true });
    return user;
  }

  // Doctor operations
  async createDoctor(doctorData: InsertDoctor): Promise<IDoctor> {
    const doctor = new Doctor(doctorData);
    await doctor.save();
    return doctor;
  }

  async getDoctorByUserId(userId: string): Promise<IDoctor | undefined> {
    const doctor = await Doctor.findOne({ userId });
    return doctor || undefined;
  }

  async getDoctorProfile(userId: string): Promise<{ user: IUser; doctor: IDoctor } | undefined> {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const doctor = await this.getDoctorByUserId(userId);
    if (!doctor) return undefined;

    return { user, doctor };
  }

  // Patient operations
  async createPatient(patientData: InsertPatient): Promise<IPatient> {
    const patient = new Patient(patientData);
    await patient.save();
    return patient;
  }

  async getPatientByUserId(userId: string): Promise<IPatient | undefined> {
    const patient = await Patient.findOne({ userId });
    return patient || undefined;
  }

  async getPatientProfile(userId: string): Promise<
    | {
        user: IUser;
        patient: IPatient;
        symptoms?: IPatientSymptoms;
        injuries?: IPatientInjuries;
      }
    | undefined
  > {
    const user = await this.getUser(userId);
    if (!user) return undefined;

    const patient = await this.getPatientByUserId(userId);
    if (!patient) return undefined;

    const symptoms = await PatientSymptoms.findOne({ patientId: patient._id });
    const injuries = await PatientInjuries.findOne({ patientId: patient._id });

    return { user, patient, symptoms: symptoms || undefined, injuries: injuries || undefined };
  }

  async createPatientSymptoms(symptomsData: InsertPatientSymptoms): Promise<IPatientSymptoms> {
    const symptoms = new PatientSymptoms(symptomsData);
    await symptoms.save();
    return symptoms;
  }

  async createPatientInjuries(injuriesData: InsertPatientInjuries): Promise<IPatientInjuries> {
    const injuries = new PatientInjuries(injuriesData);
    await injuries.save();
    return injuries;
  }
}

export const storage = new DatabaseStorage();
