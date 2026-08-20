import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../components/auth/AuthContext'
import { adminService, PlanType, VendoraCliente } from '../services/adminService'
import { supabase } from '../lib/supabaseClient'

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
}

export function useLicense(): LicensePermissions {
  const { profile, user } = useAuth()
  const email = profile?.email || user?.email

  // Read instant cache to completely avoid "PRO" or incorrect plan flickering during navigation
  const cachedPlan = (localStorage.getItem('vendora_cached_plan') as PlanType) || 'pro'
  const cachedActive = localStorage.getItem('vendora_cached_licencia') !== 'false'

  const [plan, setPlan] = useState<PlanType>(cachedPlan)
  const [licenciaActiva, setLicenciaActiva] = useState(cachedActive)
  const [cliente, setCliente] = useState<VendoraCliente | null>(null)
  const [loading, setLoading] = useState(false)

  // Unique channel name per instance to avoid Supabase "cannot add callbacks after subscribe()" error
  const channelName = useRef(`vendora-licencia-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    let isMounted = true

    async function loadLicense() {
      if (!email && !profile?.negocio_id) return

      try {
        const res = await adminService.getLicenseForBusiness(email, profile?.negocio_id || undefined)
        if (isMounted && res) {
          setPlan(res.plan)
          setLicenciaActiva(res.licenciaActiva)
          setCliente(res.cliente)
          localStorage.setItem('vendora_cached_plan', res.plan)
          localStorage.setItem('vendora_cached_licencia', String(res.licenciaActiva))
        }
      } catch (err) {
        console.warn('Error cargando licencia:', err)
      }
    }

    loadLicense()

    // Realtime listener for instant plan/status changes from Admin Panel
    const channel = supabase
      .channel(channelName.current)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendora_clientes' },
        (payload: any) => {
          const updated = payload.new as VendoraCliente
          if (updated && (updated.email_acceso === email || (profile?.negocio_id && updated.negocio_id === profile.negocio_id))) {
            const active = Boolean(updated.licencia_activa && updated.estado === 'activo')
            setPlan(updated.plan)
            setLicenciaActiva(active)
            setCliente(updated)
            localStorage.setItem('vendora_cached_plan', updated.plan)
            localStorage.setItem('vendora_cached_licencia', String(active))
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [email, profile?.negocio_id])

  const isStarter = plan === 'starter'
  const isPro = plan === 'pro'
  const isMax = plan === 'max'
  const isSinLicencia = plan === 'sin_licencia' || !licenciaActiva

  return {
    plan,
    licenciaActiva,
    isStarter,
    isPro,
    isMax,
    isSinLicencia,
    canAccessPurchasing: isPro || isMax,
    canAccessLogs: isPro || isMax,
    canManageEmployees: isPro || isMax,
    canAccessAccounting: isMax,
    maxProviders: isStarter ? 6 : Infinity,
    cliente,
    loading
  }
}
