import { supabase } from '../lib/supabaseClient'

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
    // Check if the user profile already exists in the custom 'usuarios' table
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

    // Check once more to ensure auth signUp didn't trigger a duplicate profile trigger
    const { data: existingAfterAuth } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (existingAfterAuth) {
      // Profile was already created (e.g. by a database trigger or concurrent request)
      // Just return it
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

    // Step 3: Create admin profile linked to THIS negocio
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

    if (profileError) {
      // If profile insert failed but auth succeeded, clean up to allow retry
      console.error('Error creating profile:', profileError)
      throw profileError
    }

    // Step 4: Create business configuration scoped to this negocio
    try {
      await supabase
        .from('configuracion_negocio')
        .insert([{
          nombre: businessName,
          direccion,
          rfc: 'PROV000000000',
          stock_minimo_alerta: 10,
          negocio_id: negocioId
        }])
    } catch (err) {
      console.warn('No se pudo guardar la configuración del negocio:', err)
    }

    return { user: authData.user, profile: { ...profile, negocio_id: negocioId } }
  },

  /**
   * Creates an employee that belongs to the SAME negocio as the creating admin.
   * Admin's negocio_id is passed in explicitly.
   */
  async createEmployee(
    email: string,
    password: string,
    nombre: string,
    rol: 'admin' | 'empleado',
    negocioId: string
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, rol }
      }
    })

    if (error) throw error

    // Employee is linked to the SAME negocio as the admin
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
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }
}
