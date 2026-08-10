import { SesionAuditoria } from '../../services/auditSessionService'
import { formatCOP } from '../../lib/utils'
import { ClipboardList, Play, CheckCircle, Trash2 } from 'lucide-react'

interface AuditTableProps {
  sessions: SesionAuditoria[]
  onSelect: (session: SesionAuditoria) => void
  onDelete: (id: string) => void
  isAdmin: boolean
}

export default function AuditTable({ sessions, onSelect, onDelete, isAdmin }: AuditTableProps) {
  if (sessions.length === 0) {
    return (
      <div className="h-64 border border-gray-200 border-dashed rounded-xl bg-white flex flex-col items-center justify-center text-center p-6">
        <ClipboardList size={32} className="text-gray-300 mb-2.5" />
        <p className="text-[13px] font-semibold text-gray-700">Sin sesiones de auditoría</p>
        <p className="text-[11px] text-gray-400 mt-0.5 max-w-xs">
          Haz clic en "+ Nueva Auditoría" para iniciar tu primer conteo físico e inventariado.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-150 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3">Código / Sesión</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Responsable</th>
              <th className="px-5 py-3 text-center">Items</th>
              <th className="px-5 py-3 text-right">Diferencia Total</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-[12px] text-gray-700">
            {sessions.map((session) => {
              const dateLabel = session.fecha
                ? new Date(session.fecha).toLocaleDateString('es-CO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : '—'

              const isCompleted = session.estado === 'completada'

              return (
                <tr key={session.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-bold text-gray-900 text-[13px]">{session.nombre}</p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">#{session.id?.slice(0, 8)}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{dateLabel}</td>
                  <td className="px-5 py-3.5 font-medium">{session.responsable}</td>
                  <td className="px-5 py-3.5 text-center font-mono font-bold text-gray-600">
                    {session.items_count}
                  </td>
                  <td className={`px-5 py-3.5 text-right font-mono font-bold ${
                    session.diferencia_total < 0
                      ? 'text-red-650'
                      : session.diferencia_total > 0
                      ? 'text-emerald-650'
                      : 'text-gray-900'
                  }`}>
                    {formatCOP(session.diferencia_total)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={[
                      'px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1',
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700 animate-pulse'
                    ].join(' ')}>
                      {isCompleted ? (
                        <>
                          <CheckCircle size={10} />
                          Completada
                        </>
                      ) : (
                        <>
                          <Play size={10} className="fill-current" />
                          En Proceso
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onSelect(session)}
                        className={[
                          'px-2.5 py-1 text-[11px] font-bold border rounded-lg transition-colors',
                          isCompleted
                            ? 'border-gray-200 hover:bg-gray-50 text-gray-700'
                            : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-800'
                        ].join(' ')}
                      >
                        {isCompleted ? 'Ver Reporte' : 'Retomar Conteo'}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => onDelete(session.id!)}
                          title="Eliminar sesión de auditoría"
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
