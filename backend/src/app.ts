import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { config } from "./utils/env-config";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import authRoutes from "./routes/auth-routes";
import buyerRoutes from "./routes/buyer-routes";
import sellerRoutes from "./routes/seller-routes";
import renterRoutes from "./routes/renter-routes";
import loanClientRoutes from "./routes/loan-client-routes";
import fileUploadRoutes from "./routes/file-upload-routes";
import statsRoutes from "./routes/stats-routes";
import userManagementRoutes from "./routes/user-management-routes";
import exportRoutes from "./routes/export-routes";

export const createApp = () => {
  const app = express();

  // ============================================================================
  // MIDDLEWARE
  // ============================================================================

  // Request ID for tracking
  app.use((req: Request, _res: Response, next: NextFunction) => {
    (req as any).id = uuidv4();
    next();
  });

  // CORS
  app.use(
    cors({
      origin: [config.frontendUrl, "http://localhost:3000", "http://localhost:5173"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Body parsers
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Request logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms - Request ID: ${(req as any).id}`
      );
    });
    next();
  });

  // ============================================================================
  // ROUTES
  // ============================================================================

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API version info
  app.get("/api/v1", (_req: Request, res: Response) => {
    res.json({
      status: "success",
      data: {
        name: "Nesh Property Management API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        endpoints: [
          "POST /api/v1/auth/login",
          "POST /api/v1/auth/logout",
          "GET /api/v1/auth/profile",
          "GET /api/v1/buyers",
          "GET /api/v1/sellers",
          "GET /api/v1/renters",
          "GET /api/v1/loan-clients",
        ],
      },
    });
  });

  // Auth routes
  app.use("/api/v1/auth", authRoutes);

  // CRUD routes
  app.use("/api/v1/buyers", buyerRoutes);
  app.use("/api/v1/sellers", sellerRoutes);
  app.use("/api/v1/renters", renterRoutes);
  app.use("/api/v1/loan-clients", loanClientRoutes);

  // File upload routes
  app.use("/api/v1/files", fileUploadRoutes);

  // Stats route
  app.use("/api/v1/stats", statsRoutes);

  // User management routes
  app.use("/api/v1/users", userManagementRoutes);

  // Export (PDF) routes
  app.use("/api/v1/export", exportRoutes);

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
