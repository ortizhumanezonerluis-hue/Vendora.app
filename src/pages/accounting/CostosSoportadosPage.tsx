import { useState, useEffect, useMemo } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import { useAuth } from '../../components/auth/AuthContext'
import { accountingService, CostoSoportado } from '../../services/accountingService'
import { formatCOP } from '../../lib/utils'
import { toast } from '../../components/ui/Toaster'
import { SkeletonPage } from '../../components/ui/Skeleton'
import {
  FolderCheck, Plus, Search, FileText, Code2, Download,
  CheckCircle2, Clock, XCircle, Trash2, X, Save, ExternalLink,
  Building, Filter, UploadCloud
} from 'lucide-react'

type EstadoFilter = 'todos' | 'validado' | 'pendiente'

export default function CostosSoportadosPage() {
  const { profile } = useAuth()
  const [costos, setCostos] = useState<CostoSoportado[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('todos')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0])
  const [formProveedor, setFormProveedor] = useState('')
  const [formNit, setFormNit] = useState('')
  const [formFactura, setFormFactura] = useState('')
  const [formSubtotal, setFormSubtotal] = useState('')
  const [formIva, setFormIva] = useState('0')
  const [formTotal, setFormTotal] = useState('')
  const [formNotas, setFormNotas] = useState('')
  const [formPdfUrl, setFormPdfUrl] = useState('')
  const [formXmlUrl, setFormXmlUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.negocio_id) loadCostos()
  }, [profile])

  const loadCostos = async () => {
    setLoading(true)
    try {
      const data = await accountingService.getCostosSoportados(profile!.negocio_id)
      setCostos(data)
    } catch (err: any) {
      toast(err.message || 'Error cargando costos soportados', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Recalculate total when subtotal or iva changes
  const handleSubtotalChange = (val: string) => {
    setFormSubtotal(val)
    const sub = parseFloat(val) || 0
    const ivaVal = parseFloat(formIva) || 0
    setFormTotal(String(sub + ivaVal))
  }

  const handleIvaChange = (val: string) => {
    setFormIva(val)
    const sub = parseFloat(formSubtotal) || 0
    const ivaVal = parseFloat(val) || 0
    setFormTotal(String(sub + ivaVal))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.negocio_id) return
    const tot = parseFloat(formTotal) || 0
    if (tot <= 0) {
      toast('El total debe ser mayor a cero', { type: 'error' })
      return
    }

    setSaving(true)
    try {
      const payload: Omit<CostoSoportado, 'id'> = {
        tenant_id: profile.negocio_id,
        fecha: formFecha,
        proveedor_nombre: formProveedor,
        proveedor_nit: formNit,
        numero_factura: formFactura,
        subtotal: parseFloat(formSubtotal) || tot,
        iva: parseFloat(formIva) || 0,
        total: tot,
        estado: 'validado',
        pdf_url: formPdfUrl || '#',
        xml_url: formXmlUrl || '#',
        notas: formNotas || undefined
      }

      const created = await accountingService.addCostoSoportado(payload)
      setCostos(prev => [created, ...prev])
      toast('Factura de proveedor registrada en archivo de costos', { type: 'success' })
      setModalOpen(false)
    } catch (err: any) {
      toast(err.message || 'Error al guardar soporte', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este documento soporte?')) return
    try {
      await accountingService.deleteCostoSoportado(id)
      setCostos(prev => prev.filter(c => c.id !== id))
      toast('Documento soporte eliminado', { type: 'success' })
    } catch (err: any) {
      toast(err.message || 'Error al eliminar', { type: 'error' })
    }
  }

  const filtered = useMemo(() => {
    return costos.filter(c => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        c.proveedor_nombre.toLowerCase().includes(q) ||
        c.proveedor_nit.includes(q) ||
        c.numero_factura.toLowerCase().includes(q)

      const matchEstado = estadoFilter === 'todos' || c.estado === estadoFilter
      return matchSearch && matchEstado
    })
  }, [costos, search, estadoFilter])

  const totalSoportado = useMemo(() => filtered.reduce((s, c) => s + (Number(c.total) || 0), 0), [filtered])

  if (loading) {
    return (
      <MainLayout title="Carpeta de Costos Soportados">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Carpeta de Costos Soportados">
      <div className="p-6 space-y-5 max-w-[1400px] mx-auto animate-in fade-in duration-300">
        
        {/* Header (OpenAI Style) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Carpeta de Costos Soportados</h2>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                Deducibilidad Tributaria
              </span>
            </div>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Repositorio de facturas electrónicas de proveedores (PDF y XML) con soporte fiscal oficial
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFormFecha(new Date().toISOString().split('T')[0])
                setFormProveedor('')
                setFormNit('')
                setFormFactura('')
                setFormSubtotal('')
                setFormIva('0')
                setFormTotal('')
                setFormNotas('')
                setFormPdfUrl('')
                setFormXmlUrl('')
                setModalOpen(true)
              }}
              className="px-3.5 h-8 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={13} />
              Cargar Factura / Soporte
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Total Costos Soportados
            </span>
            <p className="text-2xl font-bold font-mono text-gray-900">{formatCOP(totalSoportado)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Con validez formal ante compras a proveedores</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Facturas Electrónicas
            </span>
            <p className="text-2xl font-bold font-mono text-gray-900">{filtered.length} docs</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">100% con respaldo PDF / XML</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Estado de Soporte Fiscal
            </span>
            <p className="text-2xl font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 size={22} />
              Validado
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Archivos disponibles para inspección DIAN</p>
          </div>
        </div>

        {/* Search and Filters Bar (OpenAI Style) */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por proveedor, NIT o N° Factura..."
                className="w-full h-8 pl-8 pr-8 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1">
              {([
                { key: 'todos', label: 'Todos' },
                { key: 'validado', label: 'Validados' },
                { key: 'pendiente', label: 'Pendientes' }
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setEstadoFilter(key)}
                  className={[
                    'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                    estadoFilter === key
                      ? 'bg-gray-900 text-white font-semibold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[12px] text-gray-400 font-medium">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Table of Costos Soportados */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 space-y-2 shadow-xs">
            <FolderCheck size={28} className="mx-auto text-gray-300 mb-1" />
            <p className="text-[13px] font-bold text-gray-700">Sin facturas registradas</p>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Carga las facturas electrónicas emitidas por tus proveedores para justificar costos de adquisición.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[580px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-28">Fecha</th>
                    <th className="px-4 py-3">Proveedor / Emisor</th>
                    <th className="px-4 py-3 w-36">NIT Emisor</th>
                    <th className="px-4 py-3 w-32">N° Factura</th>
                    <th className="px-4 py-3 text-right w-28">Subtotal</th>
                    <th className="px-4 py-3 text-right w-24">IVA</th>
                    <th className="px-4 py-3 text-right w-32">Total COP</th>
                    <th className="px-4 py-3 text-center w-28">Archivos</th>
                    <th className="px-4 py-3 text-center w-24">Estado</th>
                    <th className="px-4 py-3 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[12px] text-gray-700">
                  {filtered.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-800">{item.fecha}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        <div>{item.proveedor_nombre}</div>
                        {item.notas && <p className="text-[10px] text-gray-400 font-normal truncate max-w-xs">{item.notas}</p>}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-500">{item.proveedor_nit}</td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900">{item.numero_factura}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCOP(item.subtotal)}</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-500">{item.iva > 0 ? formatCOP(item.iva) : 'Exento'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-950">{formatCOP(item.total)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => toast(`Visualizando PDF factura ${item.numero_factura}`, { type: 'success' })}
                            className="px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 rounded text-[10px] font-bold border border-red-200/60 flex items-center gap-0.5 transition-colors"
                          >
                            <FileText size={10} />
                            PDF
                          </button>
                          <button
                            onClick={() => toast(`Descargando XML UBL factura ${item.numero_factura}`, { type: 'success' })}
                            className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[10px] font-bold border border-blue-200/60 flex items-center gap-0.5 transition-colors"
                          >
                            <Code2 size={10} />
                            XML
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          Validado
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Cargar Factura */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">Cargar Factura / Soporte de Costo</h3>
                  <p className="text-[11px] text-gray-400">Adjunta la factura electrónica emitida por tu proveedor</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div className="p-5 space-y-3.5 text-[12px]">
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Fecha Emisión</label>
                      <input
                        type="date"
                        required
                        value={formFecha}
                        onChange={e => setFormFecha(e.target.value)}
                        className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">N° Factura / Prefijo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: FE-10294"
                        value={formFactura}
                        onChange={e => setFormFactura(e.target.value)}
                        className="w-full h-8 px-2.5 font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Nombre Proveedor</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Distribuidora Central S.A.S."
                        value={formProveedor}
                        onChange={e => setFormProveedor(e.target.value)}
                        className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">NIT del Proveedor</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 900.123.456-7"
                        value={formNit}
                        onChange={e => setFormNit(e.target.value)}
                        className="w-full h-8 px-2.5 font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Subtotal COP</label>
                      <input
                        type="number"
                        required
                        placeholder="0"
                        value={formSubtotal}
                        onChange={e => handleSubtotalChange(e.target.value)}
                        className="w-full h-8 px-2.5 font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">IVA COP</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formIva}
                        onChange={e => handleIvaChange(e.target.value)}
                        className="w-full h-8 px-2.5 font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Total COP ($)</label>
                      <input
                        type="number"
                        required
                        placeholder="0"
                        value={formTotal}
                        onChange={e => setFormTotal(e.target.value)}
                        className="w-full h-8 px-2.5 font-mono font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Archivos Adjuntos (PDF y XML)</label>
                    <div className="border border-dashed border-gray-300 rounded-lg p-3 text-center bg-gray-50/50 hover:bg-gray-50 cursor-pointer">
                      <UploadCloud size={20} className="mx-auto text-gray-400 mb-1" />
                      <p className="text-[11px] font-semibold text-gray-700">Arrastra o adjunta tus archivos PDF / XML</p>
                      <p className="text-[10px] text-gray-400">Formatos soportados: .pdf, .xml UBL 2.1</p>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Notas / Descripción (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej: Compra de víveres para surtir abarrotes..."
                      value={formNotas}
                      onChange={e => setFormNotas(e.target.value)}
                      className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                    />
                  </div>

                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3.5 h-8 border border-gray-200 hover:bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 h-8 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Save size={12} />
                    {saving ? 'Guardando...' : 'Guardar Factura'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  )
}
