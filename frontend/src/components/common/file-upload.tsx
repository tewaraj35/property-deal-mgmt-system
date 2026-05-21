import React, { useEffect, useRef, useState } from 'react'
import { type FileUpload } from '../../types'
import { apiClient } from '../../utils/api-client'

interface FileUploadSectionProps {
  entityType: 'buyer' | 'seller' | 'renter' | 'loan_client'
  entityId: string
}

export const FileUploadSection: React.FC<FileUploadSectionProps> = ({ entityType, entityId }) => {
  const [files, setFiles] = useState<FileUpload[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchFiles()
  }, [entityId])

  const fetchFiles = async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get(`/files/entity/${entityType}/${entityId}`)
      setFiles(res.data?.data ?? [])
    } catch {
      // silently fail — entity may have no files yet
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('entityType', entityType)
      form.append('entityId', entityId)

      await apiClient.post('/files/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSuccess(`${file.name} uploaded`)
      fetchFiles()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (fileId: string, fileName: string) => {
    if (!confirm(`Delete ${fileName}?`)) return
    try {
      await apiClient.delete(`/files/${fileId}`)
      setSuccess(`${fileName} deleted`)
      fetchFiles()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleDownload = (fileId: string, fileName: string) => {
    const token = localStorage.getItem('authToken')
    const baseUrl = (apiClient.defaults.baseURL ?? '').replace('/api/v1', '')
    const url = `${baseUrl}/api/v1/files/${fileId}/download`
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    // Pass token via query param as fallback (backend should accept it)
    a.href = `${url}?token=${token}`
    a.click()
  }

  const formatBytes = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-700">Attachments ({files.length})</h4>
        <label className="btn-secondary text-xs cursor-pointer">
          {isUploading ? 'Uploading...' : '+ Attach File'}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}
      {success && <p className="text-green-600 text-xs">{success}</p>}

      {isLoading ? (
        <p className="text-gray-400 text-xs">Loading files...</p>
      ) : files.length === 0 ? (
        <p className="text-gray-400 text-xs">No attachments yet</p>
      ) : (
        <ul className="space-y-1">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 text-xs p-2 bg-gray-50 rounded">
              <span className="text-gray-500">📎</span>
              <span className="flex-1 truncate text-gray-800">{f.fileName}</span>
              <span className="text-gray-400">{formatBytes(f.fileSizeBytes)}</span>
              <button
                onClick={() => handleDownload(f.id, f.fileName)}
                className="text-blue-600 hover:text-blue-800"
                title="Download"
              >
                ⬇
              </button>
              <button
                onClick={() => handleDelete(f.id, f.fileName)}
                className="text-red-500 hover:text-red-700"
                title="Delete"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default FileUploadSection
