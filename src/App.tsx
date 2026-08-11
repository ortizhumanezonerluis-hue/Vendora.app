import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthContext'
import ProtectedRoute from './components/auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import POSPage from './pages/POSPage'
import InventoryPage from './pages/InventoryPage'
import ScannerPage from './pages/ScannerPage'
import CashRegisterPage from './pages/CashRegisterPage'
import CashHistoryPage from './pages/CashHistoryPage'
import ReportsPage from './pages/ReportsPage'
import PurchasingPage from './pages/PurchasingPage'
import AuditLogsPage from './pages/AuditLogsPage'
import SettingsPage from './pages/SettingsPage'
import AuditPage from './pages/AuditPage'
import ScannerAppPage from './pages/ScannerAppPage'
import { Toaster } from './components/ui/Toaster'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/scanner-app"
            element={<ScannerAppPage />}
          />
          
          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/pos" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POSPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario"
            element={
              <ProtectedRoute>
                <InventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/escaneo"
            element={
              <ProtectedRoute>
                <ScannerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/caja"
            element={
              <ProtectedRoute>
                <CashRegisterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/historial-caja"
            element={
              <ProtectedRoute>
                <CashHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reportes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compras"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PurchasingPage />
              </ProtectedRoute>
            }
          />
          
          {/* Admin-only Routes */}
          <Route
            path="/auditoria"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/Gestion detallada de inventario"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  )
}
