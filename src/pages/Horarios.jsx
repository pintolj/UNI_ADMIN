import { useCallback, useEffect, useState } from 'react'
import {
  CalendarClock,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { supabase } from '../supabase/client'
import { getMateriaChipClass } from '../utils/materiaColors'

const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

const INITIAL_FORM = {
  materia: '',
  profesor: '',
  dia_semana: 'Lunes',
  hora_inicio: '',
  hora_fin: '',
  aula: '',
}

const inputClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

const horariosQuery = () =>
  supabase
    .from('horarios')
    .select('*')
    .order('dia_semana', { ascending: true })
    .order('hora_inicio', { ascending: true })

export default function Horarios() {
  const [horarios, setHorarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)

  const applyHorariosResult = useCallback(({ data, error: fetchError }) => {
    if (fetchError) {
      setHorarios([])
      setError(`Error al cargar los horarios: ${fetchError.message}`)
    } else {
      setError(null)
      setHorarios(data ?? [])
    }
    setLoading(false)
  }, [])

  const fetchHorarios = useCallback(async () => {
    applyHorariosResult(await horariosQuery())
  }, [applyHorariosResult])

  useEffect(() => {
    let active = true

    horariosQuery().then((result) => {
      if (active) applyHorariosResult(result)
    })

    return () => {
      active = false
    }
  }, [applyHorariosResult])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (form.hora_inicio && form.hora_fin && form.hora_inicio >= form.hora_fin) {
      setError('La hora de inicio debe ser anterior a la hora de fin.')
      return
    }

    setSubmitting(true)

    try {
      const { error: insertError } = await supabase
        .from('horarios')
        .insert([form])

      if (insertError) {
        throw new Error(insertError.message)
      }

      setSuccess('Horario creado correctamente.')
      setForm(INITIAL_FORM)
      await fetchHorarios()
    } catch (err) {
      setError(`No se pudo crear el horario: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este horario?')) {
      return
    }

    setError(null)
    setSuccess(null)
    setDeletingId(id)

    try {
      const { error: deleteError } = await supabase
        .from('horarios')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setSuccess('Horario eliminado correctamente.')
      setHorarios((prev) => prev.filter((horario) => horario.id !== id))
    } catch (err) {
      setError(`No se pudo eliminar el horario: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
            <CalendarClock className="h-6 w-6 shrink-0 text-indigo-600 sm:h-7 sm:w-7" />
            Gestión de Horarios
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Administra los horarios de clases de la universidad.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            fetchHorarios()
          }}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 md:py-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
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

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:mb-8 sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Nuevo horario
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" autoComplete="off">
          <div>
            <label htmlFor="materia" className="mb-1.5 block text-sm font-medium text-slate-700">
              Materia
            </label>
            <input
              id="materia"
              name="materia"
              type="text"
              required
              value={form.materia}
              onChange={handleChange}
              placeholder="Ej. Cálculo Integral"
              className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
          </div>

          <div>
            <label htmlFor="profesor" className="mb-1.5 block text-sm font-medium text-slate-700">
              Profesor
            </label>
            <input
              id="profesor"
              name="profesor"
              type="text"
              required
              value={form.profesor}
              onChange={handleChange}
              placeholder="Ej. Dr. García"
              className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
          </div>

          <div>
            <label htmlFor="dia_semana" className="mb-1.5 block text-sm font-medium text-slate-700">
              Día de la semana
            </label>
            <select
              id="dia_semana"
              name="dia_semana"
              required
              value={form.dia_semana}
              onChange={handleChange}
              className={inputClasses}
             autoComplete="off" autoCorrect="off" spellCheck="false">
              {DIAS_SEMANA.map((dia) => (
                <option key={dia} value={dia}>
                  {dia}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="hora_inicio" className="mb-1.5 block text-sm font-medium text-slate-700">
              Hora de inicio
            </label>
            <input
              id="hora_inicio"
              name="hora_inicio"
              type="time"
              required
              value={form.hora_inicio}
              onChange={handleChange}
              className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
          </div>

          <div>
            <label htmlFor="hora_fin" className="mb-1.5 block text-sm font-medium text-slate-700">
              Hora de fin
            </label>
            <input
              id="hora_fin"
              name="hora_fin"
              type="time"
              required
              value={form.hora_fin}
              onChange={handleChange}
              className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
          </div>

          <div>
            <label htmlFor="aula" className="mb-1.5 block text-sm font-medium text-slate-700">
              Aula
            </label>
            <input
              id="aula"
              name="aula"
              type="text"
              required
              value={form.aula}
              onChange={handleChange}
              placeholder="Ej. A-101"
              className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto md:py-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {submitting ? 'Guardando...' : 'Crear horario'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Horarios registrados
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando...
          </div>
        ) : horarios.length === 0 ? (
          <div className="px-4 py-12 text-center text-slate-500 sm:px-6">
            No hay horarios registrados. Crea el primero con el formulario
            superior.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {horarios.map((horario) => (
                <article
                  key={horario.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getMateriaChipClass(horario.materia)}`}
                      >
                        {horario.materia}
                      </span>
                      <p className="mt-2 text-sm text-slate-600">
                        {horario.profesor}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                      {horario.dia_semana}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span>
                      {horario.hora_inicio} – {horario.hora_fin}
                    </span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                      {horario.aula}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(horario.id)}
                    disabled={deletingId === horario.id}
                    aria-label="Eliminar horario"
                    className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 md:py-2"
                  >
                    {deletingId === horario.id ? (
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
                    <th className="px-6 py-3 font-semibold">Materia</th>
                    <th className="px-6 py-3 font-semibold">Profesor</th>
                    <th className="px-6 py-3 font-semibold">Día</th>
                    <th className="px-6 py-3 font-semibold">Inicio</th>
                    <th className="px-6 py-3 font-semibold">Fin</th>
                    <th className="px-6 py-3 font-semibold">Aula</th>
                    <th className="px-6 py-3 text-right font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {horarios.map((horario) => (
                    <tr key={horario.id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${getMateriaChipClass(horario.materia)}`}
                        >
                          {horario.materia}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {horario.profesor}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                          {horario.dia_semana}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {horario.hora_inicio}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {horario.hora_fin}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {horario.aula}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(horario.id)}
                          disabled={deletingId === horario.id}
                          aria-label="Eliminar horario"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === horario.id ? (
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
    </div>
  )
}
