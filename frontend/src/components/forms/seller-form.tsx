import React, { useEffect, useState } from 'react'
import { type Seller, SellerStatus } from '../../types'

interface SellerFormProps {
  seller?: Seller
  isLoading?: boolean
  onSubmit: (data: any) => void
  onCancel: () => void
}

export const SellerForm: React.FC<SellerFormProps> = ({
  seller,
  isLoading,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    location: '',
    propertyDetails: '',
    leadSource: '',
    followUpDate: '',
    status: SellerStatus.NEW,
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (seller) {
      setFormData({
        name: seller.name || '',
        phoneNumber: seller.phoneNumber || '',
        email: seller.email || '',
        location: seller.location || '',
        propertyDetails: seller.propertyDetails || '',
        leadSource: seller.leadSource || '',
        followUpDate: seller.followUpDate || '',
        status: seller.status || SellerStatus.NEW,
        notes: seller.notes || '',
      })
    }
  }, [seller])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required'
    if (formData.email && !formData.email.includes('@')) newErrors.email = 'Invalid email'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) onSubmit(formData)
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
        {seller ? 'Edit Seller' : 'Add New Seller'}
      </h3>

      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange}
          className="input-base" placeholder="Jane Doe" disabled={isLoading} />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone Number *</label>
        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
          className="input-base" placeholder="+6012-3456789" disabled={isLoading} />
        {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange}
          className="input-base" placeholder="jane@example.com" disabled={isLoading} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input type="text" name="location" value={formData.location} onChange={handleChange}
          className="input-base" placeholder="Petaling Jaya" disabled={isLoading} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Property Details</label>
        <input type="text" name="propertyDetails" value={formData.propertyDetails} onChange={handleChange}
          className="input-base" placeholder="4-bedroom semi-D, asking RM800k" disabled={isLoading} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Lead Source</label>
        <select name="leadSource" value={formData.leadSource} onChange={handleChange}
          className="select-base" disabled={isLoading}>
          <option value="">Select source</option>
          <option value="Website">Website</option>
          <option value="Referral">Referral</option>
          <option value="Social Media">Social Media</option>
          <option value="Phone">Phone</option>
          <option value="Email">Email</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Follow Up Date</label>
        <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleChange}
          className="input-base" disabled={isLoading} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select name="status" value={formData.status} onChange={handleChange}
          className="select-base" disabled={isLoading}>
          <option value={SellerStatus.NEW}>New</option>
          <option value={SellerStatus.ACTIVE}>Active</option>
          <option value={SellerStatus.SOLD}>Sold</option>
          <option value={SellerStatus.LOST}>Lost</option>
          <option value={SellerStatus.INACTIVE}>Inactive</option>
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
          {isLoading ? 'Saving...' : seller ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export default SellerForm
