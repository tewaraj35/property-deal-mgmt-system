import { Router } from "express";
import multer from "multer";
import { fileUploadController } from "../controllers/file-upload-controller";
import { authMiddleware, rbacMiddleware } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

// Configure multipart form data handler
const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    // Allowed MIME types
    const allowed = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "image/jpeg",
      "image/png",
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`));
    }
  },
});

/**
 * File Upload Routes
 * All routes require authentication
 */

/**
 * POST /api/v1/files/upload
 * Upload file for an entity
 * @requires auth
 * @requires AGENT+ role
 * @body multipart form data:
 *   - file: binary file (required)
 *   - entityType: "buyer" | "seller" | "renter" | "loan_client" (required)
 *   - entityId: UUID (required)
 */
router.post(
  "/upload",
  authMiddleware,
  rbacMiddleware([UserRole.AGENT, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  upload.single("file"),
  fileUploadController.uploadFile
);

/**
 * GET /api/v1/files/entity/:entityType/:entityId
 * Get all files for an entity
 * @requires auth
 * @param entityType - "buyer" | "seller" | "renter" | "loan_client"
 * @param entityId - entity ID
 */
router.get(
  "/entity/:entityType/:entityId",
  authMiddleware,
  fileUploadController.getFilesByEntity
);

/**
 * GET /api/v1/files/:fileId/download
 * Download file
 * @requires auth
 * @param fileId - file ID
 */
router.get("/:fileId/download", authMiddleware, fileUploadController.downloadFile);

/**
 * DELETE /api/v1/files/:fileId
 * Delete file (admin only)
 * @requires auth
 * @requires ADMIN+ role
 * @param fileId - file ID
 */
router.delete(
  "/:fileId",
  authMiddleware,
  rbacMiddleware([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  fileUploadController.deleteFile
);

export default router;
