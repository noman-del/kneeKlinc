import "dotenv/config";
import { connectDB } from "./db";
import { User } from "@shared/schema";
import { hashPassword } from "./auth";

async function seedAdmin() {
  try {
    await connectDB();

    const email = "admin@gmail.com";
    const password = "Admin@2022";

    let user = await User.findOne({ email });

    if (user) {
      if (user.userType !== "admin") {
        user.userType = "admin" as any;
        user.isEmailVerified = true;
        await user.save();
        console.log("✅ Existing user updated to admin:", email);
      } else {
        console.log("ℹ️ Admin user already exists:", email);
      }
      return;
    }

    const hashedPassword = await hashPassword(password);

    user = new User({
      email,
      password: hashedPassword,
      firstName: "System",
      lastName: "Admin",
      userType: "admin",
      isEmailVerified: true,
    });

    await user.save();
    console.log("✅ Admin user created:", email);
  } catch (error) {
    console.error("❌ Failed to seed admin user:", error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
