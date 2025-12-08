import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  // Send simple appointment booking notification to doctor
  async sendAppointmentBookedEmail(options: { doctorEmail: string; doctorName: string; patientName: string; appointmentDate: string; appointmentTime: string; type: "in-person" | "virtual" }): Promise<void> {
    if (!this.transporter || !this.isConfigured) {
      console.warn("Email service not configured - skipping appointment booked email");
      return;
    }

    const { doctorEmail, doctorName, patientName, appointmentDate, appointmentTime, type } = options;

    const subject = `New appointment booked - ${appointmentDate} ${appointmentTime}`;
    const text = `Dear ${doctorName},

A new ${type} appointment has been booked with you.

Patient: ${patientName}
Date: ${appointmentDate}
Time: ${appointmentTime}

Please log in to your KneeKlinic dashboard to view full details.

Best regards,
KneeKlinic Team`;

    const html = text.replace(/\n/g, "<br/>");

    await this.transporter.sendMail({
      from: `"KneeKlinic" <${process.env.EMAIL_USER}>`,
      to: doctorEmail,
      subject,
      text,
      html,
    });
  }

  // Send appointment status change notification (e.g., confirmed)
  async sendAppointmentStatusChangedEmail(options: { targetEmail: string; targetName: string; doctorName: string; patientName: string; appointmentDate: string; appointmentTime: string; type: "in-person" | "virtual"; newStatus: "scheduled" | "confirmed" | "completed" | "cancelled" }): Promise<void> {
    if (!this.transporter || !this.isConfigured) {
      console.warn("Email service not configured - skipping appointment status email");
      return;
    }

    const { targetEmail, targetName, doctorName, patientName, appointmentDate, appointmentTime, type, newStatus } = options;

    const subject = `Appointment ${newStatus} - ${appointmentDate} ${appointmentTime}`;
    const text = `Dear ${targetName},

Your ${type} appointment status has been updated.

Doctor: ${doctorName}
Patient: ${patientName}
Date: ${appointmentDate}
Time: ${appointmentTime}

New status: ${newStatus.toUpperCase()}

Please log in to your KneeKlinic dashboard to review the appointment.

Best regards,
KneeKlinic Team`;

    const html = text.replace(/\n/g, "<br/>");

    await this.transporter.sendMail({
      from: `"KneeKlinic" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject,
      text,
      html,
    });
  }

  // Send virtual visit reminder email with join link
  async sendVirtualVisitReminderEmail(options: { targetEmail: string; targetName: string; doctorName: string; patientName: string; appointmentDate: string; appointmentTime: string; meetingUrl: string }): Promise<void> {
    if (!this.transporter || !this.isConfigured) {
      console.warn("Email service not configured - skipping virtual visit reminder email");
      return;
    }

    const { targetEmail, targetName, doctorName, patientName, appointmentDate, appointmentTime, meetingUrl } = options;

    const subject = `Your virtual visit starts soon - ${appointmentDate} ${appointmentTime}`;
    const text = `Dear ${targetName},

This is a reminder that your virtual appointment is starting soon.

Doctor: ${doctorName}
Patient: ${patientName}
Date: ${appointmentDate}
Time: ${appointmentTime}

You can join the video visit using this link:
${meetingUrl}

Best regards,
KneeKlinic Team`;

    const html = text.replace(/\n/g, "<br/>");

    await this.transporter.sendMail({
      from: `"KneeKlinic" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject,
      text,
      html,
    });
  }

  // Send appointment cancellation notification
  async sendAppointmentCancelledEmail(options: { targetEmail: string; targetName: string; doctorName: string; patientName: string; appointmentDate: string; appointmentTime: string; type: "in-person" | "virtual" }): Promise<void> {
    if (!this.transporter || !this.isConfigured) {
      console.warn("Email service not configured - skipping appointment cancelled email");
      return;
    }

    const { targetEmail, targetName, doctorName, patientName, appointmentDate, appointmentTime, type } = options;

    const subject = `Appointment cancelled - ${appointmentDate} ${appointmentTime}`;
    const text = `Dear ${targetName},

Your ${type} appointment has been cancelled.

Doctor: ${doctorName}
Patient: ${patientName}
Date: ${appointmentDate}
Time: ${appointmentTime}

If this was unexpected, please log in to your KneeKlinic dashboard to review or book a new appointment.

Best regards,
KneeKlinic Team`;

    const html = text.replace(/\n/g, "<br/>");

    await this.transporter.sendMail({
      from: `"KneeKlinic" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject,
      text,
      html,
    });
  }

  // Send simple appointment reschedule notification
  async sendAppointmentRescheduledEmail(options: { targetEmail: string; targetName: string; actorType: "doctor" | "patient"; doctorName: string; patientName: string; oldDate: string; oldTime: string; newDate: string; newTime: string; type: "in-person" | "virtual" }): Promise<void> {
    if (!this.transporter || !this.isConfigured) {
      console.warn("Email service not configured - skipping appointment rescheduled email");
      return;
    }

    const { targetEmail, targetName, actorType, doctorName, patientName, oldDate, oldTime, newDate, newTime, type } = options;

    const initiatedBy = actorType === "doctor" ? "Doctor" : "Patient";
    const subject = `Appointment rescheduled - ${newDate} ${newTime}`;

    const text = `Dear ${targetName},

Your ${type} appointment has been rescheduled.

Doctor: ${doctorName}
Patient: ${patientName}

Previous schedule:
  Date: ${oldDate}
  Time: ${oldTime}

New schedule:
  Date: ${newDate}
  Time: ${newTime}

Reschedule initiated by: ${initiatedBy}

Please log in to your KneeKlinic dashboard to review the updated appointment details.

Best regards,
KneeKlinic Team`;

    const html = text.replace(/\n/g, "<br/>");

    await this.transporter.sendMail({
      from: `"KneeKlinic" <${process.env.EMAIL_USER}>`,
      to: targetEmail,
      subject,
      text,
      html,
    });
  }

  private initializeTransporter() {
    try {
      // Check if email credentials are provided
      const emailUser = process.env.EMAIL_USER;
      const emailPass = process.env.EMAIL_PASS;
      const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
      const emailPort = parseInt(process.env.EMAIL_PORT || "587");

      if (!emailUser || !emailPass) {
        console.warn("⚠️  Email credentials not configured. Email functionality will be disabled.");
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: emailHost,
        port: emailPort,
        secure: emailPort === 465, // true for 465, false for other ports
        auth: {
          user: emailUser,
          pass: emailPass,
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
        },
      });

      this.isConfigured = true;
      console.log("✅ Email service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize email service:", error);
      this.isConfigured = false;
    }
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter || !this.isConfigured) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log("✅ Email server connection verified");
      return true;
    } catch (error) {
      console.error("❌ Email server connection failed:", error);
      return false;
    }
  }

  async sendContactEmail(formData: ContactFormData): Promise<{ success: boolean; message: string }> {
    if (!this.transporter || !this.isConfigured) {
      return {
        success: false,
        message: "Email service is not configured. Please contact support directly.",
      };
    }

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return {
          success: false,
          message: "Please provide a valid email address.",
        };
      }

      // Validate required fields
      if (!formData.name?.trim() || !formData.subject?.trim() || !formData.message?.trim()) {
        return {
          success: false,
          message: "Please fill in all required fields.",
        };
      }

      // Sanitize input data
      const sanitizedData = {
        name: formData.name.trim().substring(0, 100),
        email: formData.email.trim().toLowerCase(),
        subject: formData.subject.trim().substring(0, 200),
        category: formData.category || "General",
        message: formData.message.trim().substring(0, 2000),
      };

      // Generate email templates
      const templatesDir = path.join(__dirname, "..", "templates");

      const contactEmailHtml = await ejs.renderFile(path.join(templatesDir, "contact-email.ejs"), sanitizedData);

      const autoReplyHtml = await ejs.renderFile(path.join(templatesDir, "auto-reply.ejs"), sanitizedData);

      // Send notification email to support
      const supportEmailOptions = {
        from: `"JointSense AI Contact Form" <${process.env.EMAIL_USER}>`,
        to: process.env.SUPPORT_EMAIL || "support@jointsense.ai",
        replyTo: sanitizedData.email,
        subject: `[${sanitizedData.category}] ${sanitizedData.subject}`,
        html: contactEmailHtml,
        text: this.generatePlainTextEmail(sanitizedData),
      };

      // Send auto-reply to user
      const autoReplyOptions = {
        from: `"JointSense AI Support" <${process.env.EMAIL_USER}>`,
        to: sanitizedData.email,
        subject: `Thank you for contacting JointSense AI - ${sanitizedData.subject}`,
        html: autoReplyHtml,
        text: this.generatePlainTextAutoReply(sanitizedData),
      };

      // Send both emails
      await Promise.all([this.transporter.sendMail(supportEmailOptions), this.transporter.sendMail(autoReplyOptions)]);

      console.log(`✅ Contact form emails sent successfully for: ${sanitizedData.email}`);

      return {
        success: true,
        message: "Your message has been sent successfully! We'll get back to you within 24 hours.",
      };
    } catch (error) {
      console.error("❌ Failed to send contact form emails:", error);

      // Provide user-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes("Invalid login")) {
          return {
            success: false,
            message: "Email service configuration error. Please try again later or contact support directly.",
          };
        }
        if (error.message.includes("Network")) {
          return {
            success: false,
            message: "Network error. Please check your connection and try again.",
          };
        }
      }

      return {
        success: false,
        message: "Failed to send your message. Please try again later or contact support directly at jointsenseai2024@gmail.com",
      };
    }
  }

  private generatePlainTextEmail(data: ContactFormData): string {
    return `
New Contact Form Submission - JointSense AI

Name: ${data.name}
Email: ${data.email}
Category: ${data.category}
Subject: ${data.subject}

Message:
${data.message}

Submitted at: ${new Date().toLocaleString()}

---
This email was automatically generated from the JointSense AI contact form.
Please respond to ${data.email} to reply to this inquiry.
    `.trim();
  }

  private generatePlainTextAutoReply(data: ContactFormData): string {
    return `
Hi ${data.name}!

Thank you for reaching out to JointSense AI! We've successfully received your message regarding "${data.subject}" and truly appreciate you taking the time to contact us.

QUICK RESPONSE GUARANTEE
Our support team will review your inquiry and respond within 24 hours during business days. For urgent matters, we aim to respond even sooner!

What happens next?
• Our team will carefully review your inquiry
• We'll prepare a personalized response with expert insights  
• You'll receive a detailed reply at ${data.email}
• We'll work together to address your needs

In the meantime, feel free to explore our platform and discover how JointSense AI is revolutionizing knee osteoarthritis diagnosis and management through cutting-edge artificial intelligence.

Need immediate assistance?
For urgent technical issues, you can also reach us at jointsenseai2024@gmail.com or call our support line during business hours.

Best regards,
JointSense AI Support Team
Empowering healthcare through intelligent technology

---
This is an automated confirmation email. Please do not reply to this message.
    `.trim();
  }

  // Send OTP verification email
  async sendOTPEmail(email: string, otp: string, firstName: string, userType: "doctor" | "patient" | "admin"): Promise<{ success: boolean; message: string }> {
    if (!this.transporter || !this.isConfigured) {
      return {
        success: false,
        message: "Email service is not configured. Please contact support.",
      };
    }

    try {
      const templatesDir = path.join(__dirname, "..", "templates");

      const otpEmailHtml = await ejs.renderFile(path.join(templatesDir, "otp-email.ejs"), {
        firstName,
        otp,
        userType: userType === "doctor" ? "Doctor" : userType === "patient" ? "Patient" : "Admin",
        expiryMinutes: 10,
      });

      const mailOptions = {
        from: `"KneeKlinic Verification" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Verify Your KneeKlinic Account - OTP Code",
        html: otpEmailHtml,
        text: this.generatePlainTextOTP(firstName, otp, userType),
      };

      await this.transporter.sendMail(mailOptions);

      console.log(`✅ OTP email sent successfully to: ${email}`);

      return {
        success: true,
        message: "OTP sent successfully to your email",
      };
    } catch (error) {
      console.error("❌ Failed to send OTP email:", error);
      return {
        success: false,
        message: "Failed to send OTP. Please try again later.",
      };
    }
  }

  private generatePlainTextOTP(firstName: string, otp: string, userType: "doctor" | "patient" | "admin"): string {
    return `
Hi ${firstName}!

Welcome to KneeKlinic! Thank you for registering as a ${userType === "doctor" ? "Doctor" : userType === "patient" ? "Patient" : "Admin"}.

Your One-Time Password (OTP) for email verification is:

${otp}

This OTP will expire in 10 minutes.

Please enter this code on the verification page to complete your registration.

If you didn't request this code, please ignore this email.

Best regards,
KneeKlinic Team
    `.trim();
  }

  // Test method for development
  async testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
    if (!this.isConfigured) {
      return {
        success: false,
        message: "Email service is not configured",
      };
    }

    const isConnected = await this.verifyConnection();
    return {
      success: isConnected,
      message: isConnected ? "Email configuration is working correctly" : "Email configuration failed",
    };
  }
}

export const emailService = new EmailService();
