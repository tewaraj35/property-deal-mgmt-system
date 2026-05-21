import { Router } from "express";
import { renterController } from "../controllers/renter-controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

router.get("/", authMiddleware, renterController.getAllRenters);
router.get("/search", authMiddleware, renterController.searchRenters);
router.get("/:id", authMiddleware, renterController.getRenterById);

router.post(
  "/",
  authMiddleware,
  rbacMiddleware([UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  renterController.createRenter
);

router.put(
  "/:id",
  authMiddleware,
  rbacMiddleware([UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  renterController.updateRenter
);

router.delete(
  "/:id",
  authMiddleware,
  rbacMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  renterController.deleteRenter
);

export default router;
