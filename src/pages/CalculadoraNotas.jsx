import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Edit3,
  Loader2,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  TrendingUp,
  Trash2,
  X,
  XCircle,
} from 'lucide-react'
import { supabase } from '../supabase/client'

const SCALES = {
  '20': { max: 20, defaultMin: 10, label: '0 – 20' },
  '100': { max: 100, defaultMin: 60, label: '0 – 100' },
}

const INITIAL_EVALUACION = {
  nombre: '',
  porcentaje: '',
  nota: '',
}

const inputClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

const evaluacionesQuery = () =>
  supabase
    .from('evaluaciones')
    .select('id, materia, nombre, porcentaje, nota')
    .order('id', { ascending: true })

function MetricCard({ icon: Icon, label, value, sub, tone = 'default' }) {
  const tones = {
    default: 'text-slate-900',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-red-600',
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${tones[tone]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

function StatusBadge({ status, message }) {
  const styles = {
    aprobado: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    posible: 'border-amber-200 bg-amber-50 text-amber-800',
    imposible: 'border-red-200 bg-red-50 text-red-800',
    neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  }

  const icons = {
    aprobado: CheckCircle2,
    posible: TrendingUp,
    imposible: XCircle,
    neutral: AlertTriangle,
  }

  const Icon = icons[status] ?? AlertTriangle

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${styles[status] ?? styles.neutral}`}
      role="status"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export default function CalculadoraNotas() {
  const [evaluaciones, setEvaluaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const [materia, setMateria] = useState('')
  const [escala, setEscala] = useState('20')
  const [notaMinima, setNotaMinima] = useState(String(SCALES['20'].defaultMin))

  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false)
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false)
  const [editingEval, setEditingEval] = useState(null)
  const [evalForm, setEvalForm] = useState(INITIAL_EVALUACION)
  const [notaForm, setNotaForm] = useState('')

  const applyResult = useCallback(({ data, error: fetchError }) => {
    if (fetchError) {
      setEvaluaciones([])
      setError(`Error al cargar las evaluaciones: ${fetchError.message}`)
    } else {
      setError(null)
      setEvaluaciones(data ?? [])
    }
    setLoading(false)
  }, [])

  const fetchEvaluaciones = useCallback(async () => {
    applyResult(await evaluacionesQuery())
  }, [applyResult])

  useEffect(() => {
    let active = true

    evaluacionesQuery().then((result) => {
      if (active) applyResult(result)
    })

    return () => {
      active = false
    }
  }, [applyResult])

  const materiasDisponibles = useMemo(() => {
    const set = new Set()
    for (const item of evaluaciones) {
      if (item.materia) set.add(item.materia)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [evaluaciones])

  const evaluacionesFiltradas = useMemo(() => {
    const term = materia.trim().toLowerCase()
    if (!term) return []
    return evaluaciones.filter(
      (item) => (item.materia ?? '').toLowerCase() === term
    )
  }, [evaluaciones, materia])

  const metrics = useMemo(() => {
    const scale = SCALES[escala]
    const min = Number(notaMinima) || scale.defaultMin
    const max = scale.max

    let porcentajeEvaluado = 0
    let notaAcumulada = 0
    let porcentajePendienteCount = 0

    for (const item of evaluacionesFiltradas) {
      const pct = Number(item.porcentaje) || 0
      if (item.nota === null || item.nota === undefined || item.nota === '') {
        porcentajePendienteCount += 1
        continue
      }
      const nota = Number(item.nota)
      porcentajeEvaluado += pct
      notaAcumulada += nota * (pct / 100)
    }

    const porcentajeRestante = Math.max(0, 100 - porcentajeEvaluado)
    let notaNecesaria = null
    let status = 'neutral'
    let message = ''

    if (!evaluacionesFiltradas.length) {
      message =
        'Selecciona o escribe una materia con evaluaciones para ver el análisis.'
    } else if (notaAcumulada >= min) {
      status = 'aprobado'
      message = `¡Aprobaste! Con lo acumulado (${notaAcumulada.toFixed(2)}) ya alcanzas la nota mínima (${min}).`
    } else if (porcentajeRestante <= 0) {
      status = 'imposible'
      message = `Ya no hay porcentaje restante. Nota final: ${notaAcumulada.toFixed(2)} (mínimo ${min}).`
    } else {
      notaNecesaria = ((min - notaAcumulada) * 100) / porcentajeRestante

      if (notaNecesaria > max) {
        status = 'imposible'
        message = `Es imposible aprobar: necesitarías ${notaNecesaria.toFixed(2)} sobre ${max} en el ${porcentajeRestante.toFixed(0)}% restante.`
      } else {
        status = 'posible'
        message = `Aún puedes aprobar: necesitas promediar ${notaNecesaria.toFixed(2)} en el ${porcentajeRestante.toFixed(0)}% restante (mínimo ${min}).`
      }
    }

    return {
      porcentajeEvaluado,
      notaAcumulada,
      porcentajeRestante,
      notaNecesaria,
      min,
      max,
      status,
      message,
      porcentajePendienteCount,
      totalPonderacion: evaluacionesFiltradas.reduce(
        (acc, item) => acc + (Number(item.porcentaje) || 0),
        0
      ),
    }
  }, [evaluacionesFiltradas, escala, notaMinima])

  const handleEscalaChange = (value) => {
    setEscala(value)
    setNotaMinima(String(SCALES[value].defaultMin))
  }

  const openEvalModal = () => {
    setError(null)
    setEvalForm({
      nombre: '',
      porcentaje: '',
      nota: '',
      materia: materia.trim(),
    })
    setIsEvalModalOpen(true)
  }

  const closeEvalModal = () => {
    if (submitting) return
    setIsEvalModalOpen(false)
  }

  const openNotaModal = (evaluacion) => {
    setError(null)
    setEditingEval(evaluacion)
    setNotaForm(
      evaluacion.nota === null || evaluacion.nota === undefined
        ? ''
        : String(evaluacion.nota)
    )
    setIsNotaModalOpen(true)
  }

  const closeNotaModal = () => {
    if (submitting) return
    setIsNotaModalOpen(false)
    setEditingEval(null)
  }

  const handleEvalChange = (e) => {
    const { name, value } = e.target
    setEvalForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreateEvaluacion = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const materiaFinal = (evalForm.materia ?? materia).trim()
    if (!materiaFinal) {
      setError('Debes indicar la materia de la evaluación.')
      return
    }

    setSubmitting(true)

    try {
      const payload = {
        materia: materiaFinal,
        nombre: evalForm.nombre,
        porcentaje: Number(evalForm.porcentaje),
        nota:
          evalForm.nota === '' || evalForm.nota === null
            ? null
            : Number(evalForm.nota),
      }

      const { error: insertError } = await supabase
        .from('evaluaciones')
        .insert([payload])

      if (insertError) {
        throw new Error(insertError.message)
      }

      setIsEvalModalOpen(false)
      setMateria(materiaFinal)
      setSuccess('Evaluación agregada correctamente.')
      await fetchEvaluaciones()
    } catch (err) {
      setError(`No se pudo crear la evaluación: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSaveNota = async (e) => {
    e.preventDefault()
    if (!editingEval) return

    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      const notaValue =
        notaForm === '' || notaForm === null ? null : Number(notaForm)

      if (notaValue !== null) {
        const scaleMax = SCALES[escala].max
        if (Number.isNaN(notaValue) || notaValue < 0 || notaValue > scaleMax) {
          throw new Error(`La nota debe estar entre 0 y ${scaleMax}.`)
        }
      }

      const { error: updateError } = await supabase
        .from('evaluaciones')
        .update({ nota: notaValue })
        .eq('id', editingEval.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setIsNotaModalOpen(false)
      setEditingEval(null)
      setSuccess('Nota actualizada correctamente.')
      await fetchEvaluaciones()
    } catch (err) {
      setError(`No se pudo guardar la nota: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta evaluación?')) {
      return
    }

    setError(null)
    setSuccess(null)
    setDeletingId(id)

    try {
      const { error: deleteError } = await supabase
        .from('evaluaciones')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setSuccess('Evaluación eliminada correctamente.')
      setEvaluaciones((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(`No se pudo eliminar la evaluación: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  const scaleMax = SCALES[escala].max

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
            <Calculator className="h-6 w-6 shrink-0 text-indigo-600 sm:h-7 sm:w-7" />
            Calculadora de Notas
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Proyecta tu promedio y descubre qué necesitas para aprobar.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              fetchEvaluaciones()
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
            onClick={openEvalModal}
            disabled={!materia.trim()}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none md:py-2"
            title={
              materia.trim()
                ? 'Agregar evaluación'
                : 'Selecciona o escribe una materia primero'
            }
          >
            <Plus className="h-4 w-4" />
            Nueva Evaluación
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

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
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
              list="materias-list"
              value={materia}
              onChange={(e) => setMateria(e.target.value)}
              placeholder="Escribe o elige una materia..."
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              className={inputClasses}
            />
            <datalist id="materias-list">
              {materiasDisponibles.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div>
            <label
              htmlFor="escala"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Escala
            </label>
            <select
              id="escala"
              name="escala"
              value={escala}
              onChange={(e) => handleEscalaChange(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              className={inputClasses}
            >
              <option value="20">0 – 20 (mín. 10)</option>
              <option value="100">0 – 100 (mín. 60)</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="notaMinima"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Nota mínima para aprobar
            </label>
            <input
              id="notaMinima"
              name="notaMinima"
              type="number"
              min="0"
              max={scaleMax}
              step="0.01"
              value={notaMinima}
              onChange={(e) => setNotaMinima(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              className={inputClasses}
            />
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando...
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            <MetricCard
              icon={Percent}
              label="Porcentaje evaluado"
              value={`${metrics.porcentajeEvaluado.toFixed(0)}%`}
              sub={`Restante: ${metrics.porcentajeRestante.toFixed(0)}%`}
            />
            <MetricCard
              icon={TrendingUp}
              label="Nota acumulada actual"
              value={metrics.notaAcumulada.toFixed(2)}
              sub={`Mínimo requerido: ${metrics.min}`}
              tone={
                metrics.notaAcumulada >= metrics.min ? 'success' : 'default'
              }
            />
            <MetricCard
              icon={Calculator}
              label="Nota necesaria (restante)"
              value={
                metrics.status === 'aprobado'
                  ? '—'
                  : metrics.notaNecesaria === null
                    ? '—'
                    : metrics.notaNecesaria.toFixed(2)
              }
              sub={
                metrics.status === 'aprobado'
                  ? 'Ya aprobaste'
                  : metrics.porcentajeRestante > 0
                    ? `En el ${metrics.porcentajeRestante.toFixed(0)}% que falta`
                    : 'Sin porcentaje restante'
              }
              tone={
                metrics.status === 'aprobado'
                  ? 'success'
                  : metrics.status === 'imposible'
                    ? 'danger'
                    : metrics.status === 'posible'
                      ? 'warning'
                      : 'default'
              }
            />
          </div>

          <div className="mb-6">
            <StatusBadge
              status={metrics.status}
              message={metrics.message}
            />
          </div>

          {metrics.totalPonderacion > 100 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              La suma de porcentajes de esta materia es{' '}
              {metrics.totalPonderacion}% (superior al 100%).
            </div>
          )}

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Evaluaciones
                </h2>
                {materia.trim() && (
                  <p className="text-sm text-slate-500">
                    Materia: <span className="font-medium">{materia}</span>
                  </p>
                )}
              </div>
              {evaluacionesFiltradas.length > 0 && (
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  {evaluacionesFiltradas.length} registro(s)
                </span>
              )}
            </div>

            {!materia.trim() ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500 sm:px-6">
                Selecciona o escribe una materia en los filtros superiores para
                ver sus evaluaciones.
              </div>
            ) : evaluacionesFiltradas.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500 sm:px-6">
                No hay evaluaciones para esta materia. Agrega la primera con el
                botón “Nueva Evaluación”.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">
                        Evaluación
                      </th>
                      <th className="px-6 py-3 font-semibold">Porcentaje</th>
                      <th className="px-6 py-3 font-semibold">Nota</th>
                      <th className="px-6 py-3 font-semibold">Aporte</th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {evaluacionesFiltradas.map((item) => {
                      const pct = Number(item.porcentaje) || 0
                      const hasNota =
                        item.nota !== null &&
                        item.nota !== undefined &&
                        item.nota !== ''
                      const aporte = hasNota
                        ? (Number(item.nota) * pct) / 100
                        : null

                      return (
                        <tr
                          key={item.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {item.nombre}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {pct}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {hasNota ? (
                              <span className="font-semibold text-slate-900">
                                {Number(item.nota).toFixed(2)}
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {aporte === null ? '—' : aporte.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openNotaModal(item)}
                                aria-label="Editar nota"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
                              >
                                {hasNota ? (
                                  <Edit3 className="h-3.5 w-3.5" />
                                ) : (
                                  <Pencil className="h-3.5 w-3.5" />
                                )}
                                {hasNota ? 'Editar nota' : 'Ingresar nota'}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                disabled={deletingId === item.id}
                                aria-label="Eliminar evaluación"
                                className="inline-flex items-center rounded-lg bg-red-600 p-1.5 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {deletingId === item.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {isEvalModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="eval-modal-title"
          onClick={closeEvalModal}
        >
          <div
            className="w-11/12 max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6 md:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2
                  id="eval-modal-title"
                  className="flex items-center gap-2 text-lg font-semibold text-slate-900"
                >
                  <Pencil className="h-5 w-5 text-indigo-600" />
                  Nueva Evaluación
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Registra un parcial, examen o tarea de la materia.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEvalModal}
                aria-label="Cerrar modal"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvaluacion} className="space-y-4" autoComplete="off">
              <div>
                <label
                  htmlFor="eval-materia"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Materia
                </label>
                <input
                  id="eval-materia"
                  name="materia"
                  type="text"
                  required
                  list="materias-list-modal"
                  value={evalForm.materia ?? ''}
                  onChange={handleEvalChange}
                  placeholder="Ej. Cálculo I"
                  className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
                <datalist id="materias-list-modal">
                  {materiasDisponibles.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </div>

              <div>
                <label
                  htmlFor="eval-nombre"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Nombre de la evaluación
                </label>
                <input
                  id="eval-nombre"
                  name="nombre"
                  type="text"
                  required
                  value={evalForm.nombre}
                  onChange={handleEvalChange}
                  placeholder="Ej. Parcial 1"
                  className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="eval-porcentaje"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Porcentaje (%)
                  </label>
                  <input
                    id="eval-porcentaje"
                    name="porcentaje"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    required
                    value={evalForm.porcentaje}
                    onChange={handleEvalChange}
                    placeholder="Ej. 20"
                    className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
                </div>

                <div>
                  <label
                    htmlFor="eval-nota"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Nota (opcional)
                  </label>
                  <input
                    id="eval-nota"
                    name="nota"
                    type="number"
                    min="0"
                    max={scaleMax}
                    step="0.01"
                    value={evalForm.nota}
                    onChange={handleEvalChange}
                    placeholder={`Vacío = Pendiente (0–${scaleMax})`}
                    className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEvalModal}
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

      {isNotaModalOpen && editingEval && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nota-modal-title"
          onClick={closeNotaModal}
        >
          <div
            className="w-11/12 max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6 md:max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2
                  id="nota-modal-title"
                  className="flex items-center gap-2 text-lg font-semibold text-slate-900"
                >
                  <Edit3 className="h-5 w-5 text-indigo-600" />
                  {editingEval.nota !== null &&
                  editingEval.nota !== undefined &&
                  editingEval.nota !== ''
                    ? 'Editar nota'
                    : 'Ingresar nota'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingEval.nombre} · {editingEval.porcentaje}%
                </p>
              </div>
              <button
                type="button"
                onClick={closeNotaModal}
                aria-label="Cerrar modal"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNota} className="space-y-4" autoComplete="off">
              <div>
                <label
                  htmlFor="nota-input"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Nota (0 – {scaleMax})
                </label>
                <input
                  id="nota-input"
                  name="nota-input"
                  type="number"
                  min="0"
                  max={scaleMax}
                  step="0.01"
                  required
                  value={notaForm}
                  onChange={(e) => setNotaForm(e.target.value)}
                  placeholder={`Ej. ${escala === '20' ? '15' : '85'}`}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  autoFocus
                  className={inputClasses}
                />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeNotaModal}
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
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {submitting ? 'Guardando...' : 'Guardar nota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
