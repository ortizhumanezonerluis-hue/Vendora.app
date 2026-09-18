import { useState, useEffect, useMemo } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import { useAuth } from '../../components/auth/AuthContext'
import { accountingService, PagoMenor } from '../../services/accountingService'
import { formatCOP } from '../../lib/utils'
import { toast } from '../../components/ui/Toaster'
import { SkeletonPage } from '../../components/ui/Skeleton'
import {
  Coins, Plus, Search, Trash2, X, Save,
  FileText, Tag, Receipt, Truck, Wrench, Sparkles, ShoppingBag, MoreHorizontal,
  Printer, Download, Eye
} from 'lucide-react'
import { printHtmlDocument, downloadHtmlDocument } from '../../lib/printHelper'

type CategoriaType = 'todas' | 'Acarreos' | 'Servicios' | 'Mantenimiento' | 'Aseo' | 'Suministros' | 'Otros'

export default function PagosMenoresPage() {
  const { profile } = useAuth()
  const [pagos, setPagos] = useState<PagoMenor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<CategoriaType>('todas')

  // Selected receipt for preview/printing
  const [selectedReceipt, setSelectedReceipt] = useState<PagoMenor | null>(null)

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0])
  const [formConcepto, setFormConcepto] = useState('')
  const [formCategoria, setFormCategoria] = useState<PagoMenor['categoria']>('Acarreos')
  const [formBeneficiario, setFormBeneficiario] = useState('')
  const [formDoc, setFormDoc] = useState('')
  const [formMonto, setFormMonto] = useState('')
  const [formObservaciones, setFormObservaciones] = useState('')
  const [formComprobanteUrl, setFormComprobanteUrl] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.negocio_id) loadPagos()
  }, [profile])

  const loadPagos = async () => {
    setLoading(true)
    try {
      const data = await accountingService.getPagosMenores(profile!.negocio_id)
      setPagos(data)
    } catch (err: any) {
      toast(err.message || 'Error cargando pagos menores', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.negocio_id) return
    const montoNum = parseFloat(formMonto) || 0
    if (montoNum <= 0) {
      toast('El monto debe ser mayor a cero', { type: 'error' })
      return
    }

    setSaving(true)
    try {
      const payload: Omit<PagoMenor, 'id'> = {
        negocio_id: profile.negocio_id,
        tenant_id: profile.negocio_id,
        fecha: formFecha,
        concepto: formConcepto,
        categoria: formCategoria,
        beneficiario: formBeneficiario,
        documento_beneficiario: formDoc || undefined,
        monto: montoNum,
        comprobante_url: formComprobanteUrl || undefined,
        observaciones: formObservaciones || undefined
      }

      const created = await accountingService.addPagoMenor(payload)
      setPagos(prev => [created, ...prev])
      toast('Gasto de caja menor registrado', { type: 'success' })
      setModalOpen(false)
    } catch (err: any) {
      toast(err.message || 'Error al guardar pago', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro de pago menor?')) return
    try {
      await accountingService.deletePagoMenor(id)
      setPagos(prev => prev.filter(p => p.id !== id))
      toast('Pago menor eliminado', { type: 'success' })
    } catch (err: any) {
      toast(err.message || 'Error al eliminar', { type: 'error' })
    }
  }

  const getReceiptHtml = (item: PagoMenor): string => {
    const dateStr = item.fecha ? new Date(item.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'
    const code = (item.id || '').slice(0, 8).toUpperCase()
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante de Pago Menor #${code}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      color: #111827;
      background: #ffffff;
      padding: 24px;
    }
    .voucher-card {
      max-width: 580px;
      margin: 0 auto;
      border: 2px solid #1f2937;
      border-radius: 8px;
      padding: 24px;
    }
    .header {
      border-bottom: 2px dashed #9ca3af;
      padding-bottom: 16px;
      margin-bottom: 16px;
      text-align: center;
    }
    .header h1 {
      font-size: 16px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #111827;
    }
    .header h2 {
      font-size: 12px;
      font-weight: 600;
      color: #4b5563;
      margin-top: 4px;
      text-transform: uppercase;
    }
    .badge {
      display: inline-block;
      margin-top: 8px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      font-family: monospace;
    }
    .grid {
      display: table;
      width: 100%;
      margin-bottom: 16px;
    }
    .row {
      display: table-row;
    }
    .label {
      display: table-cell;
      width: 35%;
      padding: 6px 0;
      color: #6b7280;
      font-size: 12px;
      font-weight: 600;
      border-bottom: 1px solid #f3f4f6;
    }
    .value {
      display: table-cell;
      width: 65%;
      padding: 6px 0;
      color: #111827;
      font-size: 12px;
      font-weight: 500;
      border-bottom: 1px solid #f3f4f6;
    }
    .amount-box {
      background: #f9fafb;
      border: 1.5px solid #d1d5db;
      border-radius: 6px;
      padding: 12px;
      margin: 16px 0;
      text-align: center;
    }
    .amount-box .amount-label {
      font-size: 11px;
      font-weight: bold;
      color: #4b5563;
      text-transform: uppercase;
    }
    .amount-box .amount-val {
      font-size: 22px;
      font-weight: 800;
      font-family: monospace;
      color: #111827;
      margin-top: 2px;
    }
    .signatures {
      display: table;
      width: 100%;
      margin-top: 40px;
      padding-top: 20px;
    }
    .sig-cell {
      display: table-cell;
      width: 50%;
      text-align: center;
      padding: 0 16px;
    }
    .sig-line {
      border-top: 1px solid #374151;
      margin-bottom: 6px;
    }
    .sig-text {
      font-size: 11px;
      font-weight: 600;
      color: #4b5563;
    }
    .sig-sub {
      font-size: 10px;
      color: #9ca3af;
    }
    .footer {
      margin-top: 24px;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }
    @media print {
      body { padding: 0; }
      .voucher-card { border: 1.5px solid #000; }
    }
  </style>
</head>
<body>
  <div class="voucher-card">
    <div class="header">
      <h1>COMPROBANTE DE PAGO MENOR</h1>
      <h2>EGRESO DE CAJA / GASTO OPERATIVO</h2>
      <div class="badge">N° COMPROBANTE: #${code}</div>
    </div>

    <div class="grid">
      <div class="row">
        <div class="label">Fecha del Gasto:</div>
        <div class="value">${dateStr} (${item.fecha})</div>
      </div>
      <div class="row">
        <div class="label">Beneficiario / Proveedor:</div>
        <div class="value"><strong>${item.beneficiario}</strong></div>
      </div>
      <div class="row">
        <div class="label">Documento / Cédula:</div>
        <div class="value">${item.documento_beneficiario || 'No especificado'}</div>
      </div>
      <div class="row">
        <div class="label">Categoría:</div>
        <div class="value">${item.categoria}</div>
      </div>
      <div class="row">
        <div class="label">Concepto / Motivo:</div>
        <div class="value">${item.concepto}</div>
      </div>
      ${item.observaciones ? `
      <div class="row">
        <div class="label">Observaciones:</div>
        <div class="value">${item.observaciones}</div>
      </div>` : ''}
    </div>

    <div class="amount-box">
      <div class="amount-label">Monto Total Pagado</div>
      <div class="amount-val">${formatCOP(item.monto)}</div>
    </div>

    <div class="signatures">
      <div class="sig-cell">
        <div class="sig-line"></div>
        <div class="sig-text">Entregado / Autorizado</div>
        <div class="sig-sub">Cajero / Administrador</div>
      </div>
      <div class="sig-cell">
        <div class="sig-line"></div>
        <div class="sig-text">Recibido Conforme</div>
        <div class="sig-sub">${item.beneficiario}</div>
      </div>
    </div>

    <div class="footer">
      Soporte para libro fiscal y control interno de caja menor — Vendora POS
    </div>
  </div>
</body>
</html>`
  }

  const handlePrintReceipt = (item: PagoMenor) => {
    const html = getReceiptHtml(item)
    printHtmlDocument(html, `Recibo_Pago_Menor_${item.id.slice(0, 8)}`)
  }

  const handleDownloadReceipt = (item: PagoMenor) => {
    const html = getReceiptHtml(item)
    downloadHtmlDocument(html, `Recibo_Pago_Menor_${item.id.slice(0, 8)}.html`)
  }

  const filtered = useMemo(() => {
    return pagos.filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        p.concepto.toLowerCase().includes(q) ||
        p.beneficiario.toLowerCase().includes(q) ||
        (p.documento_beneficiario || '').includes(q)

      const matchCat = catFilter === 'todas' || p.categoria === catFilter
      return matchSearch && matchCat
    })
  }, [pagos, search, catFilter])

  const totalGastos = useMemo(() => filtered.reduce((s, p) => s + (Number(p.monto) || 0), 0), [filtered])

  const categoryBadge = (cat: PagoMenor['categoria']) => {
    const map: Record<string, { bg: string; text: string; icon: any }> = {
      Acarreos: { bg: 'bg-amber-50', text: 'text-amber-700', icon: Truck },
      Servicios: { bg: 'bg-blue-50', text: 'text-blue-700', icon: Sparkles },
      Mantenimiento: { bg: 'bg-purple-50', text: 'text-purple-700', icon: Wrench },
      Aseo: { bg: 'bg-teal-50', text: 'text-teal-700', icon: Sparkles },
      Suministros: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: ShoppingBag },
      Otros: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Tag }
    }
    const c = map[cat] || map.Otros
    const Icon = c.icon
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${c.bg} ${c.text}`}>
        <Icon size={10} />
        {cat}
      </span>
    )
  }

  if (loading) {
    return (
      <MainLayout title="Soportes de Pagos Menores">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Soportes de Pagos Menores">
      <div className="p-6 space-y-5 max-w-[1400px] mx-auto animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Soportes de Pagos Menores</h2>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full border border-gray-200">
                Caja Menor
              </span>
            </div>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Control ágil de gastos operativos cotidianos sin factura electrónica formal (acarreos, reparaciones, aseo)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFormFecha(new Date().toISOString().split('T')[0])
                setFormConcepto('')
                setFormCategoria('Acarreos')
                setFormBeneficiario('')
                setFormDoc('')
                setFormMonto('')
                setFormObservaciones('')
                setFormComprobanteUrl('')
                setModalOpen(true)
              }}
              className="px-3.5 h-8 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={13} />
              Registrar Pago Menor
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Total Pagos Menores
            </span>
            <p className="text-2xl font-bold font-mono text-gray-900">{formatCOP(totalGastos)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Egresos menores registrados en el periodo</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Número de Recibos
            </span>
            <p className="text-2xl font-bold font-mono text-gray-900">{filtered.length} comprobantes</p>
            <p className="text-[10px] text-gray-400 mt-1">Gastos con respaldo de recibo manual</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Promedio por Gasto
            </span>
            <p className="text-2xl font-bold font-mono text-gray-900">
              {filtered.length > 0 ? formatCOP(totalGastos / filtered.length) : '$0'}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">Gasto unitario promedio de caja</p>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por concepto o beneficiario..."
                className="w-full h-8 pl-8 pr-8 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-xl">
              {([
                { key: 'todas', label: 'Todas' },
                { key: 'Acarreos', label: 'Acarreos' },
                { key: 'Mantenimiento', label: 'Mantenimiento' },
                { key: 'Suministros', label: 'Suministros' },
                { key: 'Aseo', label: 'Aseo' },
                { key: 'Servicios', label: 'Servicios' }
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setCatFilter(key)}
                  className={[
                    'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0',
                    catFilter === key
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
            {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Table of Minor Payments */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 space-y-2 shadow-xs">
            <Coins size={28} className="mx-auto text-gray-300 mb-1" />
            <p className="text-[13px] font-bold text-gray-700">Sin pagos menores registrados</p>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Lleva el control de caja menor registrando acarreos, transportes y compras locales informales.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[580px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-28">Fecha</th>
                    <th className="px-4 py-3 w-36">Categoría</th>
                    <th className="px-4 py-3">Concepto / Detalle</th>
                    <th className="px-4 py-3 w-48">Beneficiario</th>
                    <th className="px-4 py-3 text-right w-36">Monto COP</th>
                    <th className="px-4 py-3 text-center w-28">Soporte</th>
                    <th className="px-4 py-3 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[12px] text-gray-700">
                  {filtered.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-gray-800">{item.fecha}</td>
                      <td className="px-4 py-3">{categoryBadge(item.categoria)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div>{item.concepto}</div>
                        {item.observaciones && (
                          <p className="text-[10px] text-gray-400 font-normal truncate max-w-xs">{item.observaciones}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-800">
                        <div className="font-semibold">{item.beneficiario}</div>
                        {item.documento_beneficiario && (
                          <span className="text-[10px] font-mono text-gray-400 block">{item.documento_beneficiario}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-950">
                        {formatCOP(item.monto)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedReceipt(item)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors border border-gray-200"
                          title="Ver e imprimir comprobante"
                        >
                          <Receipt size={12} />
                          Ver Recibo
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Eliminar pago"
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

        {/* Modal Registrar Pago Menor */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">Registrar Pago Menor (Caja)</h3>
                  <p className="text-[11px] text-gray-400">Gastos informales u operativos sin factura electrónica</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div className="p-5 space-y-3.5 text-[12px]">
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Fecha</label>
                      <input
                        type="date"
                        required
                        value={formFecha}
                        onChange={e => setFormFecha(e.target.value)}
                        className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Categoría</label>
                      <select
                        value={formCategoria}
                        onChange={e => setFormCategoria(e.target.value as any)}
                        className="w-full h-8 px-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white font-medium"
                      >
                        <option value="Acarreos">Acarreos / Fletes</option>
                        <option value="Servicios">Servicios Informales</option>
                        <option value="Mantenimiento">Mantenimiento</option>
                        <option value="Aseo">Aseo y Cafetería</option>
                        <option value="Suministros">Suministros Locales</option>
                        <option value="Otros">Otros Gastos</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Concepto del Gasto</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Acarreo de bultos / Reparación llave de agua..."
                      value={formConcepto}
                      onChange={e => setFormConcepto(e.target.value)}
                      className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Beneficiario / Proveedor</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Jorge Domiciliario"
                        value={formBeneficiario}
                        onChange={e => setFormBeneficiario(e.target.value)}
                        className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Cédula / Documento (Opc.)</label>
                      <input
                        type="text"
                        placeholder="Ej: 1.067.892.110"
                        value={formDoc}
                        onChange={e => setFormDoc(e.target.value)}
                        className="w-full h-8 px-2.5 font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Monto Pagado COP ($)</label>
                    <input
                      type="number"
                      required
                      placeholder="Ej: 25000"
                      value={formMonto}
                      onChange={e => setFormMonto(e.target.value)}
                      className="w-full h-8 px-2.5 font-mono font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Observaciones (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Detalles sobre el pago o comprobante..."
                      value={formObservaciones}
                      onChange={e => setFormObservaciones(e.target.value)}
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
                    {saving ? 'Guardando...' : 'Guardar Gasto'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* Modal Vista Previa de Recibo */}
        {selectedReceipt && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center">
                    <Receipt size={16} />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900">Comprobante de Pago Menor</h3>
                    <p className="text-[11px] font-mono text-gray-500">#{selectedReceipt.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedReceipt(null)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 space-y-2.5 text-[12px]">
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Fecha:</span>
                    <span className="font-mono font-semibold text-gray-900">{selectedReceipt.fecha}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Beneficiario:</span>
                    <span className="font-semibold text-gray-900">{selectedReceipt.beneficiario}</span>
                  </div>
                  {selectedReceipt.documento_beneficiario && (
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500 font-medium">Documento / Cédula:</span>
                      <span className="font-mono text-gray-700">{selectedReceipt.documento_beneficiario}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Categoría:</span>
                    <span>{categoryBadge(selectedReceipt.categoria)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200/60">
                    <span className="text-gray-500 font-medium">Concepto:</span>
                    <span className="font-medium text-gray-900 text-right max-w-[65%]">{selectedReceipt.concepto}</span>
                  </div>
                  {selectedReceipt.observaciones && (
                    <div className="flex justify-between py-1 border-b border-gray-200/60">
                      <span className="text-gray-500 font-medium">Observaciones:</span>
                      <span className="text-gray-600 text-right max-w-[65%]">{selectedReceipt.observaciones}</span>
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Monto Entregado</span>
                  <span className="text-2xl font-black font-mono text-emerald-950 block mt-0.5">{formatCOP(selectedReceipt.monto)}</span>
                </div>
              </div>

              <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="px-3.5 h-8 border border-gray-200 hover:bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-lg transition-colors"
                >
                  Cerrar
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadReceipt(selectedReceipt)}
                    className="px-3 h-8 border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 text-blue-700 text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Download size={12} />
                    Descargar HTML
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePrintReceipt(selectedReceipt)}
                    className="px-4 h-8 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Printer size={12} />
                    Imprimir Comprobante
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  )
}
