import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { SesionAuditoria, DetalleSesionAuditoria, auditSessionService } from '../services/auditSessionService'
import { reorderService, Proveedor } from '../services/reorderService'
import { useAuth } from '../components/auth/AuthContext'
import { toast } from '../components/ui/Toaster'
import { Plus, X, ClipboardList, Loader2 } from 'lucide-react'
import { Select } from '../components/ui/Select'

import AuditTable from '../components/inventory/AuditTable'
import AuditSession from '../components/inventory/AuditSession'
import AuditSummaryModal from '../components/inventory/AuditSummaryModal'

export default function AuditPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.rol === 'admin'

  const [sessions, setSessions] = useState<SesionAuditoria[]>([])
  const [suppliers, setSuppliers] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)

  // Navigation states
  const [activeSession, setActiveSession] = useState<SesionAuditoria | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [countedDraftItems, setCountedDraftItems] = useState<any[]>([])

  // Modal setup for new session
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [scope, setScope] = useState<'todo' | 'categoria' | 'proveedor'>('todo')
  const [filterValue, setFilterValue] = useState('')
  const [hideTheoretical, setHideTheoretical] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Categories list options
  const categoriesList = ['Abarrotes', 'Lácteos', 'Bebidas', 'Frutas y Verduras', 'Panadería', 'Limpieza', 'Higiene Personal']

  useEffect(() => {
    if (profile?.negocio_id) {
      loadSessionsData()
    }
  }, [profile])

  const loadSessionsData = async () => {
    if (!profile?.negocio_id) return
    setLoading(true)
    try {
      const list = await auditSessionService.getSessions(profile.negocio_id)
      setSessions(list)
      const sups = await reorderService.getProveedores(profile.negocio_id)
      setSuppliers(sups)
    } catch (err: any) {
      toast(err.message || 'Error cargando historial de auditorías', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.negocio_id || !newSessionName.trim()) return
    setSubmitting(true)
    try {
      const newSession = await auditSessionService.createSession({
        negocio_id: profile.negocio_id,
        nombre: newSessionName.trim(),
        responsable: profile.nombre || 'Administrador',
        alcance: scope,
        filtro_valor: scope !== 'todo' ? filterValue : undefined,
        ocultar_teorico: hideTheoretical,
        estado: 'en_proceso'
      })
      toast('Sesión de auditoría creada', { type: 'success' })
      setSessions(prev => [newSession, ...prev])
      setShowCreateModal(false)
      // Reset creation form
      setNewSessionName('')
      setScope('todo')
      setFilterValue('')
      setHideTheoretical(false)
      // Automatically jump to the active counting table
      setActiveSession(newSession)
    } catch (err: any) {
      toast(err.message || 'Error al iniciar sesión de auditoría', { type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('¿Eliminar esta sesión de auditoría? El historial de conteo se perderá.')) return
    try {
      await auditSessionService.deleteSession(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      toast('Sesión de auditoría eliminada', { type: 'success' })
    } catch (err: any) {
      toast(err.message || 'Error al eliminar sesión', { type: 'error' })
    }
  }

  const handleFinalizeCountClick = (items: any[]) => {
    setCountedDraftItems(items)
    setShowSummary(true)
  }

  const handleAuditApproved = () => {
    setShowSummary(false)
    setActiveSession(null)
    loadSessionsData()
  }

  const handleRetakeSession = async (session: SesionAuditoria) => {
    if (session.estado === 'completada') {
      // Direct load to see historic static summary details
      const details = await auditSessionService.getSessionDetails(session.id!)
      setCountedDraftItems(details)
      setActiveSession(session)
      setShowSummary(true)
    } else {
      setActiveSession(session)
    }
  }

  return (
    <MainLayout title="Auditoría Física de Inventario">
      <div className="p-5 space-y-5 max-w-[1400px]">

        
        {/* Active counting screen handles layout internally */}
        {activeSession && !showSummary ? (
          <AuditSession
            session={activeSession}
            usuarioNombre={profile?.nombre || 'Administrador'}
            onBack={() => {
              setActiveSession(null)
              loadSessionsData()
            }}
            onFinalize={handleFinalizeCountClick}
          />
        ) : (
          <>
            {/* Standard Dashboard Screen */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-[15px] font-bold text-gray-900 flex items-center gap-1.5">
                  <ClipboardList size={16} />
                  Auditorías & Conteos Físicos
                </h1>
                <p className="text-[12px] text-gray-400 mt-0.5">
                  Realiza inventarios cíclicos, concilia diferencias y detecta pérdidas financieras.
                </p>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 h-8 bg-gray-900 text-white rounded-lg text-[12px] font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus size={13} />
                Nueva Auditoría
              </button>
            </div>

            {loading ? (
              <div className="h-64 border border-gray-250 rounded-xl bg-gray-50/50 flex items-center justify-center text-[12px] text-gray-400">
                <Loader2 size={16} className="animate-spin mr-1.5" />
                Cargando histórico de auditorías...
              </div>
            ) : (
              <AuditTable
                sessions={sessions}
                onSelect={handleRetakeSession}
                onDelete={handleDeleteSession}
                isAdmin={isAdmin}
              />
            )}
          </>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateSession} className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-[13px] font-bold text-gray-900">Iniciar Sesión de Conteo</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Define los parámetros del nuevo inventariado</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3.5 text-[12px]">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Nombre de la sesión
                </label>
                <input
                  type="text"
                  required
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Ej: Auditoría Fin de Mes - Agosto 2026"
                  className="w-full h-8 px-3 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  Alcance
                </label>
                <Select
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value as any)
                    setFilterValue('')
                  }}
                >
                  <option value="todo">Todo el Inventario</option>
                  <option value="categoria">Filtrar por Categoría</option>
                  <option value="proveedor">Filtrar por Proveedor</option>
                </Select>
              </div>

              {scope === 'categoria' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Selecciona Categoría
                  </label>
                  <Select
                    value={filterValue}
                    required
                    onChange={(e) => setFilterValue(e.target.value)}
                  >
                    <option value="">Seleccione Categoría...</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </div>
              )}

              {scope === 'proveedor' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Selecciona Proveedor
                  </label>
                  <Select
                    value={filterValue}
                    required
                    onChange={(e) => setFilterValue(e.target.value)}
                  >
                    <option value="">Seleccione Proveedor...</option>
                    {suppliers.map(sup => (
                      <option key={sup.id} value={sup.id}>{sup.nombre}</option>
                    ))}
                  </Select>
                </div>
              )}

              <div className="flex items-start gap-2.5 pt-2">
                <input
                  type="checkbox"
                  id="hideTheoretical"
                  checked={hideTheoretical}
                  onChange={(e) => setHideTheoretical(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                />
                <label htmlFor="hideTheoretical" className="text-gray-600 select-none leading-tight cursor-pointer">
                  <span className="font-semibold text-gray-950 block">Ocultar Stock Teórico durante el Conteo</span>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Habilita un conteo a ciegas para evitar que el operario copie los datos sugeridos por el sistema.
                  </span>
                </label>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="h-8 px-3.5 border border-gray-200 text-[12px] font-semibold text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-8 px-4 bg-gray-950 text-white rounded-md text-[12px] font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                {submitting ? 'Creando...' : 'Iniciar Conteo'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUMMARY MODAL */}
      {showSummary && activeSession && (
        <AuditSummaryModal
          session={activeSession}
          countedItems={countedDraftItems}
          isAdmin={isAdmin}
          onClose={() => {
            setShowSummary(false)
            if (activeSession.estado === 'completada') {
              setActiveSession(null)
            }
          }}
          onApproved={handleAuditApproved}
        />
      )}
    </MainLayout>
  )
}
