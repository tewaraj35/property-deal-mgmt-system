import { apiClient } from '../utils/api-client'

type ExportEntity = 'buyers' | 'sellers' | 'renters' | 'loan-clients'

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const exportService = {
  async downloadPdf(entity: ExportEntity): Promise<void> {
    const response = await apiClient.get(`/export/${entity}/pdf`, { responseType: 'blob' })
    triggerDownload(new Blob([response.data], { type: 'application/pdf' }), `${entity}-${new Date().toISOString().slice(0, 10)}.pdf`)
  },

  async downloadCsv(entity: ExportEntity): Promise<void> {
    const response = await apiClient.get(`/export/${entity}/csv`, { responseType: 'blob' })
    triggerDownload(new Blob([response.data], { type: 'text/csv' }), `${entity}-${new Date().toISOString().slice(0, 10)}.csv`)
  },
}
