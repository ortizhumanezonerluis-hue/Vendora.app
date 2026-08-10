import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { supabase } from '../lib/supabaseClient'
import { authService } from '../services/authService'
import { toast } from '../components/ui/Toaster'
import { Select } from '../components/ui/Select'
import { SkeletonPage } from '../components/ui/Skeleton'
import { Store, Users, Bell, Shield, ChevronRight, Loader2, Plus, X } from 'lucide-react'

import { useAuth } from '../components/auth/AuthContext'

interface SupabaseUser {
  id: string
  nombre: string
  email: string
  rol: string
  estado: string
}

const sections = [
  { id: 'store', icon: Store, title: 'Información del Negocio' },
  { id: 'users', icon: Users, title: 'Usuarios y Roles' },
  { id: 'notifications', icon: Bell, title: 'Alertas y Notificaciones' },
  { id: 'security', icon: Shield, title: 'Seguridad' },
]

export default function SettingsPage() {
  const { profile } = useAuth()
  const [activeSection, setActiveSection] = useState('store')

  // Store info
  const [storeName, setStoreName] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [rfc, setRfc] = useState('')
  const [configId, setConfigId] = useState<string | null>(null)
  const [storeSaving, setStoreSaving] = useState(false)

  // Notifications
  const [minStock, setMinStock] = useState('10')
  const [notifyCash, setNotifyCash] = useState(true)
  const [notifyStock, setNotifyStock] = useState(true)
  const [notifyAudit, setNotifyAudit] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)

  // Users
  const [usersList, setUsersList] = useState<SupabaseUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRol, setNewRol] = useState<'admin' | 'empleado'>('empleado')
  const [addingUser, setAddingUser] = useState(false)
  const [addUserError, setAddUserError] = useState<string | null>(null)

  // Loading state for store config
  const isInitialLoading = !storeName && !storeAddress && !rfc

  // Load store settings — use maybeSingle so no error if empty
  useEffect(() => {
    async function loadSettings() {
      if (!profile) return
      try {
        let query = supabase
          .from('configuracion_negocio')
          .select('*')
          .order('actualizado_en', { ascending: false })

        if (profile.negocio_id) {
          query = query.eq('negocio_id', profile.negocio_id)
        }

        const { data, error } = await query.limit(1).maybeSingle()
        if (error) throw error
        if (data) {
          setConfigId(data.id)
          setStoreName(data.nombre || '')
          setStoreAddress(data.direccion || '')
          setRfc(data.rfc || '')
          setMinStock(String(data.stock_minimo_alerta ?? 10))
          setNotifyCash(Boolean(data.notif_caja ?? true))
          setNotifyStock(Boolean(data.notif_stock ?? true))
          setNotifyAudit(Boolean(data.notif_auditoria ?? false))
        }
      } catch (err) {
        console.warn('No se pudo cargar la configuración del negocio:', err)
      }
    }
    loadSettings()
  }, [profile])

  // Load users when section = users
  useEffect(() => {
    if (activeSection !== 'users') return
    loadUsers()
  }, [activeSection])

  async function loadUsers() {
    if (!profile) return
    setUsersLoading(true)
    try {
      let query = supabase
        .from('usuarios')
        .select('*')
        .order('fecha_creacion', { ascending: false })

      if (profile.negocio_id) {
        query = query.eq('negocio_id', profile.negocio_id)
      }

      const { data, error } = await query
      if (error) throw error
      setUsersList(data || [])
    } catch (err: any) {
      console.error('Error cargando usuarios:', err)
    } finally {
      setUsersLoading(false)
    }
  }

  const saveStore = async () => {
    if (!profile) return
    setStoreSaving(true)
    try {
      const payload: any = {
        nombre: storeName,
        direccion: storeAddress,
        rfc,
        stock_minimo_alerta: parseInt(minStock) || 10,
        notif_caja: notifyCash,
        notif_stock: notifyStock,
        notif_auditoria: notifyAudit,
        actualizado_en: new Date().toISOString()
      }
      if (profile.negocio_id) {
        payload.negocio_id = profile.negocio_id
      }

      if (configId) {
        const { error } = await supabase.from('configuracion_negocio').update(payload).eq('id', configId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('configuracion_negocio').insert([payload]).select().single()
        if (error) throw error
        if (data) setConfigId(data.id)
      }
      toast('Configuración guardada correctamente', { type: 'success' })
    } catch (err: any) {
      toast('Error al guardar configuración', { type: 'error', description: err.message })
    } finally {
      setStoreSaving(false)
    }
  }

  const saveNotifications = async () => {
    if (!profile) return
    setNotifSaving(true)
    try {
      const payload: any = {
        stock_minimo_alerta: parseInt(minStock) || 10,
        notif_caja: notifyCash,
        notif_stock: notifyStock,
        notif_auditoria: notifyAudit,
        actualizado_en: new Date().toISOString()
      }
      if (profile.negocio_id) {
        payload.negocio_id = profile.negocio_id
      }

      if (configId) {
        const { error } = await supabase.from('configuracion_negocio').update(payload).eq('id', configId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('configuracion_negocio').insert([payload]).select().single()
        if (error) throw error
        if (data) setConfigId(data.id)
      }
      toast('Preferencias de notificaciones guardadas', { type: 'success' })
    } catch (err: any) {
      toast('Error al guardar notificaciones', { type: 'error', description: err.message })
    } finally {
      setNotifSaving(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.negocio_id) {
      toast('No tienes un negocio asignado', { type: 'error' })
      return
    }
    setAddingUser(true)
    setAddUserError(null)
    try {
      await authService.createEmployee(newEmail, newPassword, newName, newRol, profile.negocio_id)
      toast('Empleado registrado exitosamente', { type: 'success' })
      setShowAddUser(false)
      setNewName('')
      setNewEmail('')
      setNewPassword('')
      setNewRol('empleado')
      loadUsers()
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('rate limit') || msg.includes('429')) {
        setAddUserError('Límite de registros alcanzado. Desactiva "Confirm email" en Supabase Auth → Providers → Email.')
      } else {
        setAddUserError(msg || 'Error al crear el usuario')
      }
    } finally {
      setAddingUser(false)
    }
  }

  const toggleUserStatus = async (u: SupabaseUser) => {
    const newEstado = u.estado === 'activo' ? 'inactivo' : 'activo'
    try {
      await supabase.from('usuarios').update({ estado: newEstado }).eq('id', u.id)
      setUsersList((prev) => prev.map((x) => x.id === u.id ? { ...x, estado: newEstado } : x))
      toast(`Usuario ${newEstado === 'activo' ? 'activado' : 'desactivado'} correctamente`, { type: 'success' })
    } catch (err: any) {
      toast('Error al cambiar estado del usuario', { type: 'error' })
    }
  }

  if (isInitialLoading) {
    return (
      <MainLayout title="Configuración">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Configuración">
      <div className="p-5 flex gap-5 max-w-5xl">
        {/* Section list */}
        <div className="w-52 shrink-0 space-y-0.5">
          {sections.map(({ id, icon: Icon, title }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={[
                'w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2.5',
                activeSection === id ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              ].join(' ')}
            >
              <Icon size={14} className={activeSection === id ? 'text-gray-900' : 'text-gray-400'} />
              <span className="text-[12px] font-medium">{title}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg overflow-hidden">

          {/* ── STORE INFO ── */}
          {activeSection === 'store' && (
            <div>
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-[14px] font-semibold text-gray-900">Información del Negocio</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Datos fiscales y de contacto</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                {[
                  { label: 'Nombre del Negocio', value: storeName, setter: setStoreName, placeholder: 'Ej: Tienda Vendora' },
                  { label: 'Dirección', value: storeAddress, setter: setStoreAddress, placeholder: 'Ej: Av. Caracas #45-12' },
                  { label: 'NIT / RUT', value: rfc, setter: setRfc, placeholder: 'Ej: 900.123.456-7' },
                ].map(({ label, value, setter, placeholder }) => (
                  <div key={label}>
                    <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={placeholder}
                      className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors bg-white"
                    />
                  </div>
                ))}
                <div className="pt-2">
                  <button
                    onClick={saveStore}
                    disabled={storeSaving}
                    className="px-4 h-9 text-[13px] font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center gap-2"
                  >
                    {storeSaving && <Loader2 size={13} className="animate-spin" />}
                    {storeSaving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── USERS ── */}
          {activeSection === 'users' && (
            <div>
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-semibold text-gray-900">Usuarios y Roles</p>
                  <p className="text-[12px] text-gray-400 mt-0.5">
                    {usersLoading ? 'Cargando...' : `${usersList.length} usuarios registrados`}
                  </p>
                </div>
                <button
                  onClick={() => { setShowAddUser(true); setAddUserError(null) }}
                  className="px-3 h-8 bg-gray-900 text-white text-[12px] font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  Nuevo Usuario
                </button>
              </div>

              <div className="divide-y divide-gray-50">
                {usersLoading ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                    <Loader2 size={15} className="animate-spin" />
                    <span className="text-[13px]">Cargando usuarios...</span>
                  </div>
                ) : usersList.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users size={24} className="mx-auto text-gray-200 mb-2" />
                    <p className="text-[13px] text-gray-400">Sin usuarios registrados</p>
                  </div>
                ) : (
                  usersList.map((u) => {
                    const initials = u.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                    return (
                      <div key={u.id} className="flex items-center justify-between px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-600">
                            {initials}
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-gray-900">{u.nombre}</p>
                            <p className="text-[11px] text-gray-400">{u.email} · <span className="capitalize">{u.rol}</span></p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleUserStatus(u)}
                            className={[
                              'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                              u.estado === 'activo'
                                ? 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                : 'bg-red-50 text-red-600 hover:bg-gray-100 hover:text-gray-600'
                            ].join(' ')}
                          >
                            {u.estado === 'activo' ? 'Activo' : 'Inactivo'}
                          </button>
                          <ChevronRight size={14} className="text-gray-300" />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeSection === 'notifications' && (
            <div>
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-[14px] font-semibold text-gray-900">Alertas y Notificaciones</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Configura cuándo y cómo recibes alertas</p>
              </div>
              <div className="px-6 py-5 space-y-6">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                    Stock mínimo para alerta
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    className="w-28 h-9 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Alerta cuando el stock cae por debajo de este número</p>
                </div>

                <div className="space-y-4">
                  {([
                    { label: 'Discrepancias en arqueo de caja', key: 'cash', value: notifyCash, setter: setNotifyCash },
                    { label: 'Productos con stock bajo', key: 'stock', value: notifyStock, setter: setNotifyStock },
                    { label: 'Eventos críticos de auditoría', key: 'audit', value: notifyAudit, setter: setNotifyAudit },
                  ] as const).map(({ label, key, value, setter }) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-[13px] text-gray-700 flex-1 pr-4">{label}</span>
                      {/* Toggle switch — fixed layout so it never clips */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={value}
                        onClick={() => setter(!value)}
                        className={[
                          'relative inline-flex items-center shrink-0 h-5 w-9 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
                          value ? 'bg-gray-900' : 'bg-gray-200'
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                            value ? 'translate-x-4' : 'translate-x-0'
                          ].join(' ')}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={saveNotifications}
                  disabled={notifSaving}
                  className="px-4 h-9 text-[13px] font-medium rounded-md bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  {notifSaving && <Loader2 size={13} className="animate-spin" />}
                  {notifSaving ? 'Guardando...' : 'Guardar preferencias'}
                </button>
              </div>
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeSection === 'security' && (
            <div>
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-[14px] font-semibold text-gray-900">Seguridad</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Contraseña y autenticación</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                {['Contraseña actual', 'Nueva contraseña', 'Confirmar contraseña'].map((label) => (
                  <div key={label}>
                    <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1.5">{label}</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors bg-white"
                    />
                  </div>
                ))}
                <button className="px-4 h-9 bg-gray-900 text-white text-[13px] font-medium rounded-md hover:bg-gray-800 transition-colors">
                  Cambiar contraseña
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ADD USER MODAL ── */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleAddUser}
            className="bg-white rounded-xl border border-gray-200 w-full max-w-sm shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Registrar Nuevo Usuario</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Crea un acceso para tu equipo</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3.5">
              {addUserError && (
                <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 text-[11px] rounded-md">
                  {addUserError}
                </div>
              )}

              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Carlos Ruiz"
                  className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Contraseña Inicial</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Rol</label>
                <Select
                  value={newRol}
                  onChange={(e) => setNewRol(e.target.value as 'admin' | 'empleado')}
                >
                  <option value="empleado">Empleado</option>
                  <option value="admin">Administrador</option>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="flex-1 h-9 border border-gray-200 text-[13px] text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={addingUser}
                className="flex-1 h-9 bg-gray-900 text-white text-[13px] font-medium rounded-md hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                {addingUser ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}
    </MainLayout>
  )
}
