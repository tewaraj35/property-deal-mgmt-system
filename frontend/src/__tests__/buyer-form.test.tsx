import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BuyerForm from '../components/forms/buyer-form'
import { BuyerStatus } from '../types'

describe('BuyerForm', () => {
  it('renders Add New Buyer title when no buyer prop', () => {
    render(<BuyerForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Add New Buyer')).toBeInTheDocument()
  })

  it('renders Edit Buyer title when buyer prop provided', () => {
    const buyer = {
      id: '1', agentId: 'a1', name: 'Alice', phoneNumber: '0123',
      status: BuyerStatus.ACTIVE, createdAt: '', updatedAt: '',
    }
    render(<BuyerForm buyer={buyer} onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('Edit Buyer')).toBeInTheDocument()
  })

  it('shows validation error when name is empty on submit', () => {
    render(<BuyerForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.click(screen.getByText('Create'))
    expect(screen.getByText('Name is required')).toBeInTheDocument()
  })

  it('shows validation error when phone is empty on submit', () => {
    render(<BuyerForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Alice' } })
    fireEvent.click(screen.getByText('Create'))
    expect(screen.getByText('Phone number is required')).toBeInTheDocument()
  })

  it('calls onSubmit with form data when valid', () => {
    const onSubmit = vi.fn()
    render(<BuyerForm onSubmit={onSubmit} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: 'Alice' } })
    fireEvent.change(screen.getByPlaceholderText('+6012-3456789'), { target: { value: '0123456789' } })
    fireEvent.click(screen.getByText('Create'))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alice', phoneNumber: '0123456789' }))
  })

  it('calls onCancel when Cancel clicked', () => {
    const onCancel = vi.fn()
    render(<BuyerForm onSubmit={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })
})
