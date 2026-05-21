import React, { useEffect, useState } from 'react'
import { type Renter, RenterStatus } from '../types'
import { renterService } from '../services/crud-services'
import DataTable, { type Column } from '../components/common/data-table'
import RenterForm from '../components/forms/renter-form'
import DetailDrawer from '../components/common/detail-drawer'
import { useAuth } from '../hooks/use-auth'
import { useToast } from '../components/common/toast'
import { exportService } from '../services/export-service'

export const RentersPage: React.FC = () => {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [renters, setRenters] = useState<Renter[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFormLoading, setIsFormLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingRenter, setEditingRenter] = useState<Renter | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<Renter | null>(null)
  const [viewingRenter, setViewingRenter] = useState<Renter | null>(null)

  const limit = 20

  useEffect(() => {
    fetchRenters()
  }, [page, statusFilter, dateFrom, dateTo])

  const fetchRenters = async () => {
    setIsLoading(true)
    try {
      const result = await renterService.getAll(page, limit, statusFilter, dateFrom || undefined, dateTo || undefined)
      setRenters(result.data)
      setTotal(result.meta?.total || 0)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load renters')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!searchQuery.trim()) { fetchRenters(); return }
    setIsLoading(true)
    try {
      const results = await renterService.search(searchQuery)
      setRenters(results)
      setTotal(results.length)
    } catch (err: any) {
      toast.error(err.message || 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenForm = (renter?: Renter) => {
    setEditingRenter(renter)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingRenter(undefined)
  }

  const handleSubmitForm = async (data: any) => {
    setIsFormLoading(true)
    try {
      if (editingRenter) {
        await renterService.update(editingRenter.id, data)
        toast.success('Renter updated successfully')
      } else {
        await renterService.create(data)
        toast.success('Renter created successfully')
      }
      handleCloseForm()
      setPage(1)
      fetchRenters()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save renter')
    } finally {
      setIsFormLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    setIsFormLoading(true)
    try {
      await renterService.delete(deleteConfirm.id)
      toast.success('Renter deleted successfully')
      setDeleteConfirm(null)
      setPage(1)
      fetchRenters()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete renter')
    } finally {
      setIsFormLoading(false)
    }
  }

  const columns: Column[] = [
    { key: 'tenantName', label: 'Tenant Name', width: '20%' },
    { key: 'propertyAddress', label: 'Property', width: '25%' },
    {
      key: 'monthlyRent',
      label: 'Monthly Rent',
      width: '15%',
      render: (value: number) => value ? `RM ${value.toLocaleString()}` : '—',
    },
    { key: 'tenantContact', label: 'Contact', width: '15%' },
    {
      key: 'status',
      label: 'Status',
      width: '15%',
      render: (value: string) => (
        <span className={`badge badge-${value === 'ACTIVE' ? 'success' : 'danger'}`}>
          {value}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Renters</h1>
        <div className="flex gap-2">
          <button onClick={() => exportService.downloadCsv('renters')} className="btn-secondary text-sm">
            ⬇ CSV
          </button>
          <button onClick={() => exportService.downloadPdf('renters')} className="btn-secondary text-sm">
            ⬇ PDF
          </button>
          <button onClick={() => handleOpenForm()} className="btn-primary">
            + Add Renter
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by tenant name or property..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base flex-1"
          />
          <button type="submit" className="btn-primary">
            🔍 Search
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setPage(1)
              fetchRenters()
            }}
            className="btn-secondary"
          >
            Reset
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-3 items-center">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="select-base w-40">
            <option value="">All Statuses</option>
            <option value={RenterStatus.ACTIVE}>Active</option>
            <option value={RenterStatus.INACTIVE}>Inactive</option>
            <option value={RenterStatus.EVICTED}>Evicted</option>
            <option value={RenterStatus.MOVED_OUT}>Moved Out</option>
          </select>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>From</span>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="input-base w-36 text-sm" />
            <span>To</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="input-base w-36 text-sm" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }} className="text-xs text-red-500 hover:text-red-700">Clear dates</button>
            )}
          </div>
        </div>
      </div>

      {viewingRenter && (
        <DetailDrawer
          title={viewingRenter.tenantName}
          subtitle={`Renter · ${viewingRenter.status}`}
          entityType="renter"
          entityId={viewingRenter.id}
          onClose={() => setViewingRenter(null)}
          onEdit={() => { setViewingRenter(null); handleOpenForm(viewingRenter) }}
          fields={[
            { label: 'Tenant Name', value: viewingRenter.tenantName },
            { label: 'Contact', value: viewingRenter.tenantContact },
            { label: 'Property Address', value: viewingRenter.propertyAddress },
            { label: 'Monthly Rent', value: viewingRenter.monthlyRent ? `RM ${viewingRenter.monthlyRent.toLocaleString()}` : null },
            { label: 'Rent Due Date', value: viewingRenter.rentDueDate },
            { label: 'Status', value: viewingRenter.status, badge: viewingRenter.status === 'ACTIVE' ? 'success' : viewingRenter.status === 'INACTIVE' ? 'secondary' : 'danger' },
            { label: 'Notes', value: viewingRenter.notes },
            { label: 'Created', value: new Date(viewingRenter.createdAt).toLocaleDateString('en-MY') },
          ]}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <RenterForm
              renter={editingRenter}
              isLoading={isFormLoading}
              onSubmit={handleSubmitForm}
              onCancel={handleCloseForm}
            />
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Delete Renter?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteConfirm.tenantName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary" disabled={isFormLoading}>
                Cancel
              </button>
              <button onClick={handleDeleteConfirm} className="btn-danger" disabled={isFormLoading}>
                {isFormLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <DataTable
          columns={columns}
          data={renters}
          isLoading={isLoading}
          actions={{
            view: (renter: Renter) => setViewingRenter(renter),
            edit: (renter: Renter) => handleOpenForm(renter),
            delete: isAdmin ? (renter: Renter) => setDeleteConfirm(renter) : undefined,
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

export default RentersPage
