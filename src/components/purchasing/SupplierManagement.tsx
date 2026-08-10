import { useState, useEffect } from 'react'
import { reorderService, Proveedor } from '../../services/reorderService'
import { useAuth } from '../auth/AuthContext'
import { toast } from '../ui/Toaster'
import { Plus, Edit2, Trash2, X, Phone, Mail, Calendar, User } from 'lucide-react'

export default function SupplierManagement() {
  const { profile } = useAuth()
  const [suppliers, setSuppliers] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form State
  const [supplierId, setSupplierId] = useState<string | undefined>(undefined)
  const [nombre, setNombre] = useState('')
  const [asesor, setAsesor] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [diasVisita, setDiasVisita] = useState('')

  useEffect(() => {
    loadSuppliers()
  }, [profile])

  const loadSuppliers = async () => {
    if (!profile?.negocio_id) return
    setLoading(true)
    try {
      const data = await reorderService.getProveedores(profile.negocio_id)
      setSuppliers(data)
    } catch (err: any) {
      toast(err.message || 'Error cargando proveedores', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (s: Proveedor) => {
    setSupplierId(s.id)
    setNombre(s.nombre)
    setAsesor(s.asesor || '')
    setTelefono(s.telefono || '')
    setEmail(s.email || '')
    setDiasVisita(s.dias_visita || '')
    setShowModal(true)
  }

  const handleCreate = () => {
    setSupplierId(undefined)
    setNombre('')
    setAsesor('')
    setTelefono('')
    setEmail('')
    setDiasVisita('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.negocio_id) return
    try {
      await reorderService.saveProveedor({
        id: supplierId,
        nombre,
        asesor,
        telefono,
        email,
        dias_visita: diasVisita
      }, profile.negocio_id)

      toast(supplierId ? 'Proveedor actualizado' : 'Proveedor creado', { type: 'success' })
      setShowModal(false)
      loadSuppliers()
    } catch (err: any) {
      toast(err.message || 'Error al guardar proveedor', { type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proveedor?')) return
    try {
      await reorderService.deleteProveedor(id)
      toast('Proveedor eliminado', { type: 'success' })
      loadSuppliers()
    } catch (err: any) {
      toast(err.message || 'Error al eliminar', { type: 'error' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[14px] font-bold text-gray-900">Directorio de Proveedores</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">Administra tus contactos y días de visitas de asesores</p>
        </div>
        <button
          onClick={handleCreate}
          className="h-8 px-3 bg-gray-900 text-white rounded-lg text-[12px] font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1.5"
        >
          <Plus size={13} />
          Nuevo Proveedor
        </button>
      </div>

      {loading ? (
        <div className="h-48 border border-gray-100 rounded-xl bg-gray-50/50 flex items-center justify-center text-[12px] text-gray-400">
          Cargando proveedores...
        </div>
      ) : suppliers.length === 0 ? (
        <div className="h-48 border border-gray-100 rounded-xl bg-white flex flex-col items-center justify-center text-center p-6">
          <User size={20} className="text-gray-300 mb-2" />
          <p className="text-[13px] font-semibold text-gray-700">Sin proveedores</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Registra un proveedor para asociarlo con tus productos</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Proveedor / Empresa</th>
                <th className="px-5 py-3">Asesor / Contacto</th>
                <th className="px-5 py-3">Días de Visita</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[12px] text-gray-700">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-950">{s.nombre}</p>
                    {s.email && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                        <Mail size={10} />
                        {s.email}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{s.asesor || '—'}</p>
                    {s.telefono && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                        <Phone size={10} />
                        {s.telefono}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {s.dias_visita ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-semibold">
                        <Calendar size={10} />
                        {s.dias_visita}
                      </span>
                    ) : (
                      <span className="text-gray-400">No especificado</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => handleEdit(s)}
                        className="p-1.5 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 border border-red-100 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-gray-200 w-full max-w-sm shadow-xl"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <p className="text-[13px] font-semibold text-gray-900">
                {supplierId ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </p>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-5 space-y-3.5">
              {[
                { label: 'Nombre de la Empresa (Obligatorio)', value: nombre, setter: setNombre, placeholder: 'Ej: Colanta S.A.' },
                { label: 'Nombre del Asesor', value: asesor, setter: setAsesor, placeholder: 'Ej: Juan Pérez' },
                { label: 'Teléfono / WhatsApp', value: telefono, setter: setTelefono, placeholder: 'Ej: 3001234567' },
                { label: 'Correo Electrónico', value: email, setter: setEmail, placeholder: 'Ej: contacto@colanta.com' },
                { label: 'Días de Visita / Entrega', value: diasVisita, setter: setDiasVisita, placeholder: 'Ej: Lunes y Jueves' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label}>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    required={label.includes('Obligatorio')}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 h-9 border border-gray-200 text-[13px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 h-9 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-800 transition-colors"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
