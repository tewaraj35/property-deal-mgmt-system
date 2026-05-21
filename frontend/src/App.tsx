import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/protected-route'
import MainLayout from './components/layout/main-layout'
import { ToastProvider } from './components/common/toast'
import LoginPage from './pages/login-page'
import DashboardPage from './pages/dashboard-page'
import BuyersPage from './pages/buyers-page'
import SellersPage from './pages/sellers-page'
import RentersPage from './pages/renters-page'
import LoanClientsPage from './pages/loan-clients-page'
import UsersPage from './pages/users-page'
import './styles/globals.css'

const LayoutRoute: React.FC<{ children: React.ReactNode; requiredRoles?: string[] }> = ({
  children,
  requiredRoles,
}) => (
  <ProtectedRoute requiredRoles={requiredRoles}>
    <MainLayout>{children}</MainLayout>
  </ProtectedRoute>
)

export const App: React.FC = () => {
  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<LayoutRoute><DashboardPage /></LayoutRoute>} />
        <Route path="/buyers" element={<LayoutRoute><BuyersPage /></LayoutRoute>} />
        <Route path="/sellers" element={<LayoutRoute><SellersPage /></LayoutRoute>} />
        <Route path="/renters" element={<LayoutRoute><RentersPage /></LayoutRoute>} />
        <Route path="/loan-clients" element={<LayoutRoute><LoanClientsPage /></LayoutRoute>} />
        <Route
          path="/users"
          element={
            <LayoutRoute requiredRoles={['ADMIN', 'SUPER_ADMIN']}>
              <UsersPage />
            </LayoutRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  )
}

export default App
