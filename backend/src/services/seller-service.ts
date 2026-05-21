import { supabaseAdmin } from "./supabase-service";
import { supabaseService } from "./supabase-service";
import { Seller, CreateSellerDTO, UpdateSellerDTO, SellerStatus } from "../types";

const mapSeller = (row: any): Seller => ({
  id: row.id,
  agentId: row.agent_id,
  name: row.name,
  phoneNumber: row.phone_number,
  email: row.email,
  location: row.location,
  propertyDetails: row.property_details,
  leadSource: row.lead_source,
  followUpDate: row.follow_up_date,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const sellerService = {
  /**
   * Get all sellers (with pagination and filters)
   */
  async getAllSellers(
    agentId?: string,
    status?: SellerStatus,
    limit: number = 50,
    offset: number = 0,
    dateFrom?: string,
    dateTo?: string
  ) {
    let query = supabaseAdmin
      .from("sellers")
      .select("*", { count: "exact" })
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (agentId) {
      query = query.eq("agent_id", agentId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59.999Z");

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data ?? []).map(mapSeller),
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  },

  /**
   * Get single seller by ID
   */
  async getSellerById(sellerId: string): Promise<Seller> {
    const { data, error } = await supabaseAdmin
      .from("sellers")
      .select("*")
      .eq("id", sellerId)
      .is("deleted_at", null)
      .single();

    if (error) throw new Error("Seller not found");
    return mapSeller(data);
  },

  /**
   * Create new seller
   */
  async createSeller(agentId: string, dto: CreateSellerDTO): Promise<Seller> {
    const { data, error } = await supabaseAdmin
      .from("sellers")
      .insert([
        {
          agent_id: agentId,
          name: dto.name,
          phone_number: dto.phoneNumber,
          email: dto.email,
          location: dto.location,
          property_details: dto.propertyDetails,
          lead_source: dto.leadSource,
          follow_up_date: dto.followUpDate,
          status: dto.status || SellerStatus.NEW,
          notes: dto.notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await supabaseService.createAuditLog(
      agentId,
      "CREATE",
      "sellers",
      data.id,
      null,
      data
    );

    return mapSeller(data);
  },

  /**
   * Update seller
   */
  async updateSeller(
    sellerId: string,
    userId: string,
    dto: UpdateSellerDTO
  ): Promise<Seller> {
    const oldSeller = await this.getSellerById(sellerId);

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.phoneNumber) updateData.phone_number = dto.phoneNumber;
    if (dto.email) updateData.email = dto.email;
    if (dto.location) updateData.location = dto.location;
    if (dto.propertyDetails) updateData.property_details = dto.propertyDetails;
    if (dto.leadSource) updateData.lead_source = dto.leadSource;
    if (dto.followUpDate) updateData.follow_up_date = dto.followUpDate;
    if (dto.status) updateData.status = dto.status;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const { data, error } = await supabaseAdmin
      .from("sellers")
      .update(updateData)
      .eq("id", sellerId)
      .select()
      .single();

    if (error) throw error;

    await supabaseService.createAuditLog(
      userId,
      "UPDATE",
      "sellers",
      sellerId,
      oldSeller,
      data
    );

    return mapSeller(data);
  },

  /**
   * Soft delete seller
   */
  async deleteSeller(sellerId: string, userId: string): Promise<void> {
    const oldSeller = await this.getSellerById(sellerId);

    const { error } = await supabaseAdmin
      .from("sellers")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sellerId);

    if (error) throw error;

    await supabaseService.createAuditLog(
      userId,
      "DELETE",
      "sellers",
      sellerId,
      oldSeller,
      { deleted_at: new Date().toISOString() }
    );
  },

  /**
   * Search sellers
   */
  async searchSellers(agentId: string, query: string, limit: number = 20) {
    let supabaseQuery = supabaseAdmin
      .from("sellers")
      .select("*")
      .eq("agent_id", agentId)
      .is("deleted_at", null)
      .limit(limit);

    supabaseQuery = supabaseQuery.or(
      `name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`
    );

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    return (data ?? []).map(mapSeller);
  },
};
