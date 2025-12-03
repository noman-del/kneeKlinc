import mongoose from "mongoose";

// MongoDB connection with auto-database creation
export const connectDB = async () => {
  try {
    // Auto-create database if it doesn't exist
    const connectionString = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/kneeklinic";

    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      // Auto-create database and collections
      autoCreate: true,
      autoIndex: true,
    });
    console.log("✅ MongoDB connected successfully to:", connectionString);
    console.log('📊 Database "kneeklinic" will be auto-created if needed');
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error instanceof Error ? error.message : String(error));
    console.warn("⚠️  Continuing without database");
    console.warn("💡 Make sure MongoDB is running on port 27017");
    // Continue without database for development
  }
};

// Export mongoose for use in other files
export { mongoose };
