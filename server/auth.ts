import jwt from "jsonwebtoken";
import type { Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import { User } from "@shared/schema";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    userType: "doctor" | "patient";
  };
}

// Generate JWT token
export const generateToken = (userId: string, email: string, userType: "doctor" | "patient"): string => {
  const secret: Secret = process.env.JWT_SECRET ?? "fallback-secret";
  const defaultExpiresIn = "1d" as const;
  const expiresIn: SignOptions["expiresIn"] = (process.env.JWT_EXPIRES_IN ?? defaultExpiresIn) as SignOptions["expiresIn"];

  return jwt.sign({ id: userId, email, userType }, secret, { expiresIn });
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

// Compare password
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

// Verify JWT token middleware
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    const secret: Secret = process.env.JWT_SECRET ?? "fallback-secret";
    const decoded = jwt.verify(token, secret) as any;

    // Verify user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      userType: decoded.userType,
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Role-based authorization middleware
export const authorizeRole = (...roles: ("doctor" | "patient")[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

// Optional authentication middleware (for routes that work with or without auth)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const secret: Secret = process.env.JWT_SECRET ?? "fallback-secret";
      const decoded = jwt.verify(token, secret) as any;
      const user = await User.findById(decoded.id);

      if (user) {
        req.user = {
          id: decoded.id,
          email: decoded.email,
          userType: decoded.userType,
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
