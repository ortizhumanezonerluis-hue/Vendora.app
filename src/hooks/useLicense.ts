import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../components/auth/AuthContext'
import { adminService, PlanType, VendoraCliente } from '../services/adminService'
import { supabase } from '../lib/supabaseClient'

export type LockReason = 'none' | 'suspended' | 'mora' | 'unlicensed' | 'expired_lease' | 'inactive_user'

export interface LicensePermissions {
  plan: PlanType
  licenciaActiva: boolean
  isStarter: boolean
  isPro: boolean
  isMax: boolean
  isSinLicencia: boolean
  canAccessPurchasing: boolean
  canAccessLogs: boolean
  canManageEmployees: boolean
  canAccessAccounting: boolean
  maxProviders: number
  cliente: VendoraCliente | null
  loading: boolean
  lockReason: LockReason
  fechaCorte?: string
  diasRestantes?: number
}

// Días de gracia permitidos después de la fecha de corte antes de bloquear en offline
const OFFLINE_GRACE_DAYS = 3
// Máximo de días consecutivos que la app puede operar offline sin conectarse a validar licencia
const MAX_OFFLINE_DAYS = 15

function computeDaysDiff(targetDateStr?: string): number {
  if (!targetDateStr) return 999
  const target = new Date(targetDateStr).getTime()
  const now = new Date().setHours(0, 0, 0, 0)
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}

export function useLicense(): LicensePermissions {
  const { profile, user } = useAuth()
  const email = profile?.email || user?.email

  // 1. Initial State from Cache (Synchronous to avoid flickering)
  const cachedPlan = (localStorage.getItem('vendora_cached_plan') as PlanType) || 'max'
  const cachedActiveStr = localStorage.getItem('vendora_cached_licencia')
  const cachedLockReason = (localStorage.getItem('vendora_cached_lock_reason') as LockReason) || 'none'
  const cachedFechaCorte = localStorage.getItem('vendora_cached_fecha_corte') || undefined
  const cachedLastOnline = localStorage.getItem('vendora_cached_last_online')
  const cachedEstado = localStorage.getItem('vendora_cached_estado')

  let initialActive = cachedActiveStr !== 'false'
  let initialLockReason: LockReason = cachedLockReason

  // If cached as suspended/mora/inactivo, immediately lock
  if (cachedActiveStr === 'false' || cachedEstado === 'suspendido' || cachedEstado === 'mora') {
    initialActive = false
    initialLockReason = (cachedEstado === 'mora' ? 'mora' : 'suspended') as LockReason
  } else if (cachedActiveStr === 'true' && !navigator.onLine) {
    // Offline Lease Verification: check expiration and grace period
    if (cachedFechaCorte) {
      const daysUntilCut = computeDaysDiff(cachedFechaCorte)
      if (daysUntilCut < -OFFLINE_GRACE_DAYS) {
        initialActive = false
        initialLockReason = 'expired_lease'
      }
    }
    if (cachedLastOnline) {
      const daysSinceOnline = (Date.now() - new Date(cachedLastOnline).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceOnline > MAX_OFFLINE_DAYS) {
        initialActive = false
        initialLockReason = 'expired_lease'
      }
    }
  }

  const [plan, setPlan] = useState<PlanType>(cachedPlan)
  const [licenciaActiva, setLicenciaActiva] = useState(initialActive)
  const [lockReason, setLockReason] = useState<LockReason>(initialLockReason)
  const [fechaCorte, setFechaCorte] = useState<string | undefined>(cachedFechaCorte)
  const [cliente, setCliente] = useState<VendoraCliente | null>(() => {
    try {
      const raw = localStorage.getItem('vendora_cached_cliente')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)

  const channelName = useRef(`vendora-licencia-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    let isMounted = true

    async function evaluateLicense() {
      // Offline Check
      if (!navigator.onLine) {
        const isLocallySuspended =
          localStorage.getItem('vendora_cached_licencia') === 'false' ||
          localStorage.getItem('vendora_cached_estado') === 'suspendido'

        if (isLocallySuspended) {
          if (isMounted) {
            setLicenciaActiva(false)
            setLockReason('suspended')
          }
          return
        }

        const savedCut = localStorage.getItem('vendora_cached_fecha_corte')
        if (savedCut) {
          const days = computeDaysDiff(savedCut)
          if (days < -OFFLINE_GRACE_DAYS) {
            if (isMounted) {
              setLicenciaActiva(false)
              setLockReason('expired_lease')
            }
            return
          }
        }
        return
      }

      // Online Check
      if (!email && !profile?.negocio_id) return

      try {
        setLoading(true)

        // 1. Query client license in admin table
        const res = await adminService.getLicenseForBusiness(email, profile?.negocio_id || undefined)

        // 2. Query user profile status directly
        let isUserInactive = false
        try {
          if (profile?.id) {
            const { data: userData } = await supabase
              .from('usuarios')
              .select('estado')
              .eq('id', profile.id)
              .maybeSingle()
            if (userData && userData.estado === 'inactivo') {
              isUserInactive = true
            }
          }
        } catch (_) {}

        if (!isMounted) return

        if (isUserInactive) {
          setLicenciaActiva(false)
          setLockReason('inactive_user')
          localStorage.setItem('vendora_cached_licencia', 'false')
          localStorage.setItem('vendora_cached_lock_reason', 'inactive_user')
          localStorage.setItem('vendora_cached_estado', 'suspendido')
          return
        }

        if (res) {
          const clientData = res.cliente
          const isSuspended =
            !res.licenciaActiva ||
            clientData?.estado === 'suspendido' ||
            clientData?.licencia_activa === false
          const isMora = clientData?.estado === 'mora'
          const isUnlicensed = res.plan === 'sin_licencia' || clientData?.estado === 'pendiente'

          if (isSuspended || isMora || isUnlicensed) {
            const reason: LockReason = isSuspended ? 'suspended' : isMora ? 'mora' : 'unlicensed'
            setPlan(res.plan)
            setLicenciaActiva(false)
            setLockReason(reason)
            setCliente(clientData)
            setFechaCorte(clientData?.fecha_corte)

            localStorage.setItem('vendora_cached_licencia', 'false')
            localStorage.setItem('vendora_cached_lock_reason', reason)
            localStorage.setItem('vendora_cached_estado', clientData?.estado || 'suspendido')
            localStorage.setItem('vendora_cached_plan', res.plan)
            if (clientData) {
              localStorage.setItem('vendora_cached_cliente', JSON.stringify(clientData))
            }
          } else {
            // Active valid license
            setPlan(res.plan)
            setLicenciaActiva(true)
            setLockReason('none')
            setCliente(clientData)
            setFechaCorte(clientData?.fecha_corte)

            localStorage.setItem('vendora_cached_licencia', 'true')
            localStorage.setItem('vendora_cached_lock_reason', 'none')
            localStorage.setItem('vendora_cached_estado', 'activo')
            localStorage.setItem('vendora_cached_plan', res.plan)
            localStorage.setItem('vendora_cached_last_online', new Date().toISOString())
            if (clientData?.fecha_corte) {
              localStorage.setItem('vendora_cached_fecha_corte', clientData.fecha_corte)
            }
            if (clientData) {
              localStorage.setItem('vendora_cached_cliente', JSON.stringify(clientData))
            }
          }
        }
      } catch (err) {
        console.warn('Error verificando licencia:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    evaluateLicense()

    // 3. Real-time WebSocket listener (Immediate lock/unlock upon Admin switch toggle)
    const channel = supabase
      .channel(channelName.current)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendora_clientes' },
        (payload: any) => {
          const updated = payload.new as VendoraCliente
          if (
            updated &&
            (updated.email_acceso?.toLowerCase() === email?.toLowerCase() ||
              (profile?.negocio_id && updated.negocio_id === profile.negocio_id))
          ) {
            const active = Boolean(updated.licencia_activa && updated.estado === 'activo')
            const reason: LockReason = !active
              ? updated.estado === 'mora'
                ? 'mora'
                : updated.estado === 'pendiente'
                ? 'unlicensed'
                : 'suspended'
              : 'none'

            setPlan(updated.plan)
            setLicenciaActiva(active)
            setLockReason(reason)
            setCliente(updated)
            setFechaCorte(updated.fecha_corte)

            localStorage.setItem('vendora_cached_licencia', String(active))
            localStorage.setItem('vendora_cached_lock_reason', reason)
            localStorage.setItem('vendora_cached_estado', updated.estado)
            localStorage.setItem('vendora_cached_plan', updated.plan)
            localStorage.setItem('vendora_cached_cliente', JSON.stringify(updated))
            if (updated.fecha_corte) {
              localStorage.setItem('vendora_cached_fecha_corte', updated.fecha_corte)
            }
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [email, profile?.negocio_id, profile?.id])

  const isStarter = plan === 'starter'
  const isPro = plan === 'pro'
  const isMax = plan === 'max'
  const isSinLicencia = plan === 'sin_licencia' || !licenciaActiva || lockReason !== 'none'
  const diasRestantes = fechaCorte ? computeDaysDiff(fechaCorte) : undefined

  return {
    plan,
    licenciaActiva: licenciaActiva && lockReason === 'none',
    isStarter,
    isPro,
    isMax,
    isSinLicencia,
    canAccessPurchasing: (isPro || isMax) && !isSinLicencia,
    canAccessLogs: (isPro || isMax) && !isSinLicencia,
    canManageEmployees: (isPro || isMax) && !isSinLicencia,
    canAccessAccounting: isMax && !isSinLicencia,
    maxProviders: isStarter ? 6 : Infinity,
    cliente,
    loading,
    lockReason,
    fechaCorte,
    diasRestantes
  }
}
