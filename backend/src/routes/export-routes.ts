import { Router } from "express";
import { exportController } from "../controllers/export-controller";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// GET /api/v1/export/:entity/pdf  (entity = buyers | sellers | renters | loan-clients)
router.get("/:entity/pdf", authMiddleware, exportController.exportPdf);
router.get("/:entity/csv", authMiddleware, exportController.exportCsv);

export default router;
