import React from 'react'

export interface Column {
  key: string
  label: string
  width?: string
  render?: (value: any, row: any) => React.ReactNode
}

interface DataTableProps {
  columns: Column[]
  data: any[]
  isLoading?: boolean
  onRowClick?: (row: any) => void
  actions?: {
    edit?: (row: any) => void
    delete?: (row: any) => void
    view?: (row: any) => void
  }
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data = [],
  isLoading,
  onRowClick,
  actions,
}) => {
  if (isLoading) {
    return (
      <div className="table-container">
        <div className="p-8 text-center">
          <div className="inline-block">
            <div className="text-3xl mb-2">⟳</div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="table-container">
        <div className="p-8 text-center">
          <p className="text-gray-500">No records found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr className="table-header">
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }} className="px-4 py-3 text-left">
                {col.label}
              </th>
            ))}
            {(actions?.edit || actions?.delete || actions?.view) && (
              <th className="px-4 py-3 text-left">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id || idx}
              className="table-row-hover border-b border-gray-200"
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {(actions?.edit || actions?.delete || actions?.view) && (
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    {actions?.view && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          actions.view?.(row)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        title="View"
                      >
                        👁️
                      </button>
                    )}
                    {actions?.edit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          actions.edit?.(row)
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                        title="Edit"
                      >
                        ✏️
                      </button>
                    )}
                    {actions?.delete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          actions.delete?.(row)
                        }}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
