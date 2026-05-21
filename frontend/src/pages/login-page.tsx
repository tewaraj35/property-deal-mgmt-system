import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'
import { authService } from '../services/auth-service'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { setUser, setToken, setIsLoading: setAuthLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate input
      if (!email || !password) {
        setError('Email and password are required')
        return
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address')
        return
      }

      setAuthLoading(true)

      // Call login API
      const response = await authService.login(email, password)

      // Store auth data
      setToken(response.tokens.accessToken)
      setUser(response.user)

      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err: any) {
      const message =
        err.message || 'Login failed. Please check your credentials.'
      setError(message)
    } finally {
      setIsLoading(false)
      setAuthLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-purple-600 to-purple-700">
      <div className="w-full max-w-md">
        <div className="card">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gradient mb-2">
              Nesh Property
            </h1>
            <p className="text-gray-600">
              Management System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="alert-error">
                <p className="font-medium">⚠️ {error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@nesh.com"
                className="input-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                className="input-base"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary"
            >
              {isLoading ? (
                <>
                  <span className="inline-block animate-spin mr-2">⟳</span>
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Demo Credentials:
              <br />
              <span className="font-mono text-xs">admin@nesh.com</span>
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-white bg-opacity-20 text-white rounded-lg text-sm">
          <p>
            🔐 <strong>Secure Login:</strong> API keys stored securely in backend.
            Proper JWT authentication with role-based access control.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
