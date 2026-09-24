import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ExternalLink,
  FolderOpen,
  GraduationCap,
  Link2,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Trash2,
  Video,
  X,
} from 'lucide-react'
import { supabase } from '../supabase/client'
import { getMateriaChipClass } from '../utils/materiaColors'

const TIPOS_ENLACE = [
  { value: 'moodle', label: 'Moodle', icon: GraduationCap },
  { value: 'drive', label: 'Google Drive', icon: FolderOpen },
  { value: 'zoom', label: 'Zoom', icon: Video },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'otro', label: 'Otro', icon: Link2 },
]

const INITIAL_FORM = {
  materia: '',
  tipo: 'moodle',
  nombre: '',
  url: '',
}

const inputClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

const enlacesQuery = () =>
  supabase
    .from('enlaces')
    .select('id, materia, tipo, nombre, url')
    .order('materia', { ascending: true })
    .order('id', { ascending: true })

const getTipoConfig = (tipo) =>
  TIPOS_ENLACE.find((item) => item.value === (tipo ?? 'otro')) ??
  TIPOS_ENLACE[TIPOS_ENLACE.length - 1]

export default function Enlaces() {
  const [enlaces, setEnlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const applyResult = useCallback(({ data, error: fetchError }) => {
    if (fetchError) {
      setEnlaces([])
      setError(`Error al cargar los enlaces: ${fetchError.message}`)
    } else {
      setError(null)
      setEnlaces(data ?? [])
    }
    setLoading(false)
  }, [])

  const fetchEnlaces = useCallback(async () => {
    applyResult(await enlacesQuery())
  }, [applyResult])

  useEffect(() => {
    let active = true

    enlacesQuery().then((result) => {
      if (active) applyResult(result)
    })

    return () => {
      active = false
    }
  }, [applyResult])

  const grouped = useMemo(() => {
    const map = new Map()

    for (const item of enlaces) {
      const key = item.materia || 'Sin materia'
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(item)
    }

    return Array.from(map.entries()).map(([materia, items]) => ({
      materia,
      items,
    }))
  }, [enlaces])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const openModal = () => {
    setError(null)
    setForm(INITIAL_FORM)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setIsModalOpen(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      const { error: insertError } = await supabase
        .from('enlaces')
        .insert([form])

      if (insertError) {
        throw new Error(insertError.message)
      }

      setIsModalOpen(false)
      setForm(INITIAL_FORM)
      setSuccess('Enlace agregado correctamente.')
      await fetchEnlaces()
    } catch (err) {
      setError(`No se pudo crear el enlace: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este enlace?')) {
      return
    }

    setError(null)
    setSuccess(null)
    setDeletingId(id)

    try {
      const { error: deleteError } = await supabase
        .from('enlaces')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setSuccess('Enlace eliminado correctamente.')
      setEnlaces((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(`No se pudo eliminar el enlace: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
            <Link2 className="h-6 w-6 shrink-0 text-indigo-600 sm:h-7 sm:w-7" />
            Enlaces Rápidos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Accesos organizados por materia: Moodle, Drive, Zoom y más.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              fetchEnlaces()
            }}
            disabled={loading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none md:py-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            Actualizar
          </button>

          <button
            type="button"
            onClick={openModal}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 sm:flex-none md:py-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Enlace
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando...
        </div>
      ) : grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
          No hay enlaces guardados. Agrega el primero con el botón superior.
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ materia, items }) => (
            <section key={materia}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  {materia}
                </h2>
                <span className="text-xs text-slate-400">
                  {items.length} enlace(s)
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((enlace) => {
                  const tipo = getTipoConfig(enlace.tipo)
                  const Icon = tipo.icon

                  return (
                    <article
                      key={enlace.id}
                      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${getMateriaChipClass(materia)}`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                          {tipo.label}
                        </span>
                      </div>

                      <h3 className="font-semibold text-slate-900">
                        {enlace.nombre}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {enlace.materia}
                      </p>

                      <div className="mt-auto flex items-center gap-2 pt-4">
                        <a
                          href={enlace.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Abrir enlace
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDelete(enlace.id)}
                          disabled={deletingId === enlace.id}
                          aria-label="Eliminar enlace"
                          className="inline-flex items-center rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === enlace.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="enlaces-modal-title"
          onClick={closeModal}
        >
          <div
            className="w-11/12 max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6 md:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2
                  id="enlaces-modal-title"
                  className="flex items-center gap-2 text-lg font-semibold text-slate-900"
                >
                  <Link2 className="h-5 w-5 text-indigo-600" />
                  Nuevo Enlace Rápido
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Guarda un acceso frecuente de tu materia.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Cerrar modal"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
              <div>
                <label
                  htmlFor="enlace-materia"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Materia
                </label>
                <input
                  id="enlace-materia"
                  name="materia"
                  type="text"
                  required
                  value={form.materia}
                  onChange={handleChange}
                  placeholder="Ej. Cálculo I"
                  className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
              </div>

              <div>
                <label
                  htmlFor="enlace-tipo"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Tipo de enlace
                </label>
                <select
                  id="enlace-tipo"
                  name="tipo"
                  required
                  value={form.tipo}
                  onChange={handleChange}
                  className={inputClasses}
                 autoComplete="off" autoCorrect="off" spellCheck="false">
                  {TIPOS_ENLACE.map((tipo) => (
                    <option key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="enlace-nombre"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Nombre del recurso
                </label>
                <input
                  id="enlace-nombre"
                  name="nombre"
                  type="text"
                  required
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. Aula virtual Moodle"
                  className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
              </div>

              <div>
                <label
                  htmlFor="enlace-url"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  URL
                </label>
                <input
                  id="enlace-url"
                  name="url"
                  type="url"
                  required
                  value={form.url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 md:py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 md:py-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {submitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
