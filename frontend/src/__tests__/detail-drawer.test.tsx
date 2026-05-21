import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DetailDrawer from '../components/common/detail-drawer'

// FileUploadSection makes API calls — mock it out
vi.mock('../components/common/file-upload', () => ({
  default: () => <div data-testid="file-upload-mock">FileUpload</div>,
}))

const baseProps = {
  title: 'Alice Wong',
  subtitle: 'Buyer · ACTIVE',
  entityType: 'buyer' as const,
  entityId: 'buyer-123',
  onClose: vi.fn(),
  onEdit: vi.fn(),
  fields: [
    { label: 'Name', value: 'Alice Wong' },
    { label: 'Phone', value: '0123456789' },
    { label: 'Status', value: 'ACTIVE', badge: 'success' },
    { label: 'Notes', value: null },
  ],
}

describe('DetailDrawer', () => {
  it('renders the title and subtitle', () => {
    render(<DetailDrawer {...baseProps} />)
    expect(screen.getByText('Alice Wong')).toBeInTheDocument()
    expect(screen.getByText('Buyer · ACTIVE')).toBeInTheDocument()
  })

  it('renders all field labels', () => {
    render(<DetailDrawer {...baseProps} />)
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Phone')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Notes')).toBeInTheDocument()
  })

  it('shows field values', () => {
    render(<DetailDrawer {...baseProps} />)
    expect(screen.getByText('0123456789')).toBeInTheDocument()
  })

  it('renders — for null field values', () => {
    render(<DetailDrawer {...baseProps} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('renders FileUploadSection', () => {
    render(<DetailDrawer {...baseProps} />)
    expect(screen.getByTestId('file-upload-mock')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<DetailDrawer {...baseProps} onClose={onClose} />)
    // The backdrop is the first child of the fixed container
    const backdrop = document.querySelector('.absolute.inset-0') as HTMLElement
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<DetailDrawer {...baseProps} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onEdit when Edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<DetailDrawer {...baseProps} onEdit={onEdit} />)
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalled()
  })

  it('calls onClose when ✕ button is clicked', () => {
    const onClose = vi.fn()
    render(<DetailDrawer {...baseProps} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalled()
  })

  it('does not render Edit button when onEdit not provided', () => {
    const { onEdit: _, ...propsWithoutEdit } = baseProps
    render(<DetailDrawer {...propsWithoutEdit} />)
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })
})
