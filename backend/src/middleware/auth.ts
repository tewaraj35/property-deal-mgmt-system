import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../utils/env-config";
import { RequestContext, UserRole } from "../types";

/**
 * Extend Express Request to include context
 */
declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        status: "error",
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid authorization header",
        },
      });
      return;
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    const decoded = jwt.verify(token, config.supabaseJwtSecret) as any;

    if (!decoded.sub || !decoded.email) {
      res.status(401).json({
        status: "error",
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid token payload",
        },
      });
      return;
    }

    // Attach user context to request
    req.context = {
      userId: decoded.sub,
      userEmail: decoded.email,
      userRole: decoded.role || UserRole.AGENT,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: "error",
        error: {
          code: "TOKEN_EXPIRED",
          message: "Token has expired",
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        status: "error",
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid token",
        },
      });
      return;
    }

    res.status(500).json({
      status: "error",
      error: {
        code: "AUTH_ERROR",
        message: "Authentication failed",
      },
    });
  }
};

/**
 * RBAC middleware - checks if user has required role
 */
export const rbacMiddleware = (requiredRoles: UserRole[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.context) {
      res.status(401).json({
        status: "error",
        error: {
          code: "UNAUTHORIZED",
          message: "User context not found",
        },
      });
      return;
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(req.context.userRole)) {
      res.status(403).json({
        status: "error",
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions for this action",
        },
      });
      return;
    }

    next();
  };
};

/**
 * Optional auth middleware - doesn't fail if token missing
 */
export const optionalAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, config.supabaseJwtSecret) as any;

      req.context = {
        userId: decoded.sub,
        userEmail: decoded.email,
        userRole: decoded.role || UserRole.AGENT,
      };
    }
  } catch {
    // Silently fail for optional auth
  }

  next();
};
