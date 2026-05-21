import { Router } from "express";
import { userManagementController } from "../controllers/user-management-controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

router.get(
  "/",
  authMiddleware,
  rbacMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  userManagementController.getAllUsers
);

router.put(
  "/:id",
  authMiddleware,
  rbacMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  userManagementController.updateUser
);

router.delete(
  "/:id",
  authMiddleware,
  rbacMiddleware([UserRole.SUPER_ADMIN]),
  userManagementController.deleteUser
);

export default router;
