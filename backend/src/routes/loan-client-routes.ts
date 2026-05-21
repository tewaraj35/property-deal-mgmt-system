import { Router } from "express";
import { loanClientController } from "../controllers/loan-client-controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

router.get("/", authMiddleware, loanClientController.getAllLoanClients);
router.get("/search", authMiddleware, loanClientController.searchLoanClients);
router.get("/:id", authMiddleware, loanClientController.getLoanClientById);

router.post(
  "/",
  authMiddleware,
  rbacMiddleware([UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  loanClientController.createLoanClient
);

router.put(
  "/:id",
  authMiddleware,
  rbacMiddleware([UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  loanClientController.updateLoanClient
);

router.delete(
  "/:id",
  authMiddleware,
  rbacMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  loanClientController.deleteLoanClient
);

export default router;
