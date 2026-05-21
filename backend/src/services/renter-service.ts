import { supabaseAdmin } from "./supabase-service";
import { supabaseService } from "./supabase-service";
import { Renter, CreateRenterDTO, UpdateRenterDTO, RenterStatus } from "../types";

const mapRenter = (row: any): Renter => ({
  id: row.id,
  agentId: row.agent_id,
  tenantName: row.tenant_name,
  propertyAddress: row.property_address,
  monthlyRent: row.monthly_rent,
  rentDueDate: row.rent_due_date,
  tenantContact: row.tenant_contact,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const renterService = {
  async getAllRenters(
    agentId?: string,
    status?: RenterStatus,
    limit: number = 50,
    offset: number = 0,
    dateFrom?: string,
    dateTo?: string
  ) {
    let query = supabaseAdmin
      .from("renters")
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
      data: (data ?? []).map(mapRenter),
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  },

  async getRenterById(renterId: string): Promise<Renter> {
    const { data, error } = await supabaseAdmin
      .from("renters")
      .select("*")
      .eq("id", renterId)
      .is("deleted_at", null)
      .single();

    if (error) throw new Error("Renter not found");
    return mapRenter(data);
  },

  async createRenter(agentId: string, dto: CreateRenterDTO): Promise<Renter> {
    const { data, error } = await supabaseAdmin
      .from("renters")
      .insert([
        {
          agent_id: agentId,
          tenant_name: dto.tenantName,
          property_address: dto.propertyAddress,
          monthly_rent: dto.monthlyRent,
          rent_due_date: dto.rentDueDate,
          tenant_contact: dto.tenantContact,
          status: dto.status || RenterStatus.ACTIVE,
          notes: dto.notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await supabaseService.createAuditLog(
      agentId,
      "CREATE",
      "renters",
      data.id,
      null,
      data
    );

    return mapRenter(data);
  },

  async updateRenter(
    renterId: string,
    userId: string,
    dto: UpdateRenterDTO
  ): Promise<Renter> {
    const oldRenter = await this.getRenterById(renterId);

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.tenantName) updateData.tenant_name = dto.tenantName;
    if (dto.propertyAddress) updateData.property_address = dto.propertyAddress;
    if (dto.monthlyRent !== undefined) updateData.monthly_rent = dto.monthlyRent;
    if (dto.rentDueDate) updateData.rent_due_date = dto.rentDueDate;
    if (dto.tenantContact) updateData.tenant_contact = dto.tenantContact;
    if (dto.status) updateData.status = dto.status;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const { data, error } = await supabaseAdmin
      .from("renters")
      .update(updateData)
      .eq("id", renterId)
      .select()
      .single();

    if (error) throw error;

    await supabaseService.createAuditLog(
      userId,
      "UPDATE",
      "renters",
      renterId,
      oldRenter,
      data
    );

    return mapRenter(data);
  },

  async deleteRenter(renterId: string, userId: string): Promise<void> {
    const oldRenter = await this.getRenterById(renterId);

    const { error } = await supabaseAdmin
      .from("renters")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", renterId);

    if (error) throw error;

    await supabaseService.createAuditLog(
      userId,
      "DELETE",
      "renters",
      renterId,
      oldRenter,
      { deleted_at: new Date().toISOString() }
    );
  },

  async searchRenters(agentId: string, query: string, limit: number = 20) {
    let supabaseQuery = supabaseAdmin
      .from("renters")
      .select("*")
      .eq("agent_id", agentId)
      .is("deleted_at", null)
      .limit(limit);

    supabaseQuery = supabaseQuery.or(
      `tenant_name.ilike.%${query}%,property_address.ilike.%${query}%,tenant_contact.ilike.%${query}%`
    );

    const { data, error } = await supabaseQuery;
    if (error) throw error;
    return (data ?? []).map(mapRenter);
  },
};
