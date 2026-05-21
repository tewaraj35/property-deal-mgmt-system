import React, { useEffect, useState } from 'react'
import { type User, UserRole, UserStatus } from '../types'
import { userService } from '../services/user-service'
import DataTable, { type Column } from '../components/common/data-table'
import { useAuth } from '../hooks/use-auth'

export const UsersPage: React.FC = () => {
  const { isSuperAdmin } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const limit = 20

  useEffect(() => {
    fetchUsers()
  }, [page, roleFilter])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await userService.getAll(page, limit, roleFilter)
      setUsers(result.data)
      setTotal(result.meta?.total || 0)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleStatus = async (user: User) => {
    setIsActionLoading(true)
    setError(null)
    try {
      const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE
      await userService.update(user.id, { status: newStatus })
      setSuccess(`User ${newStatus === UserStatus.ACTIVE ? 'activated' : 'deactivated'} successfully`)
      fetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    setIsActionLoading(true)
    setError(null)
    try {
      await userService.delete(deleteConfirm.id)
      setSuccess('User deleted successfully')
      setDeleteConfirm(null)
      setPage(1)
      fetchUsers()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
    } finally {
      setIsActionLoading(false)
    }
  }

  const columns: Column[] = [
    { key: 'fullName', label: 'Name', width: '25%' },
    { key: 'email', label: 'Email', width: '25%' },
    { key: 'phoneNumber', label: 'Phone', width: '15%' },
    {
      key: 'role',
      label: 'Role',
      width: '15%',
      render: (value: string) => {
        const colors: Record<string, string> = {
          SUPER_ADMIN: 'danger',
          ADMIN: 'warning',
          AGENT: 'info',
        }
        return <span className={`badge badge-${colors[value] || 'info'}`}>{value}</span>
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (value: string) => (
        <span className={`badge badge-${value === 'ACTIVE' ? 'success' : 'danger'}`}>
          {value}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      width: '10%',
      render: (_: unknown, row: User) => (
        <button
          onClick={() => handleToggleStatus(row)}
          disabled={isActionLoading}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          {row.status === UserStatus.ACTIVE ? 'Deactivate' : 'Activate'}
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {error && (
        <div className="alert-error">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="text-xs underline ml-2">Dismiss</button>
        </div>
      )}
      {success && (
        <div className="alert-success">
          <p>{success}</p>
          <button onClick={() => setSuccess(null)} className="text-xs underline ml-2">Dismiss</button>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">👤 Users</h1>
      </div>

      <div className="card">
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="select-base"
          >
            <option value="">All Roles</option>
            <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
            <option value={UserRole.ADMIN}>Admin</option>
            <option value={UserRole.AGENT}>Agent</option>
          </select>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Delete User?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteConfirm.fullName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary" disabled={isActionLoading}>
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="btn-danger" disabled={isActionLoading}>
                {isActionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <DataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          actions={{
            delete: isSuperAdmin ? (user: User) => setDeleteConfirm(user) : undefined,
          }}
        />

        {total > limit && (
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
              className="btn-secondary"
            >
              ← Previous
            </button>
            <span className="py-2 px-4 text-gray-600">
              Page {page} of {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(total / limit) || isLoading}
              className="btn-secondary"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UsersPage
