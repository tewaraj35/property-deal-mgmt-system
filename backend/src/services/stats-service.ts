import { supabaseAdmin } from "./supabase-service";

export const statsService = {
  async getRecentActivity(agentId?: string, limit = 15) {
    let query = supabaseAdmin
      .from("audit_logs")
      .select("id, user_id, action, table_name, record_id, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (agentId) {
      query = query.eq("user_id", agentId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async getDashboardStats(agentId?: string) {
    const agentFilter = agentId ? (q: any) => q.eq("agent_id", agentId) : (q: any) => q;

    const [buyersResult, sellersResult, rentersResult, loansResult] = await Promise.all([
      agentFilter(supabaseAdmin.from("buyers").select("status").is("deleted_at", null)),
      agentFilter(supabaseAdmin.from("sellers").select("status").is("deleted_at", null)),
      agentFilter(supabaseAdmin.from("renters").select("status").is("deleted_at", null)),
      agentFilter(supabaseAdmin.from("loan_clients").select("status").is("deleted_at", null)),
    ]);

    const countByStatus = (rows: { status: string }[] | null) => {
      const counts: Record<string, number> = {};
      let total = 0;
      for (const row of rows ?? []) {
        counts[row.status] = (counts[row.status] ?? 0) + 1;
        total++;
      }
      return { total, byStatus: counts };
    };

    return {
      buyers: countByStatus(buyersResult.data),
      sellers: countByStatus(sellersResult.data),
      renters: countByStatus(rentersResult.data),
      loanClients: countByStatus(loansResult.data),
    };
  },
};
