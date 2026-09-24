import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { supabase } from '../supabase/client'

const INITIAL_FORM = {
  nombre: '',
  apellido: '',
  matricula: '',
  email: '',
  carrera: '',
  semestre: '',
}

const inputClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

const estudiantesQuery = () =>
  supabase
    .from('estudiantes')
    .select('id, nombre, apellido, matricula, email, carrera, semestre')
    .order('apellido', { ascending: true })
    .order('nombre', { ascending: true })

export default function Estudiantes() {
  const [estudiantes, setEstudiantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const applyEstudiantesResult = useCallback(({ data, error: fetchError }) => {
    if (fetchError) {
      setEstudiantes([])
      setError(`Error al cargar los estudiantes: ${fetchError.message}`)
    } else {
      setError(null)
      setEstudiantes(data ?? [])
    }
    setLoading(false)
  }, [])

  const fetchEstudiantes = useCallback(async () => {
    applyEstudiantesResult(await estudiantesQuery())
  }, [applyEstudiantesResult])

  useEffect(() => {
    let active = true

    estudiantesQuery().then((result) => {
      if (active) applyEstudiantesResult(result)
    })

    return () => {
      active = false
    }
  }, [applyEstudiantesResult])

  const filteredEstudiantes = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return estudiantes

    return estudiantes.filter((estudiante) => {
      const nombre = (estudiante.nombre ?? '').toLowerCase()
      const apellido = (estudiante.apellido ?? '').toLowerCase()
      const matricula = (estudiante.matricula ?? '').toLowerCase()
      const carrera = (estudiante.carrera ?? '').toLowerCase()
      return (
        nombre.includes(term) ||
        apellido.includes(term) ||
        matricula.includes(term) ||
        carrera.includes(term)
      )
    })
  }, [estudiantes, search])

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
      const payload = {
        ...form,
        semestre: Number(form.semestre),
      }

      const { error: insertError } = await supabase
        .from('estudiantes')
        .insert([payload])

      if (insertError) {
        throw new Error(insertError.message)
      }

      setIsModalOpen(false)
      setForm(INITIAL_FORM)
      setSuccess('Estudiante agregado correctamente.')
      await fetchEstudiantes()
    } catch (err) {
      setError(`No se pudo crear el estudiante: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este estudiante?')) {
      return
    }

    setError(null)
    setSuccess(null)
    setDeletingId(id)

    try {
      const { error: deleteError } = await supabase
        .from('estudiantes')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setSuccess('Estudiante eliminado correctamente.')
      setEstudiantes((prev) => prev.filter((estudiante) => estudiante.id !== id))
    } catch (err) {
      setError(`No se pudo eliminar el estudiante: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
            <GraduationCap className="h-6 w-6 shrink-0 text-indigo-600 sm:h-7 sm:w-7" />
            Gestión de Estudiantes
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra el registro de estudiantes de la universidad.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              fetchEstudiantes()
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
            Agregar Estudiante
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

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="estudiantes-search"
            name="estudiantes-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, apellido, matrícula o carrera..."
            aria-label="Buscar estudiantes"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className={`${inputClasses} pl-9`}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Estudiantes registrados
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando...
          </div>
        ) : filteredEstudiantes.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-500 sm:px-6">
            {search
              ? 'No se encontraron estudiantes con esa búsqueda.'
              : 'No hay estudiantes registrados. Agrega el primero con el botón superior.'}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {filteredEstudiantes.map((estudiante) => (
                <article
                  key={estudiante.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                      <UserRound className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">
                        {estudiante.nombre} {estudiante.apellido}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-700">
                          {estudiante.matricula}
                        </span>
                        <span className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          {estudiante.semestre}º
                        </span>
                      </div>
                    </div>
                  </div>

                  <dl className="mt-3 space-y-1 text-sm text-slate-600">
                    <div className="flex gap-2">
                      <dt className="font-medium text-slate-500">Carrera:</dt>
                      <dd className="min-w-0">{estudiante.carrera}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="font-medium text-slate-500">Email:</dt>
                      <dd className="min-w-0 break-all">{estudiante.email ?? '—'}</dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => handleDelete(estudiante.id)}
                    disabled={deletingId === estudiante.id}
                    aria-label="Eliminar estudiante"
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 md:py-2"
                  >
                    {deletingId === estudiante.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Eliminar
                  </button>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Nombre</th>
                    <th className="px-6 py-3 font-semibold">Apellido</th>
                    <th className="px-6 py-3 font-semibold">Matrícula</th>
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold">Carrera</th>
                    <th className="px-6 py-3 font-semibold">Semestre</th>
                    <th className="px-6 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEstudiantes.map((estudiante) => (
                    <tr
                      key={estudiante.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                            <UserRound className="h-4 w-4" />
                          </span>
                          <span className="font-medium text-slate-900">
                            {estudiante.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {estudiante.apellido}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-700">
                          {estudiante.matricula}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {estudiante.email ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {estudiante.carrera}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                          {estudiante.semestre}º
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(estudiante.id)}
                          disabled={deletingId === estudiante.id}
                          aria-label="Eliminar estudiante"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === estudiante.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={closeModal}
        >
          <div
            className="w-11/12 max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6 md:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2
                  id="modal-title"
                  className="flex items-center gap-2 text-lg font-semibold text-slate-900"
                >
                  <Pencil className="h-5 w-5 text-indigo-600" />
                  Agregar Estudiante
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Completa los datos del nuevo estudiante.
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="nombre"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Carlos"
                    className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
                </div>

                <div>
                  <label
                    htmlFor="apellido"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Apellido
                  </label>
                  <input
                    id="apellido"
                    name="apellido"
                    type="text"
                    required
                    value={form.apellido}
                    onChange={handleChange}
                    placeholder="Ej. Ramírez"
                    className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="matricula"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Matrícula / Carné
                  </label>
                  <input
                    id="matricula"
                    name="matricula"
                    type="text"
                    required
                    value={form.matricula}
                    onChange={handleChange}
                    placeholder="Ej. 2024-00123"
                    className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
                </div>

                <div>
                  <label
                    htmlFor="semestre"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Semestre
                  </label>
                  <input
                    id="semestre"
                    name="semestre"
                    type="number"
                    required
                    min="1"
                    max="12"
                    value={form.semestre}
                    onChange={handleChange}
                    placeholder="Ej. 3"
                    className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="carlos.ramirez@estudiantes.edu"
                  className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
              </div>

              <div>
                <label
                  htmlFor="carrera"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Carrera
                </label>
                <input
                  id="carrera"
                  name="carrera"
                  type="text"
                  required
                  value={form.carrera}
                  onChange={handleChange}
                  placeholder="Ej. Ingeniería de Sistemas"
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
