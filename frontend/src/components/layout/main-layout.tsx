import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/use-auth'
import { UserRole } from '../../types'

interface NavItem {
  path: string
  label: string
  icon: string
  roles?: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/buyers', label: 'Buyers', icon: '👥' },
  { path: '/sellers', label: 'Sellers', icon: '🏠' },
  { path: '/renters', label: 'Renters', icon: '🔑' },
  { path: '/loan-clients', label: 'Loan Clients', icon: '💰' },
  { path: '/users', label: 'Users', icon: '👤', roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN] },
]

interface MainLayoutProps {
  children: React.ReactNode
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true
    return item.roles.includes(user?.role as UserRole)
  })

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-white border-r border-gray-200 flex flex-col transition-all duration-200 shrink-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          {sidebarOpen ? (
            <span className="text-lg font-bold text-blue-700">Nesh Property</span>
          ) : (
            <span className="text-lg font-bold text-blue-700">N</span>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="ml-auto text-gray-400 hover:text-gray-700"
            title={sidebarOpen ? 'Collapse' : 'Expand'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 overflow-hidden">
          {visibleNavItems.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-gray-200 p-4">
          {sidebarOpen ? (
            <div>
              <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
              <button
                onClick={handleLogout}
                className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <button onClick={handleLogout} title="Logout" className="text-red-600 hover:text-red-800 text-sm">
              ⬡
            </button>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          <h1 className="text-lg font-semibold text-gray-800 capitalize">
            {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
          </h1>
          <div className="ml-auto flex items-center gap-3 text-sm text-gray-500">
            <span>{user?.email}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout
