import { Request, Response, NextFunction } from "express";
import { loanClientService } from "../services/loan-client-service";

export const loanClientController = {
  async getAllLoanClients(
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

      const { page = 1, limit = 50, status, dateFrom, dateTo } = req.query;
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
      const offset = (pageNum - 1) * limitNum;

      const agentFilter =
        req.context.userRole === "AGENT" ? req.context.userId : undefined;

      const result = await loanClientService.getAllLoanClients(
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

  async getLoanClientById(
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

      const { id } = req.params;
      const client = await loanClientService.getLoanClientById(id);

      if (
        req.context.userRole === "AGENT" &&
        client.agentId !== req.context.userId
      ) {
        res.status(403).json({
          status: "error",
          error: {
            code: "FORBIDDEN",
            message: "You can only view your own loan clients",
          },
        });
        return;
      }

      res.json({
        status: "success",
        data: client,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async createLoanClient(
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

      const { clientName } = req.body;

      if (!clientName) {
        res.status(400).json({
          status: "error",
          error: {
            code: "INVALID_INPUT",
            message: "Client name is required",
          },
        });
        return;
      }

      const client = await loanClientService.createLoanClient(
        req.context.userId,
        req.body
      );

      res.status(201).json({
        status: "success",
        data: client,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateLoanClient(
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

      const { id } = req.params;
      const client = await loanClientService.getLoanClientById(id);

      if (
        req.context.userRole === "AGENT" &&
        client.agentId !== req.context.userId
      ) {
        res.status(403).json({
          status: "error",
          error: {
            code: "FORBIDDEN",
            message: "You can only update your own loan clients",
          },
        });
        return;
      }

      const updatedClient = await loanClientService.updateLoanClient(
        id,
        req.context.userId,
        req.body
      );

      res.json({
        status: "success",
        data: updatedClient,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteLoanClient(
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

      const { id } = req.params;
      const client = await loanClientService.getLoanClientById(id);

      if (
        req.context.userRole === "AGENT" &&
        client.agentId !== req.context.userId
      ) {
        res.status(403).json({
          status: "error",
          error: {
            code: "FORBIDDEN",
            message: "You can only delete your own loan clients",
          },
        });
        return;
      }

      await loanClientService.deleteLoanClient(id, req.context.userId);

      res.json({
        status: "success",
        data: { message: "Loan client deleted successfully" },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: (req as any).id,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async searchLoanClients(
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

      const results = await loanClientService.searchLoanClients(
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
