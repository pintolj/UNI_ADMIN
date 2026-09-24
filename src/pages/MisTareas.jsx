import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  CheckSquare,
  Circle,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '../supabase/client'

const INITIAL_FORM = {
  titulo: '',
  materia: '',
  fecha_entrega: '',
  estado: 'pendiente',
  prioridad: 'media',
  descripcion: '',
}

const inputClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

const PRIORIDAD_STYLES = {
  alta: 'bg-red-100 text-red-700 ring-red-200',
  media: 'bg-amber-100 text-amber-700 ring-amber-200',
  baja: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
}

const tareasQuery = () =>
  supabase
    .from('tareas')
    .select('id, titulo, materia, fecha_entrega, estado, prioridad, descripcion')
    .order('fecha_entrega', { ascending: true, nullsFirst: false })

function PrioridadBadge({ prioridad }) {
  const key = (prioridad ?? 'media').toLowerCase()
  const style = PRIORIDAD_STYLES[key] ?? PRIORIDAD_STYLES.media

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {key}
    </span>
  )
}

function TareaCard({
  tarea,
  deleting,
  onToggle,
  onDelete,
  completed,
}) {
  const isCompleted = completed

  return (
    <article
      className={`flex flex-col gap-3 rounded-xl border p-4 transition ${
        isCompleted
          ? 'border-slate-200 bg-slate-50 opacity-75'
          : 'border-slate-200 bg-white shadow-sm hover:border-indigo-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={`truncate font-semibold ${
              isCompleted
                ? 'text-slate-400 line-through'
                : 'text-slate-900'
            }`}
          >
            {tarea.titulo}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">{tarea.materia}</p>
        </div>
        <PrioridadBadge prioridad={tarea.prioridad} />
      </div>

      {tarea.descripcion && (
        <p
          className={`text-sm ${
            isCompleted ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          {tarea.descripcion}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarDays className="h-3.5 w-3.5" />
          {tarea.fecha_entrega
            ? new Date(`${tarea.fecha_entrega}T00:00:00`).toLocaleDateString(
                'es',
                {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }
              )
            : 'Sin fecha'}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(tarea)}
            aria-label={
              isCompleted
                ? 'Marcar como pendiente'
                : 'Marcar como completada'
            }
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              isCompleted
                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isCompleted ? (
              <>
                <Circle className="h-3.5 w-3.5" />
                Reabrir
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Completar
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => onDelete(tarea.id)}
            disabled={deleting}
            aria-label="Eliminar tarea"
            className="inline-flex items-center rounded-lg bg-red-600 p-1.5 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

export default function MisTareas() {
  const [tareas, setTareas] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const applyTareasResult = useCallback(({ data, error: fetchError }) => {
    if (fetchError) {
      setTareas([])
      setError(`Error al cargar las tareas: ${fetchError.message}`)
    } else {
      setError(null)
      setTareas(data ?? [])
    }
    setLoading(false)
  }, [])

  const fetchTareas = useCallback(async () => {
    applyTareasResult(await tareasQuery())
  }, [applyTareasResult])

  useEffect(() => {
    let active = true

    tareasQuery().then((result) => {
      if (active) applyTareasResult(result)
    })

    return () => {
      active = false
    }
  }, [applyTareasResult])

  const { pendientes, completadas } = useMemo(() => {
    const pend = []
    const comp = []

    for (const tarea of tareas) {
      if ((tarea.estado ?? 'pendiente') === 'completado') {
        comp.push(tarea)
      } else {
        pend.push(tarea)
      }
    }

    return { pendientes: pend, completadas: comp }
  }, [tareas])

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
        .from('tareas')
        .insert([form])

      if (insertError) {
        throw new Error(insertError.message)
      }

      setIsModalOpen(false)
      setForm(INITIAL_FORM)
      setSuccess('Tarea agregada correctamente.')
      await fetchTareas()
    } catch (err) {
      setError(`No se pudo crear la tarea: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleEstado = async (tarea) => {
    const nextEstado =
      (tarea.estado ?? 'pendiente') === 'completado'
        ? 'pendiente'
        : 'completado'

    setError(null)
    setSuccess(null)
    setTogglingId(tarea.id)

    try {
      const { error: updateError } = await supabase
        .from('tareas')
        .update({ estado: nextEstado })
        .eq('id', tarea.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess(
        nextEstado === 'completado'
          ? 'Tarea marcada como completada.'
          : 'Tarea reabierta.'
      )
      setTareas((prev) =>
        prev.map((item) =>
          item.id === tarea.id ? { ...item, estado: nextEstado } : item
        )
      )
    } catch (err) {
      setError(`No se pudo actualizar la tarea: ${err.message}`)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta tarea?')) {
      return
    }

    setError(null)
    setSuccess(null)
    setDeletingId(id)

    try {
      const { error: deleteError } = await supabase
        .from('tareas')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setSuccess('Tarea eliminada correctamente.')
      setTareas((prev) => prev.filter((tarea) => tarea.id !== id))
    } catch (err) {
      setError(`No se pudo eliminar la tarea: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
            <CheckSquare className="h-6 w-6 shrink-0 text-indigo-600 sm:h-7 sm:w-7" />
            Mis Tareas y Entregas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Mantén al día tus pendientes y entregas del semestre.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              fetchTareas()
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
            Nueva Tarea
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
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Circle className="h-4 w-4 fill-indigo-600 text-indigo-600" />
                Pendientes
              </h2>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                {pendientes.length}
              </span>
            </div>

            {pendientes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
                No tienes tareas pendientes. ¡Buen trabajo!
              </div>
            ) : (
              <div className="space-y-4">
                {pendientes.map((tarea) => (
                  <TareaCard
                    key={tarea.id}
                    tarea={tarea}
                    completed={false}
                    deleting={deletingId === tarea.id || togglingId === tarea.id}
                    onToggle={handleToggleEstado}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <Check className="h-4 w-4 text-emerald-600" />
                Completadas
              </h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {completadas.length}
              </span>
            </div>

            {completadas.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
                Aún no has completado tareas.
              </div>
            ) : (
              <div className="space-y-4">
                {completadas.map((tarea) => (
                  <TareaCard
                    key={tarea.id}
                    tarea={tarea}
                    completed
                    deleting={deletingId === tarea.id || togglingId === tarea.id}
                    onToggle={handleToggleEstado}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tarea-modal-title"
          onClick={closeModal}
        >
          <div
            className="w-11/12 max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6 md:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2
                  id="tarea-modal-title"
                  className="flex items-center gap-2 text-lg font-semibold text-slate-900"
                >
                  <ClipboardList className="h-5 w-5 text-indigo-600" />
                  Nueva Tarea / Entrega
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Registra un nuevo pendiente con su fecha de entrega.
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
                  htmlFor="titulo"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Título
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  type="text"
                  required
                  value={form.titulo}
                  onChange={handleChange}
                  placeholder="Ej. Informe de laboratorio 3"
                  className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
              </div>

              <div>
                <label
                  htmlFor="materia"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Materia
                </label>
                <input
                  id="materia"
                  name="materia"
                  type="text"
                  required
                  value={form.materia}
                  onChange={handleChange}
                  placeholder="Ej. Física II"
                  className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="fecha_entrega"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Fecha de entrega
                  </label>
                  <input
                    id="fecha_entrega"
                    name="fecha_entrega"
                    type="date"
                    required
                    value={form.fecha_entrega}
                    onChange={handleChange}
                    className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
                </div>

                <div>
                  <label
                    htmlFor="prioridad"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Prioridad
                  </label>
                  <select
                    id="prioridad"
                    name="prioridad"
                    required
                    value={form.prioridad}
                    onChange={handleChange}
                    className={inputClasses}
                   autoComplete="off" autoCorrect="off" spellCheck="false">
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="descripcion"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows={3}
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Detalles opcionales de la entrega..."
                  className={`${inputClasses} resize-none`} autoComplete="off" autoCorrect="off" spellCheck="false" />
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
