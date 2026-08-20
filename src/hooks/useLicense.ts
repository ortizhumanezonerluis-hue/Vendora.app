import { useState, useEffect } from 'react'
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
  const [plan, setPlan] = useState<PlanType>('pro')
  const [licenciaActiva, setLicenciaActiva] = useState(true)
  const [cliente, setCliente] = useState<VendoraCliente | null>(null)
  const [loading, setLoading] = useState(true)

  const email = profile?.email || user?.email

  useEffect(() => {
    let isMounted = true

    async function loadLicense() {
      if (!email && !profile?.negocio_id) {
        setLoading(false)
        return
      }

      try {
        const res = await adminService.getLicenseForBusiness(email, profile?.negocio_id || undefined)
        if (isMounted) {
          setPlan(res.plan)
          setLicenciaActiva(res.licenciaActiva)
          setCliente(res.cliente)
        }
      } catch (err) {
        console.warn('Error cargando licencia:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadLicense()

    // Realtime listener for instant plan/status changes from Admin Panel
    const channel = supabase
      .channel('vendora-licencia-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vendora_clientes' },
        (payload: any) => {
          const updated = payload.new as VendoraCliente
          if (updated && (updated.email_acceso === email || updated.negocio_id === profile?.negocio_id)) {
            setPlan(updated.plan)
            setLicenciaActiva(Boolean(updated.licencia_activa && updated.estado === 'activo'))
            setCliente(updated)
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
