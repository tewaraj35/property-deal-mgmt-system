import { Request, Response, NextFunction } from "express";
import { fileUploadService } from "../services/file-upload-service";

/**
 * File upload controller - handles file upload endpoints
 */
export const fileUploadController = {
  /**
   * POST /api/v1/files/upload
   * Upload a file
   */
  async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          status: "error",
          error: { code: "BAD_REQUEST", message: "No file provided" },
        });
        return;
      }

      const { entityType, entityId } = req.body;

      if (!entityType || !entityId) {
        res.status(400).json({
          status: "error",
          error: { code: "BAD_REQUEST", message: "entityType and entityId required" },
        });
        return;
      }

      // Normalize entity type
      const normalizedEntityType = entityType === "loan_client" ? "loan_client" : entityType;

      // Validate entity type
      const validTypes = ["buyer", "seller", "renter", "loan_client"];
      if (!validTypes.includes(normalizedEntityType)) {
        res.status(400).json({
          status: "error",
          error: { code: "BAD_REQUEST", message: "Invalid entityType" },
        });
        return;
      }

      const file = await fileUploadService.uploadFile(
        req.context.userId,
        normalizedEntityType,
        entityId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.status(201).json({
        status: "success",
        data: file,
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
   * GET /api/v1/files/:entityType/:entityId
   * Get files for an entity
   */
  async getFilesByEntity(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { entityType, entityId } = req.params;

      // Normalize entity type
      const normalizedEntityType = entityType === "loan_client" ? "loan_client" : entityType;

      // Validate entity type
      const validTypes = ["buyer", "seller", "renter", "loan_client"];
      if (!validTypes.includes(normalizedEntityType)) {
        res.status(400).json({
          status: "error",
          error: { code: "BAD_REQUEST", message: "Invalid entityType" },
        });
        return;
      }

      const files = await fileUploadService.getFilesByEntity(
        normalizedEntityType,
        entityId
      );

      res.json({
        status: "success",
        data: files,
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
   * GET /api/v1/files/:fileId/download
   * Download file
   */
  async downloadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { fileId } = req.params;

      const { data, file } = await fileUploadService.downloadFile(fileId);

      res.set({
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.fileName}"`,
      });

      res.send(Buffer.from(data));
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/v1/files/:fileId
   * Delete file (admin only)
   */
  async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { fileId } = req.params;

      await fileUploadService.deleteFile(fileId, req.context.userId);

      res.json({
        status: "success",
        data: { message: "File deleted successfully" },
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
