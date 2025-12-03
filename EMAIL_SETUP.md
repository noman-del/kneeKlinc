# Email OTP Authentication Setup Guide

## Overview

A professional OTP-based email verification system has been implemented for both doctor and patient registration. This ensures secure account creation with email verification.

## Features Implemented

### 🔐 Security Features

- **6-digit OTP generation** using cryptographically secure random numbers
- **10-minute expiration** for OTPs
- **Maximum 5 verification attempts** per OTP
- **Password hashing** before storing in OTP records
- **Automatic cleanup** of expired OTPs using MongoDB TTL indexes

### 📧 Email Functionality

- **Professional email templates** with modern design
- **OTP delivery** via Nodemailer
- **Resend OTP** with countdown timer (60 seconds)
- **Email verification status** tracked in user records

### 🎨 User Experience

- **Beautiful OTP input UI** with auto-focus and paste support
- **Real-time validation** and error handling
- **Countdown timer** for resend functionality
- **Smooth transitions** between signup and verification screens
- **Responsive design** for all devices

## Environment Variables Required

Add these to your `.env` file:

```env
# Email Configuration (Required for OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Support Email (Optional)
SUPPORT_EMAIL=support@kneeklinic.com

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# MongoDB Connection
MONGODB_URI=your-mongodb-connection-string
```

## Gmail Setup Instructions

### Step 1: Enable 2-Factor Authentication

1. Go to your Google Account settings
2. Navigate to **Security**
3. Enable **2-Step Verification**

### Step 2: Generate App Password

1. Go to **Security** → **2-Step Verification**
2. Scroll to **App passwords**
3. Select **Mail** and **Other (Custom name)**
4. Name it "KneeKlinic"
5. Copy the generated 16-character password
6. Use this as `EMAIL_PASS` in your `.env` file

### Step 3: Configure Less Secure Apps (if needed)

- For Gmail, app passwords are recommended
- Ensure "Less secure app access" is OFF (use app passwords instead)

## Files Created/Modified

### Backend Files

1. **`shared/schema.ts`**

   - Added `IOTPVerification` interface
   - Created `otpVerificationSchema` with TTL index
   - Added `OTPVerification` model
   - Added validation schemas: `verifyOTPSchema`, `resendOTPSchema`

2. **`server/services/otpService.ts`** (NEW)

   - OTP generation and management
   - Email sending integration
   - Verification logic with attempt tracking
   - Resend functionality
   - Cleanup methods

3. **`server/services/emailService.ts`**

   - Added `sendOTPEmail()` method
   - Professional email template rendering
   - Plain text fallback for OTP emails

4. **`server/templates/otp-email.ejs`** (NEW)

   - Beautiful HTML email template
   - Responsive design
   - Security notices and instructions

5. **`server/routes.ts`**
   - Modified `/api/auth/signup` to send OTP
   - Added `/api/auth/verify-otp` endpoint
   - Added `/api/auth/resend-otp` endpoint

### Frontend Files

1. **`client/src/components/OTPVerification.tsx`** (NEW)

   - 6-digit OTP input component
   - Auto-focus and paste support
   - Countdown timer for resend
   - Beautiful UI with animations

2. **`client/src/pages/signup-doctor.tsx`**

   - Integrated OTP verification flow
   - Conditional rendering for OTP screen
   - Success handlers for account creation

3. **`client/src/pages/signup-patient.tsx`**
   - Integrated OTP verification flow
   - Conditional rendering for OTP screen
   - Success handlers for account creation

## API Endpoints

### POST `/api/auth/signup`

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "userType": "patient" | "doctor"
}
```

**Response:**

```json
{
  "message": "OTP sent to your email. Please verify to complete registration.",
  "email": "user@example.com",
  "requiresVerification": true
}
```

### POST `/api/auth/verify-otp`

**Request:**

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**

```json
{
  "message": "Account created successfully",
  "user": { ... },
  "token": "jwt-token",
  "authenticated": true
}
```

### POST `/api/auth/resend-otp`

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "message": "New OTP sent successfully to your email"
}
```

## User Flow

### Registration Flow

1. **User fills signup form** → First name, last name, email, password
2. **Submit form** → Backend validates and sends OTP to email
3. **OTP screen appears** → User enters 6-digit code from email
4. **Verify OTP** → Backend validates OTP and creates account
5. **Success** → User is logged in and redirected
   - Doctors → Profile registration page
   - Patients → Home page

### OTP Features

- **Auto-submit** when all 6 digits are entered
- **Paste support** for copying OTP from email
- **Resend OTP** after 60-second countdown
- **5 attempts** maximum before requiring new OTP
- **10-minute expiration** for security

## Testing

### Test Email Functionality

```bash
# Start the server
npm run dev

# Test email configuration
curl http://localhost:5000/api/test-email
```

### Manual Testing Steps

1. Navigate to `/signup-patient` or `/signup-doctor`
2. Fill in the registration form
3. Submit and check email for OTP
4. Enter OTP on verification screen
5. Test resend functionality
6. Test invalid OTP handling
7. Test expired OTP handling

## Security Considerations

### Implemented Security Measures

- ✅ OTP expires after 10 minutes
- ✅ Maximum 5 verification attempts
- ✅ Passwords hashed before storage
- ✅ OTPs are single-use only
- ✅ Automatic cleanup of expired OTPs
- ✅ Rate limiting on resend (60-second cooldown)
- ✅ Email verification status tracked

### Best Practices

- Never log OTP codes in production
- Use environment variables for email credentials
- Enable 2FA on email account
- Use app-specific passwords
- Monitor failed verification attempts
- Implement rate limiting on signup endpoint

## Troubleshooting

### Email Not Sending

1. Check `EMAIL_USER` and `EMAIL_PASS` in `.env`
2. Verify Gmail app password is correct
3. Check server logs for email errors
4. Test email configuration endpoint

### OTP Not Received

1. Check spam/junk folder
2. Verify email address is correct
3. Check server logs for sending errors
4. Try resending OTP

### Verification Fails

1. Check OTP hasn't expired (10 minutes)
2. Verify correct OTP entered
3. Check attempt count (max 5)
4. Request new OTP if needed

## Database Schema

### OTPVerification Collection

```javascript
{
  email: String (indexed, lowercase),
  otp: String (6 digits),
  userType: "doctor" | "patient",
  userData: {
    email: String,
    password: String (hashed),
    firstName: String,
    lastName: String,
    userType: String
  },
  expiresAt: Date (TTL index),
  verified: Boolean,
  attempts: Number,
  createdAt: Date
}
```

## Production Deployment

### Pre-deployment Checklist

- [ ] Set all environment variables
- [ ] Test email sending in production
- [ ] Configure proper SMTP server
- [ ] Set up email monitoring
- [ ] Enable rate limiting
- [ ] Configure proper error logging
- [ ] Test OTP flow end-to-end

### Recommended Email Services

- **Gmail** (for development/small scale)
- **SendGrid** (for production)
- **AWS SES** (for production)
- **Mailgun** (for production)
- **Postmark** (for transactional emails)

## Support

For issues or questions:

1. Check server logs for errors
2. Verify environment variables
3. Test email configuration
4. Review this documentation

---

**Implementation Date:** November 2024  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
