import React, { useState, useEffect } from 'react'
import { type Buyer, BuyerStatus } from '../types'
import { buyerService } from '../services/crud-services'
import DataTable, { type Column } from '../components/common/data-table'
import BuyerForm from '../components/forms/buyer-form'
import DetailDrawer from '../components/common/detail-drawer'
import { useAuth } from '../hooks/use-auth'
import { useToast } from '../components/common/toast'
import { exportService } from '../services/export-service'

export const BuyersPage: React.FC = () => {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFormLoading, setIsFormLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingBuyer, setEditingBuyer] = useState<Buyer | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<Buyer | null>(null)
  const [viewingBuyer, setViewingBuyer] = useState<Buyer | null>(null)

  const limit = 20

  useEffect(() => {
    fetchBuyers()
  }, [page, statusFilter, dateFrom, dateTo])

  const fetchBuyers = async () => {
    setIsLoading(true)
    try {
      const result = await buyerService.getAll(page, limit, statusFilter, dateFrom || undefined, dateTo || undefined)
      setBuyers(result.data)
      setTotal(result.meta?.total || 0)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load buyers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) { fetchBuyers(); return }
    setIsLoading(true)
    try {
      const results = await buyerService.search(searchQuery)
      setBuyers(results)
      setTotal(results.length)
    } catch (err: any) {
      toast.error(err.message || 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenForm = (buyer?: Buyer) => {
    setEditingBuyer(buyer)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingBuyer(undefined)
  }

  const handleSubmitForm = async (data: any) => {
    setIsFormLoading(true)
    try {
      if (editingBuyer) {
        await buyerService.update(editingBuyer.id, data)
        toast.success('Buyer updated successfully')
      } else {
        await buyerService.create(data)
        toast.success('Buyer created successfully')
      }
      handleCloseForm()
      setPage(1)
      fetchBuyers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save buyer')
    } finally {
      setIsFormLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    setIsFormLoading(true)
    try {
      await buyerService.delete(deleteConfirm.id)
      toast.success('Buyer deleted successfully')
      setDeleteConfirm(null)
      setPage(1)
      fetchBuyers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete buyer')
    } finally {
      setIsFormLoading(false)
    }
  }

  const columns: Column[] = [
    { key: 'name', label: 'Name', width: '20%' },
    { key: 'phoneNumber', label: 'Phone', width: '15%' },
    { key: 'email', label: 'Email', width: '20%' },
    { key: 'location', label: 'Location', width: '15%' },
    { key: 'leadSource', label: 'Source', width: '15%' },
    {
      key: 'status',
      label: 'Status',
      width: '15%',
      render: (value: string) => (
        <span className={`badge badge-${value === 'ACTIVE' || value === 'CONVERTED' ? 'success' : value === 'LOST' ? 'danger' : 'info'}`}>
          {value}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Buyers</h1>
        <div className="flex gap-2">
          <button onClick={() => exportService.downloadCsv('buyers')} className="btn-secondary text-sm">
            ⬇ CSV
          </button>
          <button onClick={() => exportService.downloadPdf('buyers')} className="btn-secondary text-sm">
            ⬇ PDF
          </button>
          <button onClick={() => handleOpenForm()} className="btn-primary">
            + Add Buyer
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-base flex-1"
          />
          <button type="submit" className="btn-primary">Search</button>
          <button type="button" onClick={() => { setSearchQuery(''); setPage(1); fetchBuyers() }} className="btn-secondary">
            Reset
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-3 items-center">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="select-base w-40">
            <option value="">All Statuses</option>
            <option value={BuyerStatus.NEW}>New</option>
            <option value={BuyerStatus.ACTIVE}>Active</option>
            <option value={BuyerStatus.CONVERTED}>Converted</option>
            <option value={BuyerStatus.LOST}>Lost</option>
            <option value={BuyerStatus.INACTIVE}>Inactive</option>
          </select>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>From</span>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="input-base w-36 text-sm" />
            <span>To</span>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="input-base w-36 text-sm" />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }} className="text-xs text-red-500 hover:text-red-700">
                Clear dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detail Drawer */}
      {viewingBuyer && (
        <DetailDrawer
          title={viewingBuyer.name}
          subtitle={`Buyer · ${viewingBuyer.status}`}
          entityType="buyer"
          entityId={viewingBuyer.id}
          onClose={() => setViewingBuyer(null)}
          onEdit={() => { setViewingBuyer(null); handleOpenForm(viewingBuyer) }}
          fields={[
            { label: 'Name', value: viewingBuyer.name },
            { label: 'Phone', value: viewingBuyer.phoneNumber },
            { label: 'Email', value: viewingBuyer.email },
            { label: 'Location', value: viewingBuyer.location },
            { label: 'Property Interest', value: viewingBuyer.propertyOfInterest },
            { label: 'Lead Source', value: viewingBuyer.leadSource },
            { label: 'Follow Up Date', value: viewingBuyer.followUpDate },
            { label: 'Status', value: viewingBuyer.status, badge: viewingBuyer.status === 'ACTIVE' || viewingBuyer.status === 'CONVERTED' ? 'success' : viewingBuyer.status === 'LOST' ? 'danger' : 'info' },
            { label: 'Notes', value: viewingBuyer.notes },
            { label: 'Created', value: new Date(viewingBuyer.createdAt).toLocaleDateString('en-MY') },
          ]}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <BuyerForm buyer={editingBuyer} isLoading={isFormLoading} onSubmit={handleSubmitForm} onCancel={handleCloseForm} />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold mb-2">Delete Buyer?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary" disabled={isFormLoading}>Cancel</button>
              <button onClick={handleDeleteConfirm} className="btn-danger" disabled={isFormLoading}>
                {isFormLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={buyers}
          isLoading={isLoading}
          actions={{
            view: (buyer) => setViewingBuyer(buyer),
            edit: (buyer) => handleOpenForm(buyer),
            delete: isAdmin ? (buyer) => setDeleteConfirm(buyer) : undefined,
          }}
        />
        {total > limit && (
          <div className="mt-4 flex justify-center gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1 || isLoading} className="btn-secondary">← Previous</button>
            <span className="py-2 px-4 text-gray-600">Page {page} of {Math.ceil(total / limit)}</span>
            <button onClick={() => setPage(page + 1)} disabled={page >= Math.ceil(total / limit) || isLoading} className="btn-secondary">Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BuyersPage
