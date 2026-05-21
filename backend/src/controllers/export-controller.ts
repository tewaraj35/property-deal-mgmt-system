import { Request, Response, NextFunction } from "express";
import PDFDocument from "pdfkit";
import { supabaseAdmin } from "../services/supabase-service";
import { UserRole } from "../types";

type EntityConfig = {
  table: string;
  title: string;
  columns: { key: string; label: string; width: number }[];
};

const ENTITY_CONFIGS: Record<string, EntityConfig> = {
  buyers: {
    table: "buyers",
    title: "Buyers Report",
    columns: [
      { key: "name", label: "Name", width: 120 },
      { key: "phone_number", label: "Phone", width: 100 },
      { key: "email", label: "Email", width: 140 },
      { key: "location", label: "Location", width: 100 },
      { key: "status", label: "Status", width: 80 },
    ],
  },
  sellers: {
    table: "sellers",
    title: "Sellers Report",
    columns: [
      { key: "name", label: "Name", width: 120 },
      { key: "phone_number", label: "Phone", width: 100 },
      { key: "email", label: "Email", width: 140 },
      { key: "location", label: "Location", width: 100 },
      { key: "status", label: "Status", width: 80 },
    ],
  },
  renters: {
    table: "renters",
    title: "Renters Report",
    columns: [
      { key: "tenant_name", label: "Tenant", width: 130 },
      { key: "property_address", label: "Property", width: 170 },
      { key: "monthly_rent", label: "Rent (RM)", width: 90 },
      { key: "tenant_contact", label: "Contact", width: 100 },
      { key: "status", label: "Status", width: 80 },
    ],
  },
  "loan-clients": {
    table: "loan_clients",
    title: "Loan Clients Report",
    columns: [
      { key: "client_name", label: "Client", width: 120 },
      { key: "loan_amount", label: "Amount (RM)", width: 100 },
      { key: "bank_name", label: "Bank", width: 110 },
      { key: "loan_type", label: "Type", width: 90 },
      { key: "status", label: "Status", width: 80 },
    ],
  },
};

export const exportController = {
  async exportPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({ status: "error", error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
        return;
      }

      const entity = String(req.params.entity);
      const config = ENTITY_CONFIGS[entity];

      if (!config) {
        res.status(400).json({ status: "error", error: { code: "BAD_REQUEST", message: "Invalid entity type" } });
        return;
      }

      const isAdmin =
        req.context.userRole === UserRole.ADMIN ||
        req.context.userRole === UserRole.SUPER_ADMIN;

      let query = supabaseAdmin
        .from(config.table)
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("agent_id", req.context.userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const doc = new PDFDocument({ margin: 40, size: "A4", layout: "landscape" });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${entity}-${new Date().toISOString().slice(0, 10)}.pdf"`);

      doc.pipe(res);

      // Header
      doc.fontSize(18).font("Helvetica-Bold").text("Nesh Property Management", { align: "center" });
      doc.fontSize(13).font("Helvetica").text(config.title, { align: "center" });
      doc.fontSize(9).text(`Generated: ${new Date().toLocaleString("en-MY")}  |  Total: ${data?.length ?? 0} records`, { align: "center" });
      doc.moveDown(1);

      // Table header
      const startX = 40;
      let x = startX;
      const headerY = doc.y;

      doc.rect(startX, headerY, config.columns.reduce((s: number, c) => s + c.width, 0), 18).fill("#1e40af");

      doc.fillColor("white").fontSize(9).font("Helvetica-Bold");
      for (const col of config.columns) {
        doc.text(col.label, x + 4, headerY + 4, { width: col.width - 8, ellipsis: true });
        x += col.width;
      }

      doc.fillColor("black").font("Helvetica");

      // Rows
      let rowY = headerY + 18;
      for (let i = 0; i < (data?.length ?? 0); i++) {
        const row = data![i];
        const bg = i % 2 === 0 ? "#f8fafc" : "#ffffff";
        doc.rect(startX, rowY, config.columns.reduce((s: number, c) => s + c.width, 0), 16).fill(bg);

        doc.fillColor("#111827").fontSize(8);
        x = startX;
        for (const col of config.columns) {
          const val = row[col.key];
          const text = val == null ? "—" : typeof val === "number" ? val.toLocaleString() : String(val);
          doc.text(text, x + 4, rowY + 3, { width: col.width - 8, ellipsis: true });
          x += col.width;
        }

        rowY += 16;

        // Add new page if needed
        if (rowY > doc.page.height - 60) {
          doc.addPage();
          rowY = 40;
        }
      }

      doc.end();
    } catch (error) {
      next(error);
    }
  },

  async exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({ status: "error", error: { code: "UNAUTHORIZED", message: "Not authenticated" } });
        return;
      }

      const entity = String(req.params.entity);
      const config = ENTITY_CONFIGS[entity];

      if (!config) {
        res.status(400).json({ status: "error", error: { code: "BAD_REQUEST", message: "Invalid entity type" } });
        return;
      }

      const isAdmin =
        req.context.userRole === UserRole.ADMIN ||
        req.context.userRole === UserRole.SUPER_ADMIN;

      let query = supabaseAdmin
        .from(config.table)
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!isAdmin) {
        query = query.eq("agent_id", req.context.userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = data ?? [];
      const headers = config.columns.map((c) => c.label);
      const keys = config.columns.map((c) => c.key);

      const escape = (val: unknown) => {
        if (val == null) return "";
        const s = String(val).replace(/"/g, '""');
        return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
      };

      const lines = [
        headers.join(","),
        ...rows.map((row) => keys.map((k) => escape(row[k])).join(",")),
      ];

      const csv = lines.join("\r\n");
      const filename = `${entity}-${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },
};
