import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../pages/login-page'

// Mock hooks and services that touch the network
vi.mock('../hooks/use-auth', () => ({
  useAuth: () => ({
    setUser: vi.fn(),
    setToken: vi.fn(),
    setIsLoading: vi.fn(),
  }),
}))

vi.mock('../services/auth-service', () => ({
  authService: {
    login: vi.fn(),
  },
}))

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => vi.fn() }
})

import { authService } from '../services/auth-service'
const mockLogin = vi.mocked(authService.login)

const renderLogin = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  )

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset()
  })

  it('renders the form', () => {
    renderLogin()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows error when email and password are empty on submit', async () => {
    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/email and password are required/i)).toBeInTheDocument()
    })
  })

  it('shows error for invalid email format', async () => {
    renderLogin()
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'not-an-email' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() => {
      expect(screen.getByText(/valid email address/i)).toBeInTheDocument()
    })
  })

  it('calls authService.login with email and password on valid submit', async () => {
    mockLogin.mockResolvedValueOnce({
      user: { id: '1', email: 'a@b.com', fullName: 'A', role: 'AGENT' as any, status: 'ACTIVE' as any, createdAt: '', updatedAt: '' },
      tokens: { accessToken: 'tok' },
    })

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@nesh.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@nesh.com', 'password123')
    })
  })

  it('shows error message when login API fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))

    renderLogin()
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'admin@nesh.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpassword' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })
})
