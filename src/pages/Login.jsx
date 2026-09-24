import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { BookOpen, Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function mapAuthError(message) {
  const msg = (message || '').toLowerCase()

  if (msg.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (msg.includes('user not found')) {
    return 'Usuario no encontrado.'
  }
  if (msg.includes('already registered')) {
    return 'Este correo ya está registrado. Inicia sesión.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Debes confirmar tu correo electrónico antes de iniciar sesión.'
  }
  if (msg.includes('at least 6 characters')) {
    return 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (msg.includes('rate limit') || msg.includes('too many')) {
    return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'
  }

  return message || 'Ocurrió un error inesperado. Inténtalo de nuevo.'
}

export default function Login() {
  const { session, loading, signIn, signUp } = useAuth()
  const location = useLocation()

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/'

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  if (session) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSubmitting(true)

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else {
        const data = await signUp(email.trim(), password)
        if (!data.session) {
          setNotice(
            'Cuenta creada. Revisa tu correo para confirmar el acceso.'
          )
          setMode('login')
        }
      }
    } catch (err) {
      setError(mapAuthError(err.message))
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode)
    setError('')
    setNotice('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/40">
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            UNI ADMIN
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Organización Académica Personal
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-800/60 p-1">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                mode === 'login'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                mode === 'signup'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="auth-email"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="auth-email"
                    name="auth-email"
                    type="email"
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="mb-1.5 block text-sm font-medium text-slate-300"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    id="auth-password"
                    name="auth-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck="false"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-600 bg-slate-800/80 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                </div>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
                >
                  {error}
                </div>
              )}

              {notice && (
                <div
                  role="status"
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300"
                >
                  {notice}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {submitting
                  ? mode === 'login'
                    ? 'Entrando…'
                    : 'Creando cuenta…'
                  : mode === 'login'
                    ? 'Entrar'
                    : 'Crear cuenta'}
              </button>
            </div>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500">
            {mode === 'login'
              ? '¿No tienes cuenta? Cambia a la pestaña "Registrarse".'
              : '¿Ya tienes cuenta? Cambia a "Iniciar sesión".'}
          </p>
        </div>
      </div>
    </div>
  )
}
