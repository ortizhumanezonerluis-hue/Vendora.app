import { useState } from 'react'
import { useAuth } from '../components/auth/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { loginSchema, registerBusinessSchema } from '../lib/schemas/authSchemas'
import { adminService } from '../services/adminService'
import { Store } from 'lucide-react'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isRegister, setIsRegister] = useState(false)

  // Fields
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [direccion, setDireccion] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const from = (location.state as any)?.from?.pathname || '/pos'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)
    setFieldErrors({})
    setLoading(true)

    try {
      if (isRegister) {
        const result = registerBusinessSchema.safeParse({
          nombre, email, businessName, direccion, password, confirmPassword
        })
        if (!result.success) {
          const errors: Record<string, string> = {}
          const issues = (result.error as any).issues || (result.error as any).errors || []
          issues.forEach((err: any) => {
            if (err.path[0]) errors[err.path[0] as string] = err.message
          })
          setFieldErrors(errors)
          setLoading(false)
          return
        }
        await signUp(email, password, nombre, businessName, direccion)
      } else {

        const result = loginSchema.safeParse({ email, password })
        if (!result.success) {
          const errors: Record<string, string> = {}
          const issues = (result.error as any).issues || (result.error as any).errors || []
          issues.forEach((err: any) => {
            if (err.path[0]) errors[err.path[0] as string] = err.message
          })
          setFieldErrors(errors)
          setLoading(false)
          return
        }
        await signIn(email, password)
      }
      navigate(from, { replace: true })
    } catch (err: any) {
      const msg = err?.message || ''
      if (msg.includes('Invalid login credentials')) {
        setValidationError('Correo o contraseña incorrectos. ¿Aún no tienes cuenta? Regístrala.')
      } else if (msg.includes('User already registered')) {
        setValidationError('Este correo ya está registrado. Inicia sesión con tus credenciales.')
      } else {
        setValidationError(msg || 'Ocurrió un error inesperado')
      }
    } finally {
      setLoading(false)
    }
  }

  const field = (
    label: string,
    id: string,
    value: string,
    setter: (v: string) => void,
    type = 'text',
    placeholder = ''
  ) => (
    <div key={id}>
      <label htmlFor={id} className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => setter(e.target.value)}
        placeholder={placeholder}
        autoComplete={type === 'password' ? 'new-password' : 'off'}
        className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
      />
      {fieldErrors[id] && (
        <p className="text-[11px] text-red-500 mt-0.5">{fieldErrors[id]}</p>
      )}
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md w-full shadow-sm space-y-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 justify-center">
          <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
            <Store size={15} className="text-white" />
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-gray-900">Vendora</span>
        </div>

        {/* Title */}
        <div className="text-center">
          <h2 className="text-[18px] font-semibold text-gray-900">
            {isRegister ? 'Registra tu Negocio' : 'Iniciar Sesión'}
          </h2>
          <p className="text-[12px] text-gray-400 mt-1">
            {isRegister
              ? 'Crea tu cuenta de administrador y configura tu negocio'
              : 'Ingresa tus credenciales para acceder al sistema'}
          </p>
        </div>

        {/* Error */}
        {validationError && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[12px] rounded-md text-center">
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
          {isRegister && (
            <>
              {field('Nombre Completo', 'nombre', nombre, setNombre, 'text', 'Ej: Ana López')}
              {field('Nombre del Negocio', 'businessName', businessName, setBusinessName, 'text', 'Ej: Minimercado Vendora')}
              {field('Dirección del Negocio', 'direccion', direccion, setDireccion, 'text', 'Ej: Av. Caracas #45-12, Bogotá')}
            </>
          )}

          {field('Correo Electrónico', 'email', email, setEmail, 'email', 'correo@ejemplo.com')}
          {field('Contraseña', 'password', password, setPassword, 'password', '••••••••')}

          {isRegister && field('Confirmar Contraseña', 'confirmPassword', confirmPassword, setConfirmPassword, 'password', '••••••••')}

          {/* Submit — stable DOM structure avoids React 19 insertBefore crash */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 bg-gray-900 text-white rounded-md text-[13px] font-semibold hover:bg-gray-800 disabled:opacity-60 transition-colors"
          >
            {loading
              ? isRegister ? 'Registrando...' : 'Ingresando...'
              : isRegister ? 'Registrar Negocio' : 'Ingresar'}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              setValidationError(null)
              setFieldErrors({})
            }}
            className="text-[12px] text-gray-500 hover:text-gray-900 transition-colors"
          >
            {isRegister
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿Nuevo en Vendora? Registra tu negocio'}
          </button>
        </div>
      </div>
    </div>
  )
}
