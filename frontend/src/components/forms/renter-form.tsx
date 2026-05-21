import React, { useEffect, useState } from 'react'
import { type Renter, RenterStatus } from '../../types'

interface RenterFormProps {
  renter?: Renter
  isLoading?: boolean
  onSubmit: (data: any) => void
  onCancel: () => void
}

export const RenterForm: React.FC<RenterFormProps> = ({
  renter,
  isLoading,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    tenantName: '',
    propertyAddress: '',
    monthlyRent: '',
    rentDueDate: '',
    tenantContact: '',
    status: RenterStatus.ACTIVE,
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (renter) {
      setFormData({
        tenantName: renter.tenantName || '',
        propertyAddress: renter.propertyAddress || '',
        monthlyRent: renter.monthlyRent?.toString() || '',
        rentDueDate: renter.rentDueDate || '',
        tenantContact: renter.tenantContact || '',
        status: renter.status || RenterStatus.ACTIVE,
        notes: renter.notes || '',
      })
    }
  }, [renter])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.tenantName.trim()) newErrors.tenantName = 'Tenant name is required'
    if (!formData.propertyAddress.trim()) newErrors.propertyAddress = 'Property address is required'
    if (formData.monthlyRent && isNaN(Number(formData.monthlyRent))) {
      newErrors.monthlyRent = 'Monthly rent must be a number'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit({
        ...formData,
        monthlyRent: formData.monthlyRent ? Number(formData.monthlyRent) : undefined,
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
        {renter ? 'Edit Renter' : 'Add New Renter'}
      </h3>

      <div>
        <label className="block text-sm font-medium mb-1">Tenant Name *</label>
        <input type="text" name="tenantName" value={formData.tenantName} onChange={handleChange}
          className="input-base" placeholder="Ahmad bin Ali" disabled={isLoading} />
        {errors.tenantName && <p className="text-red-500 text-xs mt-1">{errors.tenantName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Property Address *</label>
        <input type="text" name="propertyAddress" value={formData.propertyAddress} onChange={handleChange}
          className="input-base" placeholder="No. 12, Jalan Damai, KL" disabled={isLoading} />
        {errors.propertyAddress && <p className="text-red-500 text-xs mt-1">{errors.propertyAddress}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Monthly Rent (RM)</label>
        <input type="number" name="monthlyRent" value={formData.monthlyRent} onChange={handleChange}
          className="input-base" placeholder="1500" min="0" disabled={isLoading} />
        {errors.monthlyRent && <p className="text-red-500 text-xs mt-1">{errors.monthlyRent}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Rent Due Date</label>
        <input type="date" name="rentDueDate" value={formData.rentDueDate} onChange={handleChange}
          className="input-base" disabled={isLoading} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tenant Contact</label>
        <input type="text" name="tenantContact" value={formData.tenantContact} onChange={handleChange}
          className="input-base" placeholder="+6012-3456789" disabled={isLoading} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select name="status" value={formData.status} onChange={handleChange}
          className="select-base" disabled={isLoading}>
          <option value={RenterStatus.ACTIVE}>Active</option>
          <option value={RenterStatus.INACTIVE}>Inactive</option>
          <option value={RenterStatus.EVICTED}>Evicted</option>
          <option value={RenterStatus.MOVED_OUT}>Moved Out</option>
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
          {isLoading ? 'Saving...' : renter ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export default RenterForm
