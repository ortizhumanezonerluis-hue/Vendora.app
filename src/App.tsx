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
import ComprobantesPage from './pages/ComprobantesPage'
import RutPage from './pages/accounting/RutPage'
import LibroFiscalPage from './pages/accounting/LibroFiscalPage'
import CostosSoportadosPage from './pages/accounting/CostosSoportadosPage'
import ExtractosBancariosPage from './pages/accounting/ExtractosBancariosPage'
import PagosMenoresPage from './pages/accounting/PagosMenoresPage'
import LandingPage from './pages/LandingPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminPage from './pages/admin/AdminPage'
import AdminRoute from './components/auth/AdminRoute'
import { Toaster } from './components/ui/Toaster'
import SyncModal from './components/offline/SyncModal'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SyncModal />
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/scanner-app"
            element={<ScannerAppPage />}
          />
          
          {/* Protected Routes */}
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
          <Route
            path="/comprobantes"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ComprobantesPage />
              </ProtectedRoute>
            }
          />

          {/* Módulo de Contabilidad y Gestión Fiscal (Régimen Simplificado) */}
          <Route
            path="/contabilidad"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Navigate to="/contabilidad/libro-fiscal" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contabilidad/rut"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <RutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contabilidad/libro-fiscal"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LibroFiscalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contabilidad/costos-soportados"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <CostosSoportadosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contabilidad/extractos-bancarios"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ExtractosBancariosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contabilidad/pagos-menores"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <PagosMenoresPage />
              </ProtectedRoute>
            }
          />
          {/* Master Admin Panel (Restricted) */}
          <Route path="/Block_Id/Admin/Vendora" element={<AdminLoginPage />} />
          <Route path="/Block_Id/Admin/Vendora/login" element={<AdminLoginPage />} />
          <Route path="/000/Block_Id/Admin/Vendora" element={<AdminLoginPage />} />
          <Route path="/000/Block_Id/Admin/Vendora/login" element={<AdminLoginPage />} />
          <Route
            path="/Block_Id/Admin/Vendora/panel"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/000/Block_Id/Admin/Vendora/panel"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
          
          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  )
}
