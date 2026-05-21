import React, { useEffect, useState } from 'react'
import { type LoanClient, LoanStatus } from '../types'
import { loanClientService } from '../services/crud-services'
import DataTable, { type Column } from '../components/common/data-table'
import LoanClientForm from '../components/forms/loan-client-form'
import DetailDrawer from '../components/common/detail-drawer'
import { useAuth } from '../hooks/use-auth'
import { useToast } from '../components/common/toast'
import { exportService } from '../services/export-service'

export const LoanClientsPage: React.FC = () => {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [clients, setClients] = useState<LoanClient[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFormLoading, setIsFormLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<LoanClient | undefined>()
  const [deleteConfirm, setDeleteConfirm] = useState<LoanClient | null>(null)
  const [viewingClient, setViewingClient] = useState<LoanClient | null>(null)

  const limit = 20

  useEffect(() => {
    fetchClients()
  }, [page, statusFilter, dateFrom, dateTo])

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      const result = await loanClientService.getAll(page, limit, statusFilter, dateFrom || undefined, dateTo || undefined)
      setClients(result.data)
      setTotal(result.meta?.total || 0)
    } catch (err: any) {
      toast.error(err.message || 'Failed to load loan clients')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!searchQuery.trim()) { fetchClients(); return }
    setIsLoading(true)
    try {
      const results = await loanClientService.search(searchQuery)
      setClients(results)
      setTotal(results.length)
    } catch (err: any) {
      toast.error(err.message || 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenForm = (client?: LoanClient) => {
    setEditingClient(client)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingClient(undefined)
  }

  const handleSubmitForm = async (data: any) => {
    setIsFormLoading(true)
    try {
      if (editingClient) {
        await loanClientService.update(editingClient.id, data)
        toast.success('Loan client updated successfully')
      } else {
        await loanClientService.create(data)
        toast.success('Loan client created successfully')
      }
      handleCloseForm()
      setPage(1)
      fetchClients()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save loan client')
    } finally {
      setIsFormLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    setIsFormLoading(true)
    try {
      await loanClientService.delete(deleteConfirm.id)
      toast.success('Loan client deleted successfully')
      setDeleteConfirm(null)
      setPage(1)
      fetchClients()
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete loan client')
    } finally {
      setIsFormLoading(false)
    }
  }

  const columns: Column[] = [
    { key: 'clientName', label: 'Client Name', width: '20%' },
    {
      key: 'loanAmount',
      label: 'Loan Amount',
      width: '15%',
      render: (value: number) => value ? `RM ${value.toLocaleString()}` : '—',
    },
    { key: 'bankName', label: 'Bank', width: '20%' },
    { key: 'loanType', label: 'Loan Type', width: '15%' },
    {
      key: 'status',
      label: 'Status',
      width: '30%',
      render: (value: string) => {
        const colors: Record<string, string> = {
          APPROVED: 'success',
          REJECTED: 'danger',
          PROCESSING: 'warning',
          NEW: 'info',
          CLOSED: 'secondary',
        }
        return (
          <span className={`badge badge-${colors[value] || 'info'}`}>
            {value}
          </span>
        )
      },
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Loan Clients</h1>
        <div className="flex gap-2">
          <button onClick={() => exportService.downloadCsv('loan-clients')} className="btn-secondary text-sm">
            ⬇ CSV
          </button>
          <button onClick={() => exportService.downloadPdf('loan-clients')} className="btn-secondary text-sm">
            ⬇ PDF
          </button>
          <button onClick={() => handleOpenForm()} className="btn-primary">
            + Add Loan Client
          </button>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by client name or bank..."
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
              fetchClients()
            }}
            className="btn-secondary"
          >
            Reset
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-3 items-center">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="select-base w-40">
            <option value="">All Statuses</option>
            <option value={LoanStatus.NEW}>New</option>
            <option value={LoanStatus.PROCESSING}>Processing</option>
            <option value={LoanStatus.APPROVED}>Approved</option>
            <option value={LoanStatus.REJECTED}>Rejected</option>
            <option value={LoanStatus.CLOSED}>Closed</option>
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

      {viewingClient && (
        <DetailDrawer
          title={viewingClient.clientName}
          subtitle={`Loan Client · ${viewingClient.status}`}
          entityType="loan_client"
          entityId={viewingClient.id}
          onClose={() => setViewingClient(null)}
          onEdit={() => { setViewingClient(null); handleOpenForm(viewingClient) }}
          fields={[
            { label: 'Client Name', value: viewingClient.clientName },
            { label: 'Income', value: viewingClient.income ? `RM ${viewingClient.income.toLocaleString()}` : null },
            { label: 'Loan Type', value: viewingClient.loanType },
            { label: 'Loan Amount', value: viewingClient.loanAmount ? `RM ${viewingClient.loanAmount.toLocaleString()}` : null },
            { label: 'Bank Name', value: viewingClient.bankName },
            { label: 'Banker Name', value: viewingClient.bankerName },
            { label: 'Status', value: viewingClient.status, badge: viewingClient.status === 'APPROVED' ? 'success' : viewingClient.status === 'REJECTED' ? 'danger' : viewingClient.status === 'PROCESSING' ? 'warning' : 'info' },
            { label: 'Notes', value: viewingClient.notes },
            { label: 'Created', value: new Date(viewingClient.createdAt).toLocaleDateString('en-MY') },
          ]}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <LoanClientForm
              client={editingClient}
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
            <h3 className="text-lg font-bold mb-2">Delete Loan Client?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{deleteConfirm.clientName}</strong>? This action cannot be undone.
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
          data={clients}
          isLoading={isLoading}
          actions={{
            view: (client: LoanClient) => setViewingClient(client),
            edit: (client: LoanClient) => handleOpenForm(client),
            delete: isAdmin ? (client: LoanClient) => setDeleteConfirm(client) : undefined,
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

export default LoanClientsPage
