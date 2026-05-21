import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DataTable, { type Column } from '../components/common/data-table'

const columns: Column[] = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
]

const data = [
  { id: '1', name: 'Alice', status: 'ACTIVE' },
  { id: '2', name: 'Bob', status: 'NEW' },
]

describe('DataTable', () => {
  it('renders column headers', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders row data', () => {
    render(<DataTable columns={columns} data={data} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<DataTable columns={columns} data={[]} isLoading />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows empty state', () => {
    render(<DataTable columns={columns} data={[]} />)
    expect(screen.getByText('No records found')).toBeInTheDocument()
  })

  it('calls edit action when edit button clicked', () => {
    const onEdit = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        actions={{ edit: onEdit }}
      />
    )
    const editButtons = screen.getAllByTitle('Edit')
    fireEvent.click(editButtons[0])
    expect(onEdit).toHaveBeenCalledWith(data[0])
  })

  it('calls delete action when delete button clicked', () => {
    const onDelete = vi.fn()
    render(
      <DataTable
        columns={columns}
        data={data}
        actions={{ delete: onDelete }}
      />
    )
    const deleteButtons = screen.getAllByTitle('Delete')
    fireEvent.click(deleteButtons[1])
    expect(onDelete).toHaveBeenCalledWith(data[1])
  })

  it('uses custom render for column', () => {
    const customColumns: Column[] = [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status', render: (v) => <span>STATUS:{v}</span> },
    ]
    render(<DataTable columns={customColumns} data={data} />)
    expect(screen.getByText('STATUS:ACTIVE')).toBeInTheDocument()
  })
})
