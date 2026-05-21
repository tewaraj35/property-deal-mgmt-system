import { Router } from "express";
import { statsController } from "../controllers/stats-controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.get("/", authMiddleware, statsController.getDashboardStats);
router.get("/recent-activity", authMiddleware, statsController.getRecentActivity);

export default router;
