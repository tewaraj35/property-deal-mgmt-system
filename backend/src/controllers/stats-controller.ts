import { Request, Response, NextFunction } from "express";
import { statsService } from "../services/stats-service";
import { UserRole } from "../types";

export const statsController = {
  async getRecentActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({ status: "error", error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
        return;
      }

      const isAdmin =
        req.context.userRole === UserRole.ADMIN ||
        req.context.userRole === UserRole.SUPER_ADMIN;

      const agentId = isAdmin ? undefined : req.context.userId;
      const activity = await statsService.getRecentActivity(agentId);

      res.json({
        status: "success",
        data: activity,
        meta: { timestamp: new Date().toISOString(), requestId: (req as any).id },
      });
    } catch (error) {
      next(error);
    }
  },

  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({ status: "error", error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
        return;
      }

      const isAdmin =
        req.context.userRole === UserRole.ADMIN ||
        req.context.userRole === UserRole.SUPER_ADMIN;

      const agentId = isAdmin ? undefined : req.context.userId;

      const stats = await statsService.getDashboardStats(agentId);

      res.json({
        status: "success",
        data: stats,
        meta: { timestamp: new Date().toISOString(), requestId: (req as any).id },
      });
    } catch (error) {
      next(error);
    }
  },
};
