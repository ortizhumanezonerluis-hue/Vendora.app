import { createClient } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

// Isolated client without persistent session storage to create employees without overriding admin session
const resolvedUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const resolvedKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

const secondaryAuthClient = createClient(resolvedUrl, resolvedKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

export const authService = {
  async signIn(email: string, password: string) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('Usuario no encontrado')

    // Fetch user profile — includes negocio_id for tenant isolation
    const { data: profile, error: profileError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (profileError) throw profileError

    if (!profile) {
      throw new Error('No se encontró el perfil del usuario. Verifica tus credenciales.')
    }

    if (profile.estado === 'inactivo') {
      await supabase.auth.signOut()
      throw new Error('Tu cuenta está inactiva. Contacta a un administrador.')
    }

    // Update online status in vendora_clientes
    try {
      await supabase
        .from('vendora_clientes')
        .update({
          online_ahora: true,
          ultima_conexion: new Date().toISOString()
        })
        .or(`email_acceso.eq.${email},negocio_id.eq.${profile.negocio_id || ''}`)
    } catch (_) {}

    return { user: authData.user, profile }
  },

  /**
   * Registers a completely NEW business (tenant).
   * Creates: negocio → admin usuario → configuracion_negocio
   * Completely isolated from other tenants.
   */
  async signUpAdmin(
    email: string,
    password: string,
    nombre: string,
    businessName: string,
    direccion: string
  ) {
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      throw new Error('Este correo electrónico ya está registrado. Inicia sesión con tus credenciales.')
    }

    // Step 1: Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, rol: 'admin' }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('No se pudo crear el usuario')

    // Check once more to ensure auth signUp didn't trigger a duplicate profile
    const { data: existingAfterAuth } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (existingAfterAuth) {
      return { user: authData.user, profile: existingAfterAuth }
    }

    // Step 2: Create the NEGOCIO (tenant anchor) for this new business
    const { data: negocio, error: negocioError } = await supabase
      .from('negocios')
      .insert([{ nombre: businessName }])
      .select()
      .single()

    if (negocioError) throw negocioError

    const negocioId = negocio.id

    // Step 3: Create the user profile row linking them as admin to their negocio
    const { data: profile, error: profileError } = await supabase
      .from('usuarios')
      .insert([{
        nombre,
        email,
        rol: 'admin',
        estado: 'activo',
        negocio_id: negocioId
      }])
      .select()
      .single()

    if (profileError) throw profileError

    // Step 4: Create default configuration for this store
    try {
      await supabase
        .from('configuracion_negocio')
        .insert([{
          nombre: businessName,
          direccion: direccion || '',
          stock_minimo_alerta: 10,
          negocio_id: negocioId
        }])
    } catch (err) {
      console.warn('No se pudo guardar la configuración del negocio:', err)
    }

    // Step 5: Register store into master licenses table
    try {
      await supabase
        .from('vendora_clientes')
        .insert([{
          negocio_id: negocioId,
          nombre_comercio: businessName,
          nombre_dueno: nombre,
          email_acceso: email,
          plan: 'sin_licencia',
          licencia_activa: false,
          estado: 'pendiente',
          online_ahora: true,
          ultima_conexion: new Date().toISOString()
        }])
    } catch (_) {}

    return { user: authData.user, profile: { ...profile, negocio_id: negocioId } }
  },

  /**
   * Creates an employee that belongs to the SAME negocio as the creating admin.
   * Uses secondary isolated client so admin is NOT logged out / autologged in as employee.
   */
  async createEmployee(
    email: string,
    password: string,
    nombre: string,
    rol: 'admin' | 'empleado',
    negocioId: string
  ) {
    if (!negocioId) {
      throw new Error('Identificador de negocio inválido')
    }

    // Step 1: Create auth credentials on secondary client (does NOT touch admin session)
    try {
      await secondaryAuthClient.auth.signUp({
        email,
        password,
        options: {
          data: { nombre, rol }
        }
      })
    } catch (authErr: any) {
      console.warn('Error en secondary auth signup:', authErr)
    }

    // Step 2: Ensure profile is created strictly linked to the current store
    const { data: profile, error: profileError } = await supabase
      .from('usuarios')
      .insert([{
        nombre,
        email,
        rol,
        estado: 'activo',
        negocio_id: negocioId
      }])
      .select()
      .single()

    if (profileError) throw profileError
    return profile
  },

  async updateProfile(id: string, updates: any) {
    const { data, error } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async signOut() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        await supabase
          .from('vendora_clientes')
          .update({ online_ahora: false, ultima_conexion: new Date().toISOString() })
          .eq('email_acceso', user.email)
      }
    } catch (_) {}

    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}
