import React, { useEffect, useState } from 'react'
import { type Seller, SellerStatus } from '../types'
import { sellerService } from '../services/crud-services'
import DataTable, { type Column } from '../components/common/data-table'
import SellerForm from '../components/forms/seller-form'
import DetailDrawer from '../components/common/detail-drawer'
import { useAuth } from '../hooks/use-auth'
import { useToast } from '../components/common/toast'
import { exportService } from '../services/export-service'

export const SellersPage: React.FC = () => {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [sellers, setSellers] = useState<Seller[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFormLoading, setIsFormLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingSeller, setEditingSeller] = useState<Seller | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<Seller | null>(null)
  const [viewingSeller, setViewingSeller] = useState<Seller | null>(null)

  const limit = 20

  useEffect(() => {
    fetchSellers()
  }, [page, statusFilter, dateFrom, dateTo])

  const fetchSellers = async () => {
    setIsLoading(true)
    try {
      const result = await sellerService.getAll(page, limit, statusFilter, dateFrom || undefined, dateTo || undefined)
      setSellers(result.data)
      setTotal(result.meta?.total || 0)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load sellers')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) { fetchSellers(); return }
    setIsLoading(true)
    try {
      const results = await sellerService.search(searchQuery)
      setSellers(results)
      setTotal(results.length)
    } catch (err: any) {
      toast.error(err.message || 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenForm = (seller?: Seller) => {
    setEditingSeller(seller)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingSeller(undefined)
  }

  const handleSubmitForm = async (data: any) => {
    setIsFormLoading(true)
    try {
      if (editingSeller) {
        await sellerService.update(editingSeller.id, data)
        toast.success('Seller updated successfully')
      } else {
        await sellerService.create(data)
        toast.success('Seller created successfully')
      }
      handleCloseForm()
      setPage(1)
      fetchSellers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save seller')
    } finally {
      setIsFormLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    setIsFormLoading(true)
    try {
      await sellerService.delete(deleteConfirm.id)
      toast.success('Seller deleted successfully')
      setDeleteConfirm(null)
      setPage(1)
      fetchSellers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete seller')
    } finally {
      setIsFormLoading(false)
    }
  }

  const columns: Column[] = [
    { key: 'name', label: 'Name', width: '20%' },
    { key: 'phoneNumber', label: 'Phone', width: '15%' },
    { key: 'email', label: 'Email', width: '20%' },
    { key: 'location', label: 'Location', width: '15%' },
    { key: 'propertyDetails', label: 'Property', width: '15%' },
    {
      key: 'status',
      label: 'Status',
      width: '15%',
      render: (value: string) => (
        <span className={`badge badge-${value === 'SOLD' ? 'success' : value === 'ACTIVE' ? 'success' : value === 'LOST' ? 'danger' : 'info'}`}>
          {value}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sellers</h1>
        <div className="flex gap-2">
          <button onClick={() => exportService.downloadCsv('sellers')} className="btn-secondary text-sm">
            ⬇ CSV
          </button>
          <button onClick={() => exportService.downloadPdf('sellers')} className="btn-secondary text-sm">
            ⬇ PDF
          </button>
          <button onClick={() => handleOpenForm()} className="btn-primary">
            + Add Seller
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
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
              fetchSellers()
            }}
            className="btn-secondary"
          >
            Reset
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-3 items-center">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="select-base w-40">
            <option value="">All Statuses</option>
            <option value={SellerStatus.NEW}>New</option>
            <option value={SellerStatus.ACTIVE}>Active</option>
            <option value={SellerStatus.SOLD}>Sold</option>
            <option value={SellerStatus.LOST}>Lost</option>
            <option value={SellerStatus.INACTIVE}>Inactive</option>
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

      {viewingSeller && (
        <DetailDrawer
          title={viewingSeller.name}
          subtitle={`Seller · ${viewingSeller.status}`}
          entityType="seller"
          entityId={viewingSeller.id}
          onClose={() => setViewingSeller(null)}
          onEdit={() => { setViewingSeller(null); handleOpenForm(viewingSeller) }}
          fields={[
            { label: 'Name', value: viewingSeller.name },
            { label: 'Phone', value: viewingSeller.phoneNumber },
            { label: 'Email', value: viewingSeller.email },
            { label: 'Location', value: viewingSeller.location },
            { label: 'Property Details', value: viewingSeller.propertyDetails },
            { label: 'Lead Source', value: viewingSeller.leadSource },
            { label: 'Follow Up Date', value: viewingSeller.followUpDate },
            { label: 'Status', value: viewingSeller.status, badge: viewingSeller.status === 'SOLD' || viewingSeller.status === 'ACTIVE' ? 'success' : viewingSeller.status === 'LOST' ? 'danger' : 'info' },
            { label: 'Notes', value: viewingSeller.notes },
            { label: 'Created', value: new Date(viewingSeller.createdAt).toLocaleDateString('en-MY') },
          ]}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <SellerForm
              seller={editingSeller}
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
            <h3 className="text-lg font-bold mb-2">Delete Seller?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
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
          data={sellers}
          isLoading={isLoading}
          actions={{
            view: (seller) => setViewingSeller(seller),
            edit: (seller) => handleOpenForm(seller),
            delete: isAdmin ? (seller) => setDeleteConfirm(seller) : undefined,
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

export default SellersPage
