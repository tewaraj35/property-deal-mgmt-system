import { supabaseAdmin } from "./supabase-service";
import { User, UserRole, UserStatus } from "../types";

export const userManagementService = {
  async getAllUsers(role?: UserRole, limit = 50, offset = 0) {
    let query = supabaseAdmin
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (role) {
      query = query.eq("role", role);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      data: data as User[],
      total: count ?? 0,
      page: Math.floor(offset / limit) + 1,
      limit,
    };
  },

  async getUserById(userId: string): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw new Error("User not found");
    return data as User;
  },

  async updateUser(
    userId: string,
    updates: Partial<Pick<User, "status" | "role" | "fullName" | "phoneNumber">>
  ): Promise<User> {
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

    if (updates.status) updateData.status = updates.status;
    if (updates.role) updateData.role = updates.role;
    if (updates.fullName) updateData.full_name = updates.fullName;
    if (updates.phoneNumber !== undefined) updateData.phone_number = updates.phoneNumber;

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  },

  async deleteUser(userId: string): Promise<void> {
    // Soft delete: set status to INACTIVE and mark deleted
    const { error } = await supabaseAdmin
      .from("users")
      .update({ status: UserStatus.INACTIVE, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;
  },
};
