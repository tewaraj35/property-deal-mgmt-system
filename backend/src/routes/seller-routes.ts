import { Router } from "express";
import { sellerController } from "../controllers/seller-controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

/**
 * Seller Routes - All require authentication
 */

router.get("/", authMiddleware, sellerController.getAllSellers);
router.get("/search", authMiddleware, sellerController.searchSellers);
router.get("/:id", authMiddleware, sellerController.getSellerById);

router.post(
  "/",
  authMiddleware,
  rbacMiddleware([UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  sellerController.createSeller
);

router.put(
  "/:id",
  authMiddleware,
  rbacMiddleware([UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  sellerController.updateSeller
);

router.delete(
  "/:id",
  authMiddleware,
  rbacMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  sellerController.deleteSeller
);

export default router;
