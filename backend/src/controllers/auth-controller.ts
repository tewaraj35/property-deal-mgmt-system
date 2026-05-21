import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth-service";
import { supabaseService } from "../services/supabase-service";
import { ApiError } from "../types";

/**
 * Auth controller - handles authentication endpoints
 */
export const authController = {
  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({
          status: "error",
          error: {
            code: "INVALID_INPUT",
            message: "Email and password are required",
          },
        });
        return;
      }

      // Authenticate user
      const { user, tokens } = await authService.login(email, password);

      // Create audit log
      await supabaseService.createAuditLog(
        user.id,
        "LOGIN",
        "auth",
        user.id,
        null,
        { email: user.email, role: user.role },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({
        status: "success",
        data: {
          user,
          tokens,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
        });
        return;
      }

      // Create audit log
      await supabaseService.createAuditLog(
        req.context.userId,
        "LOGOUT",
        "auth",
        req.context.userId,
        null,
        { email: req.context.userEmail },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({
        status: "success",
        data: {
          message: "Logged out successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/auth/profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
        });
        return;
      }

      const user = await authService.getUserProfile(req.context.userId);

      res.json({
        status: "success",
        data: user,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/v1/auth/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
        });
        return;
      }

      const { fullName, phoneNumber } = req.body;

      const oldValues = await authService.getUserProfile(req.context.userId);

      const updatedUser = await authService.updateUserProfile(req.context.userId, {
        fullName,
        phoneNumber,
      });

      // Create audit log
      await supabaseService.createAuditLog(
        req.context.userId,
        "UPDATE_PROFILE",
        "auth",
        req.context.userId,
        oldValues,
        updatedUser,
        req.ip,
        req.headers["user-agent"]
      );

      res.json({
        status: "success",
        data: updatedUser,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/change-password
   */
  async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
        });
        return;
      }

      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({
          status: "error",
          error: {
            code: "INVALID_PASSWORD",
            message: "Password must be at least 6 characters",
          },
        });
        return;
      }

      await authService.changePassword(req.context.userId, newPassword);

      // Create audit log
      await supabaseService.createAuditLog(
        req.context.userId,
        "CHANGE_PASSWORD",
        "auth",
        req.context.userId,
        null,
        { password_changed: true },
        req.ip,
        req.headers["user-agent"]
      );

      res.json({
        status: "success",
        data: {
          message: "Password changed successfully",
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/v1/auth/refresh-token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          status: "error",
          error: {
            code: "MISSING_TOKEN",
            message: "Refresh token is required",
          },
        });
        return;
      }

      const newAccessToken = authService.refreshToken(refreshToken);

      res.json({
        status: "success",
        data: {
          accessToken: newAccessToken,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
