import { Request, Response, NextFunction } from "express";
import { renterService } from "../services/renter-service";

export const renterController = {
  async getAllRenters(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const result = await renterService.getAllRenters(
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

  async getRenterById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { id } = req.params as Record<string, string>;
      const renter = await renterService.getRenterById(id);

      if (
        req.context.userRole === "AGENT" &&
        renter.agentId !== req.context.userId
      ) {
        res.status(403).json({
          status: "error",
          error: { code: "FORBIDDEN", message: "You can only view your own renters" },
        });
        return;
      }

      res.json({
        status: "success",
        data: renter,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async createRenter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { tenantName, propertyAddress } = req.body;

      if (!tenantName || !propertyAddress) {
        res.status(400).json({
          status: "error",
          error: {
            code: "INVALID_INPUT",
            message: "Tenant name and property address are required",
          },
        });
        return;
      }

      const renter = await renterService.createRenter(req.context.userId, req.body);

      res.status(201).json({
        status: "success",
        data: renter,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateRenter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { id } = req.params as Record<string, string>;
      const renter = await renterService.getRenterById(id);

      if (
        req.context.userRole === "AGENT" &&
        renter.agentId !== req.context.userId
      ) {
        res.status(403).json({
          status: "error",
          error: { code: "FORBIDDEN", message: "You can only update your own renters" },
        });
        return;
      }

      const updatedRenter = await renterService.updateRenter(
        id,
        req.context.userId,
        req.body
      );

      res.json({
        status: "success",
        data: updatedRenter,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteRenter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          status: "error",
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const { id } = req.params as Record<string, string>;
      const renter = await renterService.getRenterById(id);

      if (
        req.context.userRole === "AGENT" &&
        renter.agentId !== req.context.userId
      ) {
        res.status(403).json({
          status: "error",
          error: { code: "FORBIDDEN", message: "You can only delete your own renters" },
        });
        return;
      }

      await renterService.deleteRenter(id, req.context.userId);

      res.json({
        status: "success",
        data: { message: "Renter deleted successfully" },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async searchRenters(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const results = await renterService.searchRenters(
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
