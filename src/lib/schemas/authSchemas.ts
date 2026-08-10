import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export const createUserSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z.string().min(6, 'La contraseña inicial debe tener al menos 6 caracteres'),
  rol: z.enum(['admin', 'empleado'], {
    errorMap: () => ({ message: 'El rol debe ser admin o empleado' })
  })
})

export const registerBusinessSchema = z.object({
  nombre: z.string().min(3, 'El nombre completo debe tener al menos 3 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  businessName: z.string().min(2, 'El nombre del negocio debe tener al menos 2 caracteres'),
  direccion: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string().min(6, 'Debes confirmar tu contraseña')
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
})
