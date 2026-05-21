import { Request, Response, NextFunction } from "express";
import { userManagementService } from "../services/user-management-service";
import { supabaseService } from "../services/supabase-service";
import { UserRole } from "../types";

const getIp = (req: Request): string => String(req.ip ?? "");
const getUa = (req: Request): string =>
  Array.isArray(req.headers["user-agent"])
    ? req.headers["user-agent"][0] ?? ""
    : req.headers["user-agent"] ?? "";

export const userManagementController = {
  async getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({ status: "error", error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = (page - 1) * limit;
      const role = req.query.role as UserRole | undefined;

      const result = await userManagementService.getAllUsers(role, limit, offset);

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

  async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({ status: "error", error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
        return;
      }

      const ctx = req.context;
      const entityId = String(req.params.id);
      const { status, role, fullName, phoneNumber } = req.body;

      if (role && ctx.userRole !== UserRole.SUPER_ADMIN) {
        res.status(403).json({ status: "error", error: { code: "FORBIDDEN", message: "Only Super Admin can change roles" } });
        return;
      }

      const oldUser = await userManagementService.getUserById(entityId);
      const updatedUser = await userManagementService.updateUser(entityId, { status, role, fullName, phoneNumber });

      await supabaseService.createAuditLog(
        ctx.userId, "ASSIGN_ROLE", "users", entityId, oldUser, updatedUser, getIp(req), getUa(req)
      );

      res.json({
        status: "success",
        data: updatedUser,
        meta: { timestamp: new Date().toISOString(), requestId: (req as any).id },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({ status: "error", error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
        return;
      }

      const ctx = req.context;
      const entityId = String(req.params.id);

      if (entityId === ctx.userId) {
        res.status(400).json({ status: "error", error: { code: "BAD_REQUEST", message: "Cannot delete your own account" } });
        return;
      }

      const oldUser = await userManagementService.getUserById(entityId);
      await userManagementService.deleteUser(entityId);

      await supabaseService.createAuditLog(
        ctx.userId, "SUSPEND_USER", "users", entityId, oldUser, null, getIp(req), getUa(req)
      );

      res.json({
        status: "success",
        data: { message: "User deactivated successfully" },
        meta: { timestamp: new Date().toISOString(), requestId: (req as any).id },
      });
    } catch (error) {
      next(error);
    }
  },
};
