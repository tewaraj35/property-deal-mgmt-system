import { Router } from "express";
import { buyerController } from "../controllers/buyer-controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

/**
 * Buyer Routes
 * All routes require authentication
 */

/**
 * GET /api/v1/buyers
 * Get all buyers with pagination
 * @requires auth
 * @query page - page number (default 1)
 * @query limit - items per page (default 50, max 100)
 * @query status - filter by status
 */
router.get("/", authMiddleware, buyerController.getAllBuyers);

/**
 * GET /api/v1/buyers/search
 * Search buyers by name, email, phone
 * @requires auth
 * @query q - search query (required)
 * @query limit - max results (default 20)
 */
router.get("/search", authMiddleware, buyerController.searchBuyers);

/**
 * GET /api/v1/buyers/:id
 * Get single buyer by ID
 * @requires auth
 * @param id - buyer ID
 */
router.get("/:id", authMiddleware, buyerController.getBuyerById);

/**
 * POST /api/v1/buyers
 * Create new buyer
 * @requires auth
 * @requires AGENT+ role
 * @body {
 *   name: string (required),
 *   phoneNumber: string (required),
 *   email?: string,
 *   location?: string,
 *   propertyOfInterest?: string,
 *   leadSource?: string,
 *   followUpDate?: string (YYYY-MM-DD),
 *   status?: BuyerStatus,
 *   notes?: string
 * }
 */
router.post(
  "/",
  authMiddleware,
  rbacMiddleware([UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  buyerController.createBuyer
);

/**
 * PUT /api/v1/buyers/:id
 * Update buyer
 * @requires auth
 * @requires AGENT+ role (agents can only update own buyers)
 * @param id - buyer ID
 * @body partial update data
 */
router.put(
  "/:id",
  authMiddleware,
  rbacMiddleware([UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  buyerController.updateBuyer
);

/**
 * DELETE /api/v1/buyers/:id
 * Delete (soft delete) buyer
 * @requires auth
 * @requires ADMIN+ role (only admins can delete)
 * @param id - buyer ID
 */
router.delete(
  "/:id",
  authMiddleware,
  rbacMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  buyerController.deleteBuyer
);

export default router;
