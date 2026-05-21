import { Request, Response, NextFunction } from "express";
import { buyerService } from "../services/buyer-service";
import { RequestContext } from "../types";

/**
 * Buyer controller - handles buyer endpoints
 */
export const buyerController = {
  /**
   * GET /api/v1/buyers
   * Get all buyers with pagination and filters
   */
  async getAllBuyers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { page = 1, limit = 50, status, dateFrom, dateTo } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
      const offset = (pageNum - 1) * limitNum;

      // Agents see only their buyers, admins see all
      const agentFilter =
        req.context.userRole === "AGENT" ? req.context.userId : undefined;

      const result = await buyerService.getAllBuyers(
        agentFilter,
        status as any,
        limitNum,
        offset,
        dateFrom as string | undefined,
        dateTo as string | undefined
      );

      res.json({
        status: "success",
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
          page: result.page,
          total: result.total,
          limit: result.limit,
          hasMore: result.page * result.limit < result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/v1/buyers/:id
   * Get single buyer
   */
  async getBuyerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { id } = req.params;
      const buyer = await buyerService.getBuyerById(id);

      // Check authorization
      if (
        req.context.userRole === "AGENT" &&
        buyer.agentId !== req.context.userId
      ) {
        res.status(403).json({
          status: "error",
          error: {
            code: "FORBIDDEN",
            message: "You can only view your own buyers",
          },
        });
        return;
      }

      res.json({
        status: "success",
        data: buyer,
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
   * POST /api/v1/buyers
   * Create new buyer
   */
  async createBuyer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { name, phoneNumber, email, location, propertyOfInterest, leadSource, followUpDate, status, notes } = req.body;

      // Validate required fields
      if (!name || !phoneNumber) {
        res.status(400).json({
          status: "error",
          error: {
            code: "INVALID_INPUT",
            message: "Name and phone number are required",
          },
        });
        return;
      }

      const buyer = await buyerService.createBuyer(req.context.userId, {
        name,
        phoneNumber,
        email,
        location,
        propertyOfInterest,
        leadSource,
        followUpDate,
        status,
        notes,
      });

      res.status(201).json({
        status: "success",
        data: buyer,
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
   * PUT /api/v1/buyers/:id
   * Update buyer
   */
  async updateBuyer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { id } = req.params;

      // Check authorization
      const buyer = await buyerService.getBuyerById(id);
      if (
        req.context.userRole === "AGENT" &&
        buyer.agentId !== req.context.userId
      ) {
        res.status(403).json({
          status: "error",
          error: {
            code: "FORBIDDEN",
            message: "You can only update your own buyers",
          },
        });
        return;
      }

      const updatedBuyer = await buyerService.updateBuyer(
        id,
        req.context.userId,
        req.body
      );

      res.json({
        status: "success",
        data: updatedBuyer,
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
   * DELETE /api/v1/buyers/:id
   * Delete (soft delete) buyer
   */
  async deleteBuyer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { id } = req.params;

      // Check authorization
      const buyer = await buyerService.getBuyerById(id);
      if (
        req.context.userRole === "AGENT" &&
        buyer.agentId !== req.context.userId
      ) {
        res.status(403).json({
          status: "error",
          error: {
            code: "FORBIDDEN",
            message: "You can only delete your own buyers",
          },
        });
        return;
      }

      await buyerService.deleteBuyer(id, req.context.userId);

      res.json({
        status: "success",
        data: { message: "Buyer deleted successfully" },
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
   * GET /api/v1/buyers/search
   * Search buyers
   */
  async searchBuyers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { q, limit = 20 } = req.query;

      if (!q) {
        res.status(400).json({
          status: "error",
          error: {
            code: "INVALID_INPUT",
            message: "Search query (q) is required",
          },
        });
        return;
      }

      // Only search own buyers if agent
      const agentFilter =
        req.context.userRole === "AGENT" ? req.context.userId : undefined;

      const results = await buyerService.searchBuyers(
        agentFilter || "",
        q as string,
        Math.min(100, parseInt(limit as string) || 20)
      );

      res.json({
        status: "success",
        data: results,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
          count: results.length,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
