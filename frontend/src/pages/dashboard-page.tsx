import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { statsService, type DashboardStats, type ActivityEntry } from '../services/stats-service'

interface StatCardProps {
  title: string
  icon: string
  stats: { total: number; byStatus: Record<string, number> } | undefined
  path: string
  statusColors: Record<string, string>
}

const StatCard: React.FC<StatCardProps> = ({ title, icon, stats, path, statusColors }) => {
  const navigate = useNavigate()
  return (
    <div className="card-hover cursor-pointer" onClick={() => navigate(path)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">{icon} {title}</h3>
        <span className="text-3xl font-bold text-blue-700">{stats?.total ?? '—'}</span>
      </div>
      <div className="space-y-1">
        {stats
          ? Object.entries(stats.byStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between text-sm">
                <span className={`badge badge-${statusColors[status] ?? 'info'} text-xs`}>{status}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))
          : <p className="text-gray-400 text-sm">Loading...</p>}
      </div>
      <button className="btn-primary text-sm w-full mt-4">Manage {title}</button>
    </div>
  )
}

const ACTION_ICONS: Record<string, string> = {
  CREATE: '➕',
  UPDATE: '✏️',
  DELETE: '🗑️',
  LOGIN: '🔑',
  LOGOUT: '🚪',
}

const TABLE_LABELS: Record<string, string> = {
  buyers: 'Buyer',
  sellers: 'Seller',
  renters: 'Renter',
  loan_clients: 'Loan Client',
  users: 'User',
  file_uploads: 'File',
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsError, setStatsError] = useState(false)
  const [activity, setActivity] = useState<ActivityEntry[]>([])

  useEffect(() => {
    statsService.getDashboardStats()
      .then((res) => setStats(res.data ?? null))
      .catch(() => setStatsError(true))

    statsService.getRecentActivity()
      .then((res) => setActivity(res.data ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-1">Welcome, {user?.fullName}!</h2>
        <p className="text-gray-500 text-sm">
          Role: <span className="font-semibold">{user?.role}</span> &nbsp;|&nbsp; {user?.email}
        </p>
      </div>

      {statsError && (
        <div className="alert-error">
          <p>Could not load stats — check backend connection.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Buyers" icon="👥" stats={stats?.buyers} path="/buyers"
          statusColors={{ NEW: 'info', ACTIVE: 'success', CONVERTED: 'success', LOST: 'danger', INACTIVE: 'secondary' }}
        />
        <StatCard
          title="Sellers" icon="🏠" stats={stats?.sellers} path="/sellers"
          statusColors={{ NEW: 'info', ACTIVE: 'success', SOLD: 'success', LOST: 'danger', INACTIVE: 'secondary' }}
        />
        <StatCard
          title="Renters" icon="🔑" stats={stats?.renters} path="/renters"
          statusColors={{ ACTIVE: 'success', INACTIVE: 'secondary', EVICTED: 'danger', MOVED_OUT: 'warning' }}
        />
        <StatCard
          title="Loan Clients" icon="💰" stats={stats?.loanClients} path="/loan-clients"
          statusColors={{ NEW: 'info', PROCESSING: 'warning', APPROVED: 'success', REJECTED: 'danger', CLOSED: 'secondary' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="lg:col-span-2 card">
          <h3 className="font-bold text-gray-800 mb-3">🕐 Recent Activity</h3>
          {activity.length === 0 ? (
            <p className="text-gray-400 text-sm">No recent activity found.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {activity.map((entry) => (
                <li key={entry.id} className="py-2 flex items-start gap-3">
                  <span className="text-lg mt-0.5">{ACTION_ICONS[entry.action] ?? '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-semibold">{entry.action}</span>
                      {' on '}
                      <span className="text-purple-700">{TABLE_LABELS[entry.table_name] ?? entry.table_name}</span>
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {new Date(entry.created_at).toLocaleString('en-MY')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* System Status */}
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-lg self-start">
          <h3 className="font-bold text-blue-900 mb-2">📋 System Status</h3>
          <p className="text-blue-800 text-sm leading-7">
            ✅ CRUD + Stats + Export APIs<br />
            ✅ RBAC enforced<br />
            ✅ Audit logging active<br />
            ✅ PDF &amp; CSV export<br />
            ✅ File attachments supported
          </p>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
