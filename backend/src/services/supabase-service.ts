import { createClient } from "@supabase/supabase-js";
import { config } from "../utils/env-config";

/**
 * Supabase admin client — service role key, DB queries only.
 * Never call auth.signInWithPassword() on this client; doing so replaces
 * the service-role session with the user's JWT, making subsequent queries
 * subject to RLS and triggering recursive policy errors.
 */
export const supabaseAdmin = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/**
 * Separate client used exclusively for user sign-in.
 * Keeps auth sessions isolated from the admin DB client.
 */
export const supabaseAuth = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/**
 * Supabase client with anon key (used for RLS policies)
 */
export const supabaseAnon = createClient(config.supabaseUrl, config.supabaseAnonKey);

/**
 * Service for database operations
 */
export const supabaseService = {
  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error) throw error;
    return data.user;
  },

  /**
   * Get user profile from users table
   */
  async getUserProfile(userId: string) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create audit log
   */
  async createAuditLog(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValues: Record<string, any> | null = null,
    newValues: Record<string, any> | null = null,
    ipAddress?: string,
    userAgent?: string
  ) {
    const { data, error } = await supabaseAdmin
      .from("audit_logs")
      .insert([
        {
          user_id: userId,
          action,
          entity_type: entityType,
          entity_id: entityId,
          old_values: oldValues,
          new_values: newValues,
          ip_address: ipAddress,
          user_agent: userAgent,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get audit logs with pagination
   */
  async getAuditLogs(
    limit: number = 50,
    offset: number = 0,
    filters?: { userId?: string; entityType?: string }
  ) {
    let query = supabaseAdmin
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }

    if (filters?.entityType) {
      query = query.eq("entity_type", filters.entityType);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data, total: count };
  },
};
