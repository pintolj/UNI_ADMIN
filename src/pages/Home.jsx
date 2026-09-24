import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlarmClock,
  BookOpen,
  CalendarClock,
  Check,
  CheckSquare,
  ClipboardList,
  FolderArchive,
  GraduationCap,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { supabase } from '../supabase/client'
import { getMateriaBlockClass } from '../utils/materiaColors'

const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
]

const DIAS_CLASES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

const DIAS_TAB_STYLES = {
  Lunes: 'bg-amber-200 text-amber-900 border-amber-300',
  Martes: 'bg-rose-200 text-rose-900 border-rose-300',
  Miércoles: 'bg-emerald-200 text-emerald-900 border-emerald-300',
  Jueves: 'bg-teal-200 text-teal-900 border-teal-300',
  Viernes: 'bg-sky-200 text-sky-900 border-sky-300',
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const PRIORIDAD_STYLES = {
  alta: 'bg-red-100 text-red-700 ring-red-200',
  media: 'bg-amber-100 text-amber-700 ring-amber-200',
  baja: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
}

const START_HOUR = 8
const END_HOUR = 20
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i
)

const pad = (n) => String(n).padStart(2, '0')

const toLocalDateString = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const parseLocalDate = (value) => {
  if (!value) return null
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

const parseLocalDateTime = (fecha, hora) => {
  const date = parseLocalDate(fecha)
  if (!date) return null
  const [h, m] = String(hora ?? '00:00').split(':').map(Number)
  date.setHours(Number.isNaN(h) ? 0 : h, Number.isNaN(m) ? 0 : m, 0, 0)
  return date
}

const formatFechaCorta = (value) => {
  const date = parseLocalDate(value)
  if (!date) return 'Sin fecha'
  return `${DIAS_SEMANA[date.getDay()]}, ${date.getDate()} de ${MESES[date.getMonth()]}`
}

const shouldShowTarea = (fechaEntrega, hoy, limite) => {
  const fecha = parseLocalDate(fechaEntrega)
  if (!fecha) return false

  const fechaStr = toLocalDateString(fecha)
  const hoyStr = toLocalDateString(hoy)
  const vencida = fechaStr < hoyStr

  return vencida || fecha <= limite
}

const timeToMinutes = (value) => {
  if (!value) return null
  const [h, m] = String(value).split(':').map(Number)
  if (Number.isNaN(h)) return null
  return h * 60 + (m || 0)
}

const formatHourLabel = (hour) => `${pad(hour)}:00`

const formatFechaHoraCorta = (fecha, hora) => {
  const fechaTexto = formatFechaCorta(fecha)
  if (!hora) return fechaTexto
  return `${fechaTexto} · ${hora}`
}

const getExamenUrgencia = (fecha, hora, ahora) => {
  const target = parseLocalDateTime(fecha, hora)
  if (!target) {
    return { nivel: 'verde', emoji: '🟢', dias: null, texto: 'Sin fecha' }
  }

  const diffMs = target.getTime() - ahora.getTime()
  const dias = Math.floor(diffMs / 86400000)

  if (diffMs <= 0) {
    return {
      nivel: 'rojo',
      emoji: '🔴',
      dias,
      texto: 'Hoy / vencido',
    }
  }

  if (dias <= 3) {
    return {
      nivel: 'rojo',
      emoji: '🔴',
      dias,
      texto: `${dias} día${dias === 1 ? '' : 's'}${dias > 0 ? '' : ', <24h'}`,
    }
  }

  if (dias <= 7) {
    return {
      nivel: 'amarillo',
      emoji: '🟡',
      dias,
      texto: `${dias} días`,
    }
  }

  return { nivel: 'verde', emoji: '🟢', dias, texto: `${dias} días` }
}

const inputClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

const INITIAL_EXAMEN_FORM = {
  materia: '',
  fecha: '',
  hora: '',
  aula: '',
}

const fetchHorariosQuery = () =>
  supabase
    .from('horarios')
    .select('*')
    .order('hora_inicio', { ascending: true })

const fetchTareasQuery = () =>
  supabase
    .from('tareas')
    .select('id, titulo, materia, fecha_entrega, estado, prioridad')
    .eq('estado', 'pendiente')
    .order('fecha_entrega', { ascending: true, nullsFirst: false })

const fetchExamenesQuery = () =>
  supabase
    .from('examenes')
    .select('id, materia, fecha, hora, aula')
    .order('fecha', { ascending: true, nullsFirst: false })
    .order('hora', { ascending: true, nullsFirst: false })

const applyDashboardResults = ({
  horariosResult,
  tareasResult,
  examenesResult,
  hoy,
  limite,
  isActive,
  setHorarios,
  setTareas,
  setExamenes,
  setError,
  setLoading,
}) => {
  if (!isActive()) return

  const errores = []

  if (horariosResult.error) {
    setHorarios([])
    errores.push(`horarios: ${horariosResult.error.message}`)
  } else {
    setHorarios(horariosResult.data ?? [])
  }

  if (tareasResult.error) {
    setTareas([])
    errores.push(`tareas: ${tareasResult.error.message}`)
  } else {
    const filtradas = (tareasResult.data ?? []).filter((tarea) =>
      shouldShowTarea(tarea.fecha_entrega, hoy, limite)
    )
    setTareas(filtradas.slice(0, 8))
  }

  if (examenesResult.error) {
    setExamenes([])
    errores.push(`examenes: ${examenesResult.error.message}`)
  } else {
    const ahora = hoy
    const futuros = (examenesResult.data ?? [])
      .filter((examen) => {
        const target = parseLocalDateTime(examen.fecha, examen.hora)
        return target && target.getTime() >= ahora.getTime() - 86400000
      })
      .sort((a, b) => {
        const ta = parseLocalDateTime(a.fecha, a.hora)?.getTime() ?? 0
        const tb = parseLocalDateTime(b.fecha, b.hora)?.getTime() ?? 0
        return ta - tb
      })
      .slice(0, 6)
    setExamenes(futuros)
  }

  setError(errores.length ? `Errores al cargar: ${errores.join(' | ')}` : null)
  setLoading(false)
}

function buildGridPlacement(horarios) {
  const gridStart = START_HOUR * 60
  const gridEnd = END_HOUR * 60

  return horarios
    .map((clase) => {
      const dayIndex = DIAS_CLASES.indexOf(clase.dia_semana)
      const startMin = timeToMinutes(clase.hora_inicio)
      const endMin = timeToMinutes(clase.hora_fin)

      if (dayIndex < 0 || startMin === null) return null
      if (startMin < gridStart || startMin >= gridEnd) return null

      const clampedEnd =
        endMin === null || endMin <= startMin
          ? Math.min(startMin + 60, gridEnd)
          : Math.min(endMin, gridEnd)

      const startRowOffset = Math.floor((startMin - gridStart) / 60)
      const span = Math.max(
        1,
        Math.ceil((clampedEnd - (gridStart + startRowOffset * 60)) / 60)
      )
      const maxSpan = HOURS.length - startRowOffset
      const rowSpan = Math.min(span, maxSpan)

      return {
        ...clase,
        dayIndex,
        gridRow: 2 + startRowOffset,
        rowSpan,
        gridColumn: 2 + dayIndex,
      }
    })
    .filter(Boolean)
}

function DecorativeFrame({ children }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-4 shadow-xl sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full border-4 border-pink-400/40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-6 top-20 h-24 w-24 rounded-full bg-pink-400/20 blur-sm"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 top-8 h-40 w-40 rotate-45 rounded-3xl border-4 border-amber-300/40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-10 -top-8 h-20 w-20 rounded-full bg-amber-300/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 left-1/3 h-36 w-36 rounded-full border-4 border-teal-300/40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-6 right-6 h-16 w-16 rounded-full bg-teal-300/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-10 top-1/2 h-1 w-40 -rotate-12 bg-gradient-to-r from-pink-400/50 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-16 left-4 h-1 w-52 rotate-6 bg-gradient-to-r from-transparent via-amber-300/50 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-4 top-1/3 h-1 w-36 -rotate-45 bg-gradient-to-r from-teal-300/50 to-transparent"
      />
      <div className="relative">{children}</div>
    </div>
  )
}

function WeeklyGrid({ horarios, diaHoy }) {
  const placed = useMemo(() => buildGridPlacement(horarios), [horarios])
  const initialDay = DIAS_CLASES.includes(diaHoy) ? diaHoy : DIAS_CLASES[0]
  const [activeDay, setActiveDay] = useState(initialDay)

  const dayClasses = useMemo(
    () =>
      horarios
        .filter((clase) => clase.dia_semana === activeDay)
        .sort((a, b) => (a.hora_inicio ?? '').localeCompare(b.hora_inicio ?? '')),
    [horarios, activeDay]
  )

  return (
    <div>
      <div className="mb-3 flex gap-1 overflow-x-auto pb-1 md:hidden">
        {DIAS_CLASES.map((dia) => {
          const isActive = dia === activeDay
          const tabStyle =
            DIAS_TAB_STYLES[dia] ??
            'bg-slate-700 text-slate-200 border-slate-600'

          return (
            <button
              key={dia}
              type="button"
              onClick={() => setActiveDay(dia)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold uppercase transition ${tabStyle} ${
                isActive
                  ? 'ring-2 ring-indigo-400 ring-offset-2 ring-offset-slate-900'
                  : 'opacity-70'
              }`}
            >
              {dia.slice(0, 3)}
              {dia === diaHoy && <span className="ml-1 text-[9px]">•</span>}
            </button>
          )
        })}
      </div>

      <div className="md:hidden">
        {dayClasses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-teal-400/40 bg-slate-800/80 px-4 py-8 text-center">
            <p className="font-medium text-teal-200">Sin clases este día</p>
            <p className="mt-1 text-sm text-slate-400">
              Selecciona otro día o agrega clases al horario.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {dayClasses.map((clase) => {
              const colorClass = getMateriaBlockClass(clase.materia)

              return (
                <div
                  key={clase.id}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-3 shadow-sm ${colorClass}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {clase.materia}
                    </p>
                    <p className="mt-0.5 text-xs opacity-80">
                      {clase.hora_inicio} – {clase.hora_fin}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-white/70 px-2 py-1 text-xs font-semibold text-slate-700">
                    {clase.aula}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <div
          className="grid min-w-[720px] gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner"
          style={{
            gridTemplateColumns: `72px repeat(${DIAS_CLASES.length}, minmax(0, 1fr))`,
            gridTemplateRows: `auto repeat(${HOURS.length}, minmax(76px, auto))`,
          }}
        >
          <div className="border-b border-r border-slate-200 bg-slate-50" />

          {DIAS_CLASES.map((dia) => {
            const isHoy = dia === diaHoy
            const tabStyle =
              DIAS_TAB_STYLES[dia] ??
              'bg-slate-200 text-slate-800 border-slate-300'

            return (
              <div
                key={dia}
                className="border-b border-r border-slate-200 bg-slate-50 p-2 last:border-r-0"
              >
                <div
                  className={`mx-auto rounded-full border px-3 py-1.5 text-center text-xs font-bold uppercase tracking-wide shadow-sm sm:text-sm ${tabStyle} ${
                    isHoy ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                  }`}
                >
                  {dia}
                  {isHoy && (
                    <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-normal opacity-80">
                      hoy
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {HOURS.map((hour, index) => (
            <div
              key={hour}
              className="flex items-start justify-end border-b border-r border-slate-200 bg-slate-50 px-2 py-2"
              style={{ gridColumn: 1, gridRow: 2 + index }}
            >
              <span className="text-[11px] font-semibold text-slate-500">
                {formatHourLabel(hour)}
              </span>
            </div>
          ))}

          {HOURS.map((hour, rowIndex) =>
            DIAS_CLASES.map((dia, dayIdx) => (
              <div
                key={`${dia}-${hour}`}
                className="border-b border-r border-slate-100 last:border-r-0"
                style={{
                  gridColumn: 2 + dayIdx,
                  gridRow: 2 + rowIndex,
                }}
              />
            ))
          )}

          {placed.map((clase) => {
            const colorClass = getMateriaBlockClass(clase.materia)

            return (
              <div
                key={clase.id}
                className={`z-10 m-1 flex flex-col items-center justify-center rounded-xl border px-2 py-2 text-center shadow-sm transition ${colorClass}`}
                style={{
                  gridColumn: clase.gridColumn,
                  gridRow: `${clase.gridRow} / span ${clase.rowSpan}`,
                }}
                title={`${clase.materia} · ${clase.hora_inicio}–${clase.hora_fin} · ${clase.aula}`}
              >
                <span className="text-xs font-bold leading-tight sm:text-sm">
                  {clase.materia}
                </span>
                <span className="mt-1 rounded-md bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                  {clase.aula}
                </span>
                <span className="mt-0.5 text-[10px] opacity-75">
                  {clase.hora_inicio}–{clase.hora_fin}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ExamenesWidget({
  examenes,
  ahora,
  loading,
  onSubmitExamen,
  onDeleteExamen,
  submitting,
  deletingId,
  form,
  onChangeForm,
  isModalOpen,
  onOpenModal,
  onCloseModal,
  error,
}) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <AlarmClock className="h-4 w-4 text-rose-500" />
          Próximos Exámenes
        </h2>
        <button
          type="button"
          onClick={onOpenModal}
          aria-label="Agregar examen"
          className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-8 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando...
          </div>
        ) : examenes.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-500">
            No hay exámenes programados. Agrega uno con el botón «Nuevo».
          </p>
        ) : (
          examenes.map((examen) => {
            const urgencia = getExamenUrgencia(examen.fecha, examen.hora, ahora)

            return (
              <article
                key={examen.id}
                className="rounded-xl border border-slate-100 bg-slate-50/80 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className="text-sm">
                        {urgencia.emoji}
                      </span>
                      <h3 className="truncate text-xs font-semibold text-slate-900">
                        {examen.materia}
                      </h3>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-slate-500">
                      {formatFechaHoraCorta(examen.fecha, examen.hora)}
                    </p>
                    {examen.aula && (
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-slate-600">
                        <MapPin className="h-3 w-3" />
                        {examen.aula}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
                        urgencia.nivel === 'rojo'
                          ? 'bg-red-100 text-red-700 ring-red-200'
                          : urgencia.nivel === 'amarillo'
                            ? 'bg-amber-100 text-amber-700 ring-amber-200'
                            : 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                      }`}
                    >
                      {urgencia.texto}
                    </span>

                    <button
                      type="button"
                      onClick={() => onDeleteExamen(examen.id)}
                      disabled={deletingId === examen.id}
                      aria-label={`Eliminar examen de ${examen.materia}`}
                      className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === examen.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            )
          })
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="examenes-modal-title"
          onClick={onCloseModal}
        >
          <div
            className="w-11/12 max-h-[90vh] overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6 md:max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2
                  id="examenes-modal-title"
                  className="flex items-center gap-2 text-lg font-semibold text-slate-900"
                >
                  <AlarmClock className="h-5 w-5 text-rose-500" />
                  Nuevo Examen
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Registra la fecha y hora de tu próximo examen.
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseModal}
                aria-label="Cerrar modal"
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={onSubmitExamen} className="space-y-4" autoComplete="off">
              <div>
                <label
                  htmlFor="examen-materia"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Materia
                </label>
                <input
                  id="examen-materia"
                  name="materia"
                  type="text"
                  required
                  value={form.materia}
                  onChange={onChangeForm}
                  placeholder="Ej. Cálculo I"
                  className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="examen-fecha"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Fecha
                  </label>
                  <input
                    id="examen-fecha"
                    name="fecha"
                    type="date"
                    required
                    value={form.fecha}
                    onChange={onChangeForm}
                    className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
                </div>

                <div>
                  <label
                    htmlFor="examen-hora"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Hora
                  </label>
                  <input
                    id="examen-hora"
                    name="hora"
                    type="time"
                    required
                    value={form.hora}
                    onChange={onChangeForm}
                    className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
                </div>
              </div>

              <div>
                <label
                  htmlFor="examen-aula"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Aula (opcional)
                </label>
                <input
                  id="examen-aula"
                  name="aula"
                  type="text"
                  value={form.aula}
                  onChange={onChangeForm}
                  placeholder="Ej. Aula 204"
                  className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={onCloseModal}
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

export default function Home() {
  const [horariosSemana, setHorariosSemana] = useState([])
  const [tareasPendientes, setTareasPendientes] = useState([])
  const [examenes, setExamenes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [togglingId, setTogglingId] = useState(null)
  const [submittingExamen, setSubmittingExamen] = useState(false)
  const [deletingExamenId, setDeletingExamenId] = useState(null)
  const [isExamenModalOpen, setIsExamenModalOpen] = useState(false)
  const [examenForm, setExamenForm] = useState(INITIAL_EXAMEN_FORM)
  const [examenError, setExamenError] = useState(null)
  const [now, setNow] = useState(() => new Date())
  const isActiveRef = useRef(true)

  const diaHoy = DIAS_SEMANA[now.getDay()]
  const fechaTexto = `${diaHoy}, ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}`

  const clasesHoy = useMemo(
    () => horariosSemana.filter((item) => item.dia_semana === diaHoy).length,
    [horariosSemana, diaHoy]
  )

  const loadDashboard = useCallback(async () => {
    const hoy = new Date()
    const limite = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() + 7
    )

    const [horariosResult, tareasResult, examenesResult] = await Promise.all([
      fetchHorariosQuery(),
      fetchTareasQuery(),
      fetchExamenesQuery(),
    ])

    applyDashboardResults({
      horariosResult,
      tareasResult,
      examenesResult,
      hoy,
      limite,
      isActive: () => isActiveRef.current,
      setHorarios: setHorariosSemana,
      setTareas: setTareasPendientes,
      setExamenes,
      setError,
      setLoading,
    })
  }, [])

  useEffect(() => {
    isActiveRef.current = true
    const hoy = new Date()
    const limite = new Date(
      hoy.getFullYear(),
      hoy.getMonth(),
      hoy.getDate() + 7
    )

    Promise.all([
      fetchHorariosQuery(),
      fetchTareasQuery(),
      fetchExamenesQuery(),
    ]).then(([horariosResult, tareasResult, examenesResult]) => {
      applyDashboardResults({
        horariosResult,
        tareasResult,
        examenesResult,
        hoy,
        limite,
        isActive: () => isActiveRef.current,
        setHorarios: setHorariosSemana,
        setTareas: setTareasPendientes,
        setExamenes,
        setError,
        setLoading,
      })
    })

    return () => {
      isActiveRef.current = false
    }
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => clearInterval(intervalId)
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    setError(null)
    loadDashboard()
  }

  const handleToggleCompletada = async (tarea) => {
    setTogglingId(tarea.id)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('tareas')
        .update({ estado: 'completado' })
        .eq('id', tarea.id)

      if (updateError) {
        throw new Error(updateError.message)
      }

      setTareasPendientes((prev) =>
        prev.filter((item) => item.id !== tarea.id)
      )
    } catch (err) {
      setError(`No se pudo completar la tarea: ${err.message}`)
    } finally {
      setTogglingId(null)
    }
  }

  const handleExamenFormChange = (e) => {
    const { name, value } = e.target
    setExamenForm((prev) => ({ ...prev, [name]: value }))
  }

  const openExamenModal = () => {
    setExamenError(null)
    setExamenForm(INITIAL_EXAMEN_FORM)
    setIsExamenModalOpen(true)
  }

  const closeExamenModal = () => {
    if (submittingExamen) return
    setIsExamenModalOpen(false)
  }

  const handleSubmitExamen = async (e) => {
    e.preventDefault()
    setExamenError(null)
    setSubmittingExamen(true)

    try {
      const { error: insertError } = await supabase
        .from('examenes')
        .insert([
          {
            materia: examenForm.materia,
            fecha: examenForm.fecha,
            hora: examenForm.hora,
            aula: examenForm.aula,
          },
        ])

      if (insertError) {
        throw new Error(insertError.message)
      }

      setIsExamenModalOpen(false)
      setExamenForm(INITIAL_EXAMEN_FORM)
      setNow(new Date())

      const result = await fetchExamenesQuery()
      const ahora = new Date()

      if (result.error) {
        setExamenes([])
        setError(`examenes: ${result.error.message}`)
        return
      }

      const futuros = (result.data ?? [])
        .filter((examen) => {
          const target = parseLocalDateTime(examen.fecha, examen.hora)
          return target && target.getTime() >= ahora.getTime() - 86400000
        })
        .sort((a, b) => {
          const ta = parseLocalDateTime(a.fecha, a.hora)?.getTime() ?? 0
          const tb = parseLocalDateTime(b.fecha, b.hora)?.getTime() ?? 0
          return ta - tb
        })
        .slice(0, 6)

      setExamenes(futuros)
    } catch (err) {
      setExamenError(`No se pudo crear el examen: ${err.message}`)
    } finally {
      setSubmittingExamen(false)
    }
  }

  const handleDeleteExamen = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este examen?')) {
      return
    }

    setExamenError(null)
    setDeletingExamenId(id)

    try {
      const { error: deleteError } = await supabase
        .from('examenes')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setExamenes((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setExamenError(`No se pudo eliminar el examen: ${err.message}`)
    } finally {
      setDeletingExamenId(null)
    }
  }

  const proximoExamen = examenes[0]
  const urgenciaProximo = proximoExamen
    ? getExamenUrgencia(proximoExamen.fecha, proximoExamen.hora, now)
    : null

  return (
    <div className="mx-auto max-w-7xl overflow-x-hidden px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-4 text-white shadow-lg shadow-indigo-600/20 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-indigo-100">
            <Sparkles className="h-4 w-4" />
            Centro de Control
          </p>
          <h1 className="mt-1 text-lg font-bold sm:text-2xl lg:text-3xl">
            ¡Hola! Bienvenido a tu Centro de Control
          </h1>
          <p className="mt-1 text-sm text-indigo-100">{fechaTexto}</p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2.5 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-50 md:py-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          Actualizar
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarClock className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Clases hoy
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900">{clasesHoy}</p>
          <p className="text-xs text-slate-500">{diaHoy}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <ClipboardList className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Tareas esta semana
            </span>
          </div>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {tareasPendientes.length}
          </p>
          <p className="text-xs text-slate-500">Pendientes o vencidas</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Próximo examen
            </span>
          </div>
          {proximoExamen ? (
            <>
              <div className="mt-1 flex items-center gap-2">
                <span aria-hidden="true" className="text-lg">
                  {urgenciaProximo.emoji}
                </span>
                <p className="truncate text-lg font-bold text-slate-900">
                  {proximoExamen.materia}
                </p>
              </div>
              <p className="text-xs text-slate-500">
                {formatFechaHoraCorta(proximoExamen.fecha, proximoExamen.hora)}
              </p>
              <span
                className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${
                  urgenciaProximo.nivel === 'rojo'
                    ? 'bg-red-100 text-red-700 ring-red-200'
                    : urgenciaProximo.nivel === 'amarillo'
                      ? 'bg-amber-100 text-amber-700 ring-amber-200'
                      : 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                }`}
              >
                {urgenciaProximo.texto}
              </span>
            </>
          ) : (
            <>
              <p className="mt-1 text-2xl font-bold text-slate-900">—</p>
              <p className="text-xs text-slate-500">Sin exámenes próximos</p>
            </>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500">
            <FolderArchive className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Accesos rápidos
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              to="/repositorio"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
            >
              <FolderArchive className="h-3 w-3" />
              PDFs
            </Link>
            <Link
              to="/enlaces"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <BookOpen className="h-3 w-3" />
              Enlaces
            </Link>
            <Link
              to="/notas"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <BookOpen className="h-3 w-3" />
              Notas
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando...
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-12">
          <section className="min-w-0 lg:col-span-8 xl:col-span-9">
            <DecorativeFrame>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <CalendarClock className="h-5 w-5 text-teal-300" />
                    Mi Horario Semanal
                  </h2>
                  <p className="text-xs text-slate-400">
                    Vista completa de tu semana académica · {START_HOUR}:00 –{' '}
                    {END_HOUR}:00
                  </p>
                </div>
                <Link
                  to="/horarios"
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                >
                  Gestionar horario →
                </Link>
              </div>

              {horariosSemana.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-teal-400/40 bg-slate-800/80 px-6 py-12 text-center">
                  <p className="text-2xl">🎉</p>
                  <p className="mt-2 font-medium text-teal-200">
                    Tu semana está libre
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Agrega clases desde el módulo de horarios para verlas aquí.
                  </p>
                </div>
              ) : (
                <WeeklyGrid horarios={horariosSemana} diaHoy={diaHoy} />
              )}
            </DecorativeFrame>
          </section>

          <aside className="flex min-w-0 flex-col gap-5 lg:col-span-4 xl:col-span-3">
            <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CheckSquare className="h-4 w-4 text-amber-500" />
                  Tareas de la Semana
                </h2>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  {tareasPendientes.length}
                </span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {tareasPendientes.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-200 px-3 py-8 text-center text-xs text-slate-500">
                    No hay tareas por vencer en 7 días. ¡Todo al día!
                  </p>
                ) : (
                  tareasPendientes.map((tarea) => {
                    const prioridad = (
                      tarea.prioridad ?? 'media'
                    ).toLowerCase()

                    return (
                      <article
                        key={tarea.id}
                        className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleCompletada(tarea)}
                          disabled={togglingId === tarea.id}
                          aria-label={`Marcar ${tarea.titulo} como completada`}
                          className="group mt-0.5 flex shrink-0 items-center justify-center rounded border-2 border-slate-300 transition hover:border-emerald-500 hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ width: 18, height: 18 }}
                        >
                          {togglingId === tarea.id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                          ) : (
                            <Check className="h-3 w-3 text-transparent group-hover:text-white" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="truncate text-xs font-semibold text-slate-900">
                              {tarea.titulo}
                            </h3>
                            <span
                              className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${PRIORIDAD_STYLES[prioridad] ?? PRIORIDAD_STYLES.media}`}
                            >
                              {prioridad}
                            </span>
                          </div>
                          <p className="truncate text-[11px] text-slate-500">
                            {tarea.materia}
                          </p>
                          <p className="mt-1 text-[10px] font-medium text-slate-600">
                            {formatFechaCorta(tarea.fecha_entrega)}
                          </p>
                        </div>
                      </article>
                    )
                  })
                )}
              </div>

              <div className="border-t border-slate-100 px-4 py-3">
                <Link
                  to="/tareas"
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Ver todas mis tareas →
                </Link>
              </div>
            </div>

            <ExamenesWidget
              examenes={examenes}
              ahora={now}
              loading={false}
              onSubmitExamen={handleSubmitExamen}
              onDeleteExamen={handleDeleteExamen}
              submitting={submittingExamen}
              deletingId={deletingExamenId}
              form={examenForm}
              onChangeForm={handleExamenFormChange}
              isModalOpen={isExamenModalOpen}
              onOpenModal={openExamenModal}
              onCloseModal={closeExamenModal}
              error={examenError}
            />
          </aside>
        </div>
      )}
    </div>
  )
}
