import { useState, useMemo, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { auditService } from '../services/auditService'
import { useAuth } from '../components/auth/AuthContext'
import { AuditLog } from '../types'
import { Select } from '../components/ui/Select'
import { SkeletonPage } from '../components/ui/Skeleton'
import { Search, Info, AlertTriangle, AlertOctagon, Filter } from 'lucide-react'

const SEVERITY_CONFIG = {
  info: { label: 'Info', icon: Info, className: 'bg-gray-100 text-gray-600', rowClass: '' },
  warning: { label: 'Advertencia', icon: AlertTriangle, className: 'bg-amber-50 text-amber-700', rowClass: 'bg-amber-50/30' },
  critical: { label: 'Crítico', icon: AlertOctagon, className: 'bg-red-50 text-red-600', rowClass: 'bg-red-50/30' },
}

export default function AuditLogsPage() {
  const { profile } = useAuth()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  useEffect(() => {
    async function fetchLogs() {
      if (!profile) return
      try {
        const data = await auditService.getAuditLogs(profile.negocio_id)
        setLogs(data || [])
      } catch (err: any) {
        console.error('Error al cargar logs de Supabase:', err)
        setError(err.message || 'Error cargando logs')
        setLogs([])
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [profile])

  // Restrict to current user's logs if employee
  const scopedLogs = useMemo(() => {
    if (!profile) return []
    if (profile.rol === 'empleado') {
      return logs.filter((l) => l.user === profile.nombre)
    }
    return logs
  }, [logs, profile])

  const filtered = useMemo(() =>
    scopedLogs.filter((log) => {
      const matchSeverity = severityFilter === 'all' || log.severity === severityFilter
      const matchSearch =
        search === '' ||
        log.user.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.detail.toLowerCase().includes(search.toLowerCase())
      return matchSeverity && matchSearch
    }),
    [scopedLogs, search, severityFilter]
  )

  if (loading) {
    return (
      <MainLayout title="Logs de Auditoría">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Logs de Auditoría">
      <div className="p-5 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-[12px] rounded-lg border border-red-100">
            {error}
          </div>
        )}

        {/* Severity summary */}
        <div className="grid grid-cols-3 gap-3">
          {(['info', 'warning', 'critical'] as const).map((sev) => {
            const cfg = SEVERITY_CONFIG[sev]
            const Icon = cfg.icon
            const count = scopedLogs.filter((l) => l.severity === sev).length
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(severityFilter === sev ? 'all' : sev)}
                className={[
                  'bg-white border rounded-lg px-4 py-3 text-left transition-all',
                  severityFilter === sev ? 'border-gray-900 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                ].join(' ')}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={13} className={sev === 'info' ? 'text-gray-400' : sev === 'warning' ? 'text-amber-500' : 'text-red-500'} />
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{cfg.label}</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900 font-mono">{loading ? '...' : count}</p>
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por usuario, acción o detalle..."
                className="w-full h-8 pl-8 pr-3 text-[13px] border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Filter size={13} className="text-gray-400" />
              <Select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="h-8 w-40"
              >
                <option value="all">Todos los niveles</option>
                <option value="info">Info</option>
                <option value="warning">Advertencia</option>
                <option value="critical">Crítico</option>
              </Select>
            </div>
            <span className="text-[12px] text-gray-400 ml-auto">{filtered.length} eventos</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Fecha / Hora', 'Usuario', 'Acción', 'Detalle', 'Nivel'].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-gray-400">
                      Cargando logs de auditoría...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-gray-400">
                      Sin eventos encontrados
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => {
                    const cfg = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info
                    const Icon = cfg.icon
                    return (
                      <tr key={log.id} className={`hover:bg-gray-50 transition-colors ${cfg.rowClass}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-gray-400">
                            {new Date(log.date).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-semibold text-gray-500">
                              {log.user.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <span className="text-[12px] font-medium text-gray-700">{log.user}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[12px] font-medium text-gray-900">{log.action}</span>
                        </td>
                        <td className="px-4 py-3 max-w-sm">
                          <span className="text-[12px] text-gray-500 line-clamp-2">{log.detail}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${cfg.className}`}>
                            <Icon size={10} />
                            {cfg.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
