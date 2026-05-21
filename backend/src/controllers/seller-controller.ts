import { Request, Response, NextFunction } from "express";
import { sellerService } from "../services/seller-service";

/**
 * Seller controller - handles seller endpoints
 */
export const sellerController = {
  async getAllSellers(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const agentFilter =
        req.context.userRole === "AGENT" ? req.context.userId : undefined;

      const result = await sellerService.getAllSellers(
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
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getSellerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { id } = req.params;
      const seller = await sellerService.getSellerById(id);

      if (
        req.context.userRole === "AGENT" &&
        seller.agentId !== req.context.userId
      ) {
        res.status(403).json({
          status: "error",
          error: {
            code: "FORBIDDEN",
            message: "You can only view your own sellers",
          },
        });
        return;
      }

      res.json({
        status: "success",
        data: seller,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async createSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { name, phoneNumber } = req.body;

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

      const seller = await sellerService.createSeller(req.context.userId, req.body);

      res.status(201).json({
        status: "success",
        data: seller,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { id } = req.params;
      const seller = await sellerService.getSellerById(id);

      if (
        req.context.userRole === "AGENT" &&
        seller.agentId !== req.context.userId
      ) {
        res.status(403).json({
          status: "error",
          error: {
            code: "FORBIDDEN",
            message: "You can only update your own sellers",
          },
        });
        return;
      }

      const updatedSeller = await sellerService.updateSeller(
        id,
        req.context.userId,
        req.body
      );

      res.json({
        status: "success",
        data: updatedSeller,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { id } = req.params;
      const seller = await sellerService.getSellerById(id);

      if (
        req.context.userRole === "AGENT" &&
        seller.agentId !== req.context.userId
      ) {
        res.status(403).json({
          status: "error",
          error: {
            code: "FORBIDDEN",
            message: "You can only delete your own sellers",
          },
        });
        return;
      }

      await sellerService.deleteSeller(id, req.context.userId);

      res.json({
        status: "success",
        data: { message: "Seller deleted successfully" },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async searchSellers(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const agentFilter =
        req.context.userRole === "AGENT" ? req.context.userId : undefined;

      const results = await sellerService.searchSellers(
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
