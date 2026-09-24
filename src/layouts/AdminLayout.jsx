import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Calculator,
  Calendar,
  CheckSquare,
  FolderArchive,
  GraduationCap,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const primaryNavigation = [
  { name: 'Inicio', to: '/', icon: LayoutDashboard, end: true },
  { name: 'Mi Horario', to: '/horarios', icon: Calendar },
  { name: 'Mis Tareas y Entregas', to: '/tareas', icon: CheckSquare },
  { name: 'Mi Repositorio / PDFs', to: '/repositorio', icon: FolderArchive },
  { name: 'Enlaces Rápidos', to: '/enlaces', icon: Link2 },
  { name: 'Calculadora de Notas', to: '/notas', icon: Calculator },
]

const secondaryNavigation = [
  { name: 'Profesores', to: '/profesores', icon: Users },
  { name: 'Estudiantes', to: '/estudiantes', icon: GraduationCap },
]

function NavItem({ name, to, icon: Icon, end = false, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors md:py-2.5 ${
          isActive
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{name}</span>
    </NavLink>
  )
}

function SidebarContent({ onNavigate, onLogout, loggingOut, userEmail }) {
  return (
    <>
      <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4 md:h-16 md:px-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-indigo-400" />
          <div className="leading-tight">
            <span className="block text-sm font-semibold tracking-wide">
              UNI ADMIN
            </span>
            <span className="block text-[11px] text-slate-500">
              Organización Académica
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onNavigate}
          aria-label="Cerrar menú"
          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white md:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Personal
        </p>
        <div className="space-y-1">
          {primaryNavigation.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </div>

        <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          Consulta
        </p>
        <div className="space-y-1">
          {secondaryNavigation.map((item) => (
            <NavItem key={item.to} {...item} onNavigate={onNavigate} />
          ))}
        </div>
      </nav>

      <div className="border-t border-slate-800 px-4 py-4 md:px-6">
        <p className="truncate text-[11px] text-slate-500" title={userEmail}>
          {userEmail || 'Sesión activa'}
        </p>
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60 md:py-2"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span>{loggingOut ? 'Cerrando…' : 'Cerrar Sesión'}</span>
        </button>
        <p className="mt-3 text-xs text-slate-600">
          Tu espacio de estudio personal
        </p>
      </div>
    </>
  )
}

export default function AdminLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await signOut()
      setIsMobileMenuOpen(false)
      navigate('/login', { replace: true })
    } catch {
      setLoggingOut(false)
    }
  }

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileMenuOpen])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-100 md:flex">
        <SidebarContent
          onLogout={handleLogout}
          loggingOut={loggingOut}
          userEmail={user?.email}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <div className="leading-tight">
              <span className="block text-sm font-semibold text-slate-900">
                UNI ADMIN
              </span>
              <span className="block text-[10px] text-slate-500">
                Organización Académica
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={isMobileMenuOpen}
            className="rounded-lg p-2.5 text-slate-600 transition hover:bg-slate-100"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-slate-900 text-slate-100 shadow-2xl">
            <SidebarContent
              onNavigate={() => setIsMobileMenuOpen(false)}
              onLogout={handleLogout}
              loggingOut={loggingOut}
              userEmail={user?.email}
            />
          </div>
        </div>
      )}
    </div>
  )
}
