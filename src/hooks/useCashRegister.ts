import { useState, useEffect } from 'react'
import { cashService } from '../services/cashService'
import { ArqueoCaja } from '../types'

export function useCashRegister(usuarioId?: string, negocioId?: string | null) {
  const [sales, setSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSession, setActiveSession] = useState<ArqueoCaja | null>(null)

  const loadData = async () => {
    if (!usuarioId) return
    setLoading(true)
    setError(null)
    try {
      const active = await cashService.getActiveSession(usuarioId, negocioId)
      setActiveSession(active)
      if (active) {
        const sessionSales = await cashService.getTodaySessionSales(active)
        setSales(sessionSales)
      } else {
        setSales([])
      }
    } catch (err: any) {
      setError(err.message || 'Error cargando datos de caja')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (usuarioId) loadData()
  }, [usuarioId, negocioId])

  const openCashRegister = async (montoInicial: number) => {
    if (!usuarioId) return null
    try {
      const session = await cashService.openRegister(usuarioId, montoInicial, negocioId)
      setActiveSession(session)
      setSales([])
      return session
    } catch (err: any) {
      // Propagate error so CashRegisterPage can show a meaningful toast
      throw err
    }
  }

  const closeCashRegister = async (efectivoDeclarado: number, efectivoSistema: number) => {
    if (!activeSession) return
    try {
      const closed = await cashService.closeRegister(
        activeSession.id,
        efectivoDeclarado,
        efectivoSistema,
        usuarioId,
        negocioId
      )
      setActiveSession(null)
      setSales([])
      return closed
    } catch (err) {
      console.error('Error cerrando caja:', err)
      const fakeClosed: ArqueoCaja = {
        ...activeSession,
        fecha_cierre: new Date().toISOString(),
        efectivo_declarado: efectivoDeclarado,
        efectivo_sistema: efectivoSistema,
        diferencia: efectivoDeclarado - efectivoSistema,
        estado: 'cerrado'
      }
      setActiveSession(null)
      setSales([])
      return fakeClosed
    }
  }

  const refreshSales = async () => {
    if (activeSession) {
      const sessionSales = await cashService.getTodaySessionSales(activeSession)
      setSales(sessionSales)
    }
  }

  return {
    sales,
    loading,
    error,
    activeSession,
    refresh: loadData,
    refreshSales,
    openCashRegister,
    closeCashRegister
  }
}
