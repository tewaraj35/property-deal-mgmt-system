import { supabaseAdmin } from "./supabase-service";
import { supabaseService } from "./supabase-service";
import { Buyer, CreateBuyerDTO, UpdateBuyerDTO, BuyerStatus } from "../types";

const mapBuyer = (row: any): Buyer => ({
  id: row.id,
  agentId: row.agent_id,
  name: row.name,
  phoneNumber: row.phone_number,
  email: row.email,
  location: row.location,
  propertyOfInterest: row.property_of_interest,
  leadSource: row.lead_source,
  followUpDate: row.follow_up_date,
  status: row.status,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

/**
 * Buyer service - database operations for buyers
 */
export const buyerService = {
  /**
   * Get all buyers (with pagination and filters)
   */
  async getAllBuyers(
    agentId?: string,
    status?: BuyerStatus,
    limit: number = 50,
    offset: number = 0,
    dateFrom?: string,
    dateTo?: string
  ) {
    let query = supabaseAdmin
      .from("buyers")
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

    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }

    if (dateTo) {
      query = query.lte("created_at", dateTo + "T23:59:59.999Z");
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: (data ?? []).map(mapBuyer),
      total: count || 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  },

  /**
   * Get single buyer by ID
   */
  async getBuyerById(buyerId: string): Promise<Buyer> {
    const { data, error } = await supabaseAdmin
      .from("buyers")
      .select("*")
      .eq("id", buyerId)
      .is("deleted_at", null)
      .single();

    if (error) throw new Error("Buyer not found");
    return mapBuyer(data);
  },

  /**
   * Create new buyer
   */
  async createBuyer(agentId: string, dto: CreateBuyerDTO): Promise<Buyer> {
    const { data, error } = await supabaseAdmin
      .from("buyers")
      .insert([
        {
          agent_id: agentId,
          name: dto.name,
          phone_number: dto.phoneNumber,
          email: dto.email,
          location: dto.location,
          property_of_interest: dto.propertyOfInterest,
          lead_source: dto.leadSource,
          follow_up_date: dto.followUpDate,
          status: dto.status || BuyerStatus.NEW,
          notes: dto.notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await supabaseService.createAuditLog(agentId, "CREATE", "buyers", data.id, null, data);

    return mapBuyer(data);
  },

  /**
   * Update buyer
   */
  async updateBuyer(
    buyerId: string,
    userId: string,
    dto: UpdateBuyerDTO
  ): Promise<Buyer> {
    // Get old values for audit log
    const oldBuyer = await this.getBuyerById(buyerId);

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.phoneNumber) updateData.phone_number = dto.phoneNumber;
    if (dto.email) updateData.email = dto.email;
    if (dto.location) updateData.location = dto.location;
    if (dto.propertyOfInterest)
      updateData.property_of_interest = dto.propertyOfInterest;
    if (dto.leadSource) updateData.lead_source = dto.leadSource;
    if (dto.followUpDate) updateData.follow_up_date = dto.followUpDate;
    if (dto.status) updateData.status = dto.status;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    const { data, error } = await supabaseAdmin
      .from("buyers")
      .update(updateData)
      .eq("id", buyerId)
      .select()
      .single();

    if (error) throw error;

    await supabaseService.createAuditLog(userId, "UPDATE", "buyers", buyerId, oldBuyer, data);

    return mapBuyer(data);
  },

  /**
   * Soft delete buyer
   */
  async deleteBuyer(buyerId: string, userId: string): Promise<void> {
    const oldBuyer = await this.getBuyerById(buyerId);

    const { error } = await supabaseAdmin
      .from("buyers")
      .update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", buyerId);

    if (error) throw error;

    // Create audit log
    await supabaseService.createAuditLog(
      userId,
      "DELETE",
      "buyers",
      buyerId,
      oldBuyer,
      { deleted_at: new Date().toISOString() }
    );
  },

  /**
   * Search buyers by name, email, or phone
   */
  async searchBuyers(agentId: string, query: string, limit: number = 20) {
    let supabaseQuery = supabaseAdmin
      .from("buyers")
      .select("*")
      .eq("agent_id", agentId)
      .is("deleted_at", null)
      .limit(limit);

    // Search across multiple fields
    supabaseQuery = supabaseQuery.or(
      `name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`
    );

    const { data, error } = await supabaseQuery;

    if (error) throw error;
    return (data ?? []).map(mapBuyer);
  },
};
