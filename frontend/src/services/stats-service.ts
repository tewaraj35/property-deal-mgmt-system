import { makeRequest } from '../utils/api-client'

export interface EntityStats {
  total: number
  byStatus: Record<string, number>
}

export interface DashboardStats {
  buyers: EntityStats
  sellers: EntityStats
  renters: EntityStats
  loanClients: EntityStats
}

export interface ActivityEntry {
  id: string
  user_id: string
  action: string
  table_name: string
  record_id: string
  created_at: string
}

export const statsService = {
  getDashboardStats: () => makeRequest<DashboardStats>('get', '/stats'),
  getRecentActivity: () => makeRequest<ActivityEntry[]>('get', '/stats/recent-activity'),
}
