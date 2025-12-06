import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectDB } from "./db";
import { emailService } from "./services/emailService";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use("/uploads", express.static("public/uploads"));
// Serve all static files from the root public directory (e.g., /images.jpg)
app.use(express.static("public"));

// Explicit route for hero image to avoid any dev middleware conflicts
app.get("/old-patient-close-up.jpg", (_req, res) => {
  const filePath = path.resolve(import.meta.dirname, "..", "public", "old-patient-close-up.jpg");
  res.sendFile(filePath);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Background job to periodically scan for upcoming virtual appointments
 * and send reminder emails once per appointment
 */
function startVirtualVisitReminderJob() {
  const checkIntervalMs = 60 * 1000; // Check every 1 minute

  setInterval(async () => {
    try {
      const { Appointment } = await import("@shared/additional-schema");
      const { Patient, Doctor, User } = await import("@shared/schema");

      const reminderMinutes = parseInt(process.env.VIRTUAL_VISIT_REMINDER_MINUTES || "5", 10);
      const now = new Date();

      // Find virtual appointments that:
      // 1. Are scheduled or confirmed
      // 2. Have a meeting URL
      // 3. Haven't had a reminder sent yet
      // 4. Start within the reminder window
      const appointments = await Appointment.find({
        type: "virtual",
        status: { $in: ["scheduled", "confirmed"] },
        meetingUrl: { $exists: true, $ne: null },
        reminderSent: { $ne: true },
      }).lean();

      for (const apt of appointments) {
        // Parse appointment start time
        const start = new Date(apt.appointmentDate);
        if (apt.appointmentTime) {
          const [timePart, period] = (apt.appointmentTime || "00:00").split(" ");
          const [hStr, mStr] = (timePart || "00:00").split(":");
          let hours = parseInt(hStr || "0", 10);
          const minutes = parseInt(mStr || "0", 10);
          if (period === "PM" && hours !== 12) hours += 12;
          if (period === "AM" && hours === 12) hours = 0;
          start.setHours(hours, minutes, 0, 0);
        }

        const msUntilStart = start.getTime() - now.getTime();
        const minutesUntilStart = msUntilStart / (60 * 1000);

        // Only send if we're within the reminder window
        if (minutesUntilStart > 0 && minutesUntilStart <= reminderMinutes) {
          try {
            const doctor = await Doctor.findById(apt.doctorId);
            const patient = await Patient.findById(apt.patientId).populate("userId");

            const doctorNameParts = doctor ? [doctor.title, doctor.firstName, doctor.lastName].filter(Boolean) : [];
            const doctorName = doctorNameParts.join(" ") || "Doctor";

            const patientUser: any = patient?.userId || null;
            const patientName = patientUser ? `${patientUser.firstName || ""} ${patientUser.lastName || ""}`.trim() || "Patient" : "Patient";
            const patientEmail = patientUser?.email;
            const doctorEmail = doctor?.email;
            const dateStr = apt.appointmentDate.toISOString().split("T")[0];

            // Send to doctor
            if (doctorEmail) {
              await emailService.sendVirtualVisitReminderEmail({
                targetEmail: doctorEmail,
                targetName: doctorName,
                doctorName,
                patientName,
                appointmentDate: dateStr,
                appointmentTime: apt.appointmentTime,
                meetingUrl: apt.meetingUrl!,
              });
            }

            // Send to patient
            if (patientEmail) {
              await emailService.sendVirtualVisitReminderEmail({
                targetEmail: patientEmail,
                targetName: patientName,
                doctorName,
                patientName,
                appointmentDate: dateStr,
                appointmentTime: apt.appointmentTime,
                meetingUrl: apt.meetingUrl!,
              });
            }

            // Mark as sent
            await Appointment.findByIdAndUpdate(apt._id, { reminderSent: true });
            log(`✅ Sent virtual visit reminder for appointment ${apt._id}`);
          } catch (emailError) {
            console.error(`Failed to send reminder for appointment ${apt._id}:`, emailError);
          }
        }
      }
    } catch (error) {
      console.error("Error in virtual visit reminder job:", error);
    }
  }, checkIntervalMs);

  log(`📧 Virtual visit reminder job started (checking every ${checkIntervalMs / 1000}s)`);
}

(async () => {
  // Connect to MongoDB
  await connectDB();

  // Start background job to send virtual visit reminder emails
  startVirtualVisitReminderJob();

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(port, "localhost", () => {
    log(`🚀 Server running on http://localhost:${port}`);
    log(`📱 Frontend: http://localhost:${port}`);
    log(`🔗 API: http://localhost:${port}/api`);
  });
})();
