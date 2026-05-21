import { supabaseAdmin } from "./supabase-service";
import { supabaseService } from "./supabase-service";
import {
  LoanClient,
  CreateLoanClientDTO,
  UpdateLoanClientDTO,
  LoanStatus,
} from "../types";

const mapLoanClient = (row: any): LoanClient => ({
  id: row.id,
  agentId: row.agent_id,
  clientName: row.client_name,
  income: row.income,
  loanType: row.loan_type,
  loanAmount: row.loan_amount,
  bankName: row.bank_name,
  bankerName: row.banker_name,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const loanClientService = {
  async getAllLoanClients(
    agentId?: string,
    status?: LoanStatus,
    limit: number = 50,
    offset: number = 0,
    dateFrom?: string,
    dateTo?: string
  ) {
    let query = supabaseAdmin
      .from("loan_clients")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (agentId) query = query.eq("agent_id", agentId);
    if (status) query = query.eq("status", status);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59.999Z");

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: (data ?? []).map(mapLoanClient),
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  },

  async getLoanClientById(clientId: string): Promise<LoanClient> {
    const { data, error } = await supabaseAdmin
      .from("loan_clients")
      .select("*")
      .eq("id", clientId)
      .is("deleted_at", null)
      .single();

    if (error) throw new Error("Loan client not found");
    return mapLoanClient(data);
  },

  async createLoanClient(
    agentId: string,
    dto: CreateLoanClientDTO
  ): Promise<LoanClient> {
    const { data, error } = await supabaseAdmin
      .from("loan_clients")
      .insert([
        {
          agent_id: agentId,
          client_name: dto.clientName,
          income: dto.income,
          loan_type: dto.loanType,
          loan_amount: dto.loanAmount,
          bank_name: dto.bankName,
          banker_name: dto.bankerName,
          status: dto.status || LoanStatus.NEW,
          notes: dto.notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await supabaseService.createAuditLog(
      agentId,
      "CREATE",
      "loan_clients",
      data.id,
      null,
      data
    );

    return mapLoanClient(data);
  },

  async updateLoanClient(
    clientId: string,
    userId: string,
    dto: UpdateLoanClientDTO
  ): Promise<LoanClient> {
    const oldClient = await this.getLoanClientById(clientId);

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.clientName) updateData.client_name = dto.clientName;
    if (dto.income !== undefined) updateData.income = dto.income;
    if (dto.loanType) updateData.loan_type = dto.loanType;
    if (dto.loanAmount !== undefined) updateData.loan_amount = dto.loanAmount;
    if (dto.bankName) updateData.bank_name = dto.bankName;
    if (dto.bankerName) updateData.banker_name = dto.bankerName;
    if (dto.status) updateData.status = dto.status;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const { data, error } = await supabaseAdmin
      .from("loan_clients")
      .update(updateData)
      .eq("id", clientId)
      .select()
      .single();

    if (error) throw error;

    await supabaseService.createAuditLog(
      userId,
      "UPDATE",
      "loan_clients",
      clientId,
      oldClient,
      data
    );

    return mapLoanClient(data);
  },

  async deleteLoanClient(clientId: string, userId: string): Promise<void> {
    const oldClient = await this.getLoanClientById(clientId);

    const { error } = await supabaseAdmin
      .from("loan_clients")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId);

    if (error) throw error;

    await supabaseService.createAuditLog(
      userId,
      "DELETE",
      "loan_clients",
      clientId,
      oldClient,
      { deleted_at: new Date().toISOString() }
    );
  },

  async searchLoanClients(agentId: string, query: string, limit: number = 20) {
    let supabaseQuery = supabaseAdmin
      .from("loan_clients")
      .select("*")
      .eq("agent_id", agentId)
      .is("deleted_at", null)
      .limit(limit);

    supabaseQuery = supabaseQuery.or(
      `client_name.ilike.%${query}%,bank_name.ilike.%${query}%`
    );

    const { data, error } = await supabaseQuery;
    if (error) throw error;
    return (data ?? []).map(mapLoanClient);
  },
};
