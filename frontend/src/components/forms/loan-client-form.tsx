import React, { useEffect, useState } from 'react'
import { type LoanClient, LoanStatus } from '../../types'

interface LoanClientFormProps {
  client?: LoanClient
  isLoading?: boolean
  onSubmit: (data: any) => void
  onCancel: () => void
}

export const LoanClientForm: React.FC<LoanClientFormProps> = ({
  client,
  isLoading,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    clientName: '',
    income: '',
    loanType: '',
    loanAmount: '',
    bankName: '',
    bankerName: '',
    status: LoanStatus.NEW,
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (client) {
      setFormData({
        clientName: client.clientName || '',
        income: client.income?.toString() || '',
        loanType: client.loanType || '',
        loanAmount: client.loanAmount?.toString() || '',
        bankName: client.bankName || '',
        bankerName: client.bankerName || '',
        status: client.status || LoanStatus.NEW,
        notes: client.notes || '',
      })
    }
  }, [client])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.clientName.trim()) newErrors.clientName = 'Client name is required'
    if (formData.income && isNaN(Number(formData.income))) newErrors.income = 'Income must be a number'
    if (formData.loanAmount && isNaN(Number(formData.loanAmount))) newErrors.loanAmount = 'Loan amount must be a number'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({
        ...formData,
        income: formData.income ? Number(formData.income) : undefined,
        loanAmount: formData.loanAmount ? Number(formData.loanAmount) : undefined,
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold mb-4">
        {client ? 'Edit Loan Client' : 'Add New Loan Client'}
      </h3>

      <div>
        <label className="block text-sm font-medium mb-1">Client Name *</label>
        <input type="text" name="clientName" value={formData.clientName} onChange={handleChange}
          className="input-base" placeholder="Raj Kumar" disabled={isLoading} />
        {errors.clientName && <p className="text-red-500 text-xs mt-1">{errors.clientName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Monthly Income (RM)</label>
        <input type="number" name="income" value={formData.income} onChange={handleChange}
          className="input-base" placeholder="5000" min="0" disabled={isLoading} />
        {errors.income && <p className="text-red-500 text-xs mt-1">{errors.income}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Loan Type</label>
        <select name="loanType" value={formData.loanType} onChange={handleChange}
          className="select-base" disabled={isLoading}>
          <option value="">Select type</option>
          <option value="Home Loan">Home Loan</option>
          <option value="Refinance">Refinance</option>
          <option value="Construction">Construction</option>
          <option value="Commercial">Commercial</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Loan Amount (RM)</label>
        <input type="number" name="loanAmount" value={formData.loanAmount} onChange={handleChange}
          className="input-base" placeholder="500000" min="0" disabled={isLoading} />
        {errors.loanAmount && <p className="text-red-500 text-xs mt-1">{errors.loanAmount}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Bank Name</label>
        <input type="text" name="bankName" value={formData.bankName} onChange={handleChange}
          className="input-base" placeholder="Maybank" disabled={isLoading} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Banker Name</label>
        <input type="text" name="bankerName" value={formData.bankerName} onChange={handleChange}
          className="input-base" placeholder="Ahmad Razif" disabled={isLoading} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select name="status" value={formData.status} onChange={handleChange}
          className="select-base" disabled={isLoading}>
          <option value={LoanStatus.NEW}>New</option>
          <option value={LoanStatus.PROCESSING}>Processing</option>
          <option value={LoanStatus.APPROVED}>Approved</option>
          <option value={LoanStatus.REJECTED}>Rejected</option>
          <option value={LoanStatus.CLOSED}>Closed</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea name="notes" value={formData.notes} onChange={handleChange}
          className="textarea-base" placeholder="Additional notes..." rows={3} disabled={isLoading} />
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : client ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export default LoanClientForm
