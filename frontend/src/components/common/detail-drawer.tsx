import React, { useEffect } from 'react'
import FileUploadSection from './file-upload'

export interface DetailField {
  label: string
  value: string | number | null | undefined
  badge?: string
}

interface DetailDrawerProps {
  title: string
  subtitle?: string
  fields: DetailField[]
  entityType: 'buyer' | 'seller' | 'renter' | 'loan_client'
  entityId: string
  onClose: () => void
  onEdit?: () => void
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  title,
  subtitle,
  fields,
  entityType,
  entityId,
  onClose,
  onEdit,
}) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <button onClick={onEdit} className="btn-primary text-sm px-3 py-1">
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 text-xl leading-none px-2"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Fields */}
          <div className="grid grid-cols-2 gap-3">
            {fields.map((field, i) => (
              <div key={i} className={field.badge ? 'col-span-1' : 'col-span-1'}>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{field.label}</p>
                {field.badge ? (
                  <span className={`badge badge-${field.badge} text-xs`}>
                    {field.value ?? '—'}
                  </span>
                ) : (
                  <p className="text-sm font-medium text-gray-900 break-words">
                    {field.value != null && field.value !== '' ? String(field.value) : '—'}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Divider */}
          <hr />

          {/* File Attachments */}
          <FileUploadSection entityType={entityType} entityId={entityId} />
        </div>
      </div>
    </div>
  )
}

export default DetailDrawer
