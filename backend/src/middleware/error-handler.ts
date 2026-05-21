import { Request, Response, NextFunction } from "express";
import { ApiError } from "../types";

/**
 * Global error handler middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("[Error]", error);

  // Handle custom API errors
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      status: "error",
      error: {
        code: error.code,
        message: error.message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).id || "unknown",
      },
    });
    return;
  }

  // Handle Supabase errors
  if (error.message?.includes("PGRST")) {
    res.status(400).json({
      status: "error",
      error: {
        code: "DATABASE_ERROR",
        message: "Database operation failed",
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).id || "unknown",
      },
    });
    return;
  }

  // Handle validation errors
  if (error.name === "ValidationError") {
    res.status(400).json({
      status: "error",
      error: {
        code: "VALIDATION_ERROR",
        message: error.message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: (req as any).id || "unknown",
      },
    });
    return;
  }

  // Handle other errors
  const isDev = process.env.NODE_ENV !== "production";
  res.status(500).json({
    status: "error",
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isDev ? (error?.message || "An unexpected error occurred") : "An unexpected error occurred",
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: (req as any).id || "unknown",
    },
  });
};

/**
 * 404 handler middleware
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    status: "error",
    error: {
      code: "NOT_FOUND",
      message: `Endpoint not found: ${req.method} ${req.path}`,
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: (req as any).id || "unknown",
    },
  });
};
