import { Router, Request, Response } from "express";
import { authController } from "../controllers/auth-controller";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/auth";

const router = Router();

/**
 * Auth Routes
 */

/**
 * POST /api/v1/auth/login
 * Login with email and password
 * @body { email: string, password: string }
 * @returns { user, tokens }
 */
router.post("/login", authController.login);

/**
 * POST /api/v1/auth/logout
 * Logout current user
 * @requires auth
 */
router.post("/logout", authMiddleware, authController.logout);

/**
 * GET /api/v1/auth/profile
 * Get current user profile
 * @requires auth
 */
router.get("/profile", authMiddleware, authController.getProfile);

/**
 * PATCH /api/v1/auth/profile
 * Update current user profile
 * @requires auth
 * @body { fullName?: string, phoneNumber?: string }
 */
router.patch("/profile", authMiddleware, authController.updateProfile);

/**
 * POST /api/v1/auth/change-password
 * Change password for current user
 * @requires auth
 * @body { newPassword: string }
 */
router.post("/change-password", authMiddleware, authController.changePassword);

/**
 * POST /api/v1/auth/refresh-token
 * Refresh access token
 * @body { refreshToken: string }
 */
router.post("/refresh-token", authController.refreshToken);

export default router;
