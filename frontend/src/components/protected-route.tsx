import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/use-auth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}

/**
 * ProtectedRoute - Wrapper for routes that require authentication
 * Redirects to login if not authenticated
 * Can optionally check for specific roles
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
}) => {
  const { isAuthenticated, user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⟳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md">
          <div className="text-center">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              Your role doesn't have permission to access this page.
            </p>
            <a href="/dashboard" className="btn-primary">
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute
