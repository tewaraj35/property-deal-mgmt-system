import React, { useEffect, useState } from 'react'
import { type Buyer, BuyerStatus } from '../../types'

interface BuyerFormProps {
  buyer?: Buyer
  isLoading?: boolean
  onSubmit: (data: any) => void
  onCancel: () => void
}

export const BuyerForm: React.FC<BuyerFormProps> = ({
  buyer,
  isLoading,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    location: '',
    propertyOfInterest: '',
    leadSource: '',
    followUpDate: '',
    status: BuyerStatus.NEW,
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (buyer) {
      setFormData({
        name: buyer.name || '',
        phoneNumber: buyer.phoneNumber || '',
        email: buyer.email || '',
        location: buyer.location || '',
        propertyOfInterest: buyer.propertyOfInterest || '',
        leadSource: buyer.leadSource || '',
        followUpDate: buyer.followUpDate || '',
        status: buyer.status || BuyerStatus.NEW,
        notes: buyer.notes || '',
      })
    }
  }, [buyer])

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
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-bold mb-4">
        {buyer ? 'Edit Buyer' : 'Add New Buyer'}
      </h3>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="input-base"
          placeholder="John Doe"
          disabled={isLoading}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-sm font-medium mb-1">Phone Number *</label>
        <input
          type="tel"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          className="input-base"
          placeholder="+6012-3456789"
          disabled={isLoading}
        />
        {errors.phoneNumber && <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="input-base"
          placeholder="john@example.com"
          disabled={isLoading}
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="input-base"
          placeholder="Kuala Lumpur"
          disabled={isLoading}
        />
      </div>

      {/* Property of Interest */}
      <div>
        <label className="block text-sm font-medium mb-1">Property of Interest</label>
        <input
          type="text"
          name="propertyOfInterest"
          value={formData.propertyOfInterest}
          onChange={handleChange}
          className="input-base"
          placeholder="3-bedroom townhouse"
          disabled={isLoading}
        />
      </div>

      {/* Lead Source */}
      <div>
        <label className="block text-sm font-medium mb-1">Lead Source</label>
        <select
          name="leadSource"
          value={formData.leadSource}
          onChange={handleChange}
          className="select-base"
          disabled={isLoading}
        >
          <option value="">Select source</option>
          <option value="Website">Website</option>
          <option value="Referral">Referral</option>
          <option value="Social Media">Social Media</option>
          <option value="Phone">Phone</option>
          <option value="Email">Email</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Follow Up Date */}
      <div>
        <label className="block text-sm font-medium mb-1">Follow Up Date</label>
        <input
          type="date"
          name="followUpDate"
          value={formData.followUpDate}
          onChange={handleChange}
          className="input-base"
          disabled={isLoading}
        />
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
          className="select-base"
          disabled={isLoading}
        >
          <option value={BuyerStatus.NEW}>New</option>
          <option value={BuyerStatus.ACTIVE}>Active</option>
          <option value={BuyerStatus.CONVERTED}>Converted</option>
          <option value={BuyerStatus.LOST}>Lost</option>
          <option value={BuyerStatus.INACTIVE}>Inactive</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          className="textarea-base"
          placeholder="Additional notes..."
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : buyer ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}

export default BuyerForm
