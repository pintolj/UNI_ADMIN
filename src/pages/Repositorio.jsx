import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ExternalLink,
  FileText,
  FolderArchive,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { supabase } from '../supabase/client'

const INITIAL_FORM = {
  titulo: '',
  materia: '',
  descripcion: '',
}

const inputClasses =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'

const STORAGE_BUCKET = 'pdfs-repositorio'

const repositorioQuery = () =>
  supabase
    .from('repositorio')
    .select('id, titulo, materia, descripcion, archivo_url')
    .order('id', { ascending: false })

const sanitizeFileName = (name) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(-80)

export default function Repositorio() {
  const [recursos, setRecursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [file, setFile] = useState(null)
  const [externalUrl, setExternalUrl] = useState('')
  const [uploadProgress, setUploadProgress] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearch] = useState('')

  const applyResult = useCallback(({ data, error: fetchError }) => {
    if (fetchError) {
      setRecursos([])
      setError(`Error al cargar el repositorio: ${fetchError.message}`)
    } else {
      setError(null)
      setRecursos(data ?? [])
    }
    setLoading(false)
  }, [])

  const fetchRecursos = useCallback(async () => {
    applyResult(await repositorioQuery())
  }, [applyResult])

  useEffect(() => {
    let active = true

    repositorioQuery().then((result) => {
      if (active) applyResult(result)
    })

    return () => {
      active = false
    }
  }, [applyResult])

  const filteredRecursos = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return recursos

    return recursos.filter((recurso) => {
      const titulo = (recurso.titulo ?? '').toLowerCase()
      const materia = (recurso.materia ?? '').toLowerCase()
      const descripcion = (recurso.descripcion ?? '').toLowerCase()
      return (
        titulo.includes(term) ||
        materia.includes(term) ||
        descripcion.includes(term)
      )
    })
  }, [recursos, search])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0] ?? null
    setError(null)

    if (!selected) {
      setFile(null)
      return
    }

    if (
      selected.type !== 'application/pdf' &&
      !selected.name.toLowerCase().endsWith('.pdf')
    ) {
      setFile(null)
      setError('Solo se permiten archivos PDF.')
      return
    }

    setFile(selected)
    setExternalUrl('')
  }

  const openModal = () => {
    setError(null)
    setForm(INITIAL_FORM)
    setFile(null)
    setExternalUrl('')
    setUploadProgress(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    if (submitting) return
    setIsModalOpen(false)
  }

  const uploadPdf = async (pdfFile) => {
    const extension = '.pdf'
    const base = sanitizeFileName(pdfFile.name.replace(/\.pdf$/i, '')) || 'archivo'
    const fileName = `${Date.now()}-${base}${extension}`

    setUploadProgress('Subiendo PDF a Supabase Storage...')

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, pdfFile, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(uploadError.message)
    }

    setUploadProgress('Generando URL pública...')

    const { data: publicData, error: urlError } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    if (urlError) {
      throw new Error(urlError.message)
    }

    setUploadProgress(null)
    return publicData.publicUrl
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!file && !externalUrl.trim()) {
      setError('Sube un PDF o pega una URL externa.')
      return
    }

    setSubmitting(true)

    try {
      let archivoUrl = externalUrl.trim()

      if (file) {
        archivoUrl = await uploadPdf(file)
      }

      const { error: insertError } = await supabase.from('repositorio').insert([
        {
          titulo: form.titulo,
          materia: form.materia,
          descripcion: form.descripcion,
          archivo_url: archivoUrl,
        },
      ])

      if (insertError) {
        throw new Error(insertError.message)
      }

      setIsModalOpen(false)
      setForm(INITIAL_FORM)
      setFile(null)
      setExternalUrl('')
      setSuccess('Recurso agregado al repositorio.')
      await fetchRecursos()
    } catch (err) {
      setError(`No se pudo crear el recurso: ${err.message}`)
    } finally {
      setUploadProgress(null)
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este recurso?')) {
      return
    }

    setError(null)
    setSuccess(null)
    setDeletingId(id)

    try {
      const { error: deleteError } = await supabase
        .from('repositorio')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      setSuccess('Recurso eliminado correctamente.')
      setRecursos((prev) => prev.filter((recurso) => recurso.id !== id))
    } catch (err) {
      setError(`No se pudo eliminar el recurso: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl overflow-x-hidden px-3 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4 sm:mb-8">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 sm:text-2xl">
            <FolderArchive className="h-6 w-6 shrink-0 text-indigo-600 sm:h-7 sm:w-7" />
            Mi Repositorio / PDFs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sube PDFs a la nube o guarda enlaces externos de tus documentos.
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              fetchRecursos()
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
            Agregar Recurso
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
            id="repositorio-search"
            name="repositorio-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, materia o descripción..."
            aria-label="Buscar en el repositorio"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            className={`${inputClasses} pl-9`}
          />
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-16 text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando...
        </div>
      ) : filteredRecursos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
          {search
            ? 'No se encontraron recursos con esa búsqueda.'
            : 'Tu repositorio está vacío. Agrega tu primer PDF o proyecto.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecursos.map((recurso) => (
            <article
              key={recurso.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <FileText className="h-5 w-5" />
                </span>
                <span className="inline-flex max-w-[60%] truncate rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {recurso.materia}
                </span>
              </div>

              <h3 className="font-semibold text-slate-900">
                {recurso.titulo}
              </h3>

              {recurso.descripcion && (
                <p className="mt-1.5 line-clamp-3 text-sm text-slate-500">
                  {recurso.descripcion}
                </p>
              )}

              <div className="mt-auto flex items-center gap-2 pt-4">
                <a
                  href={recurso.archivo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver / Abrir Documento
                </a>

                <button
                  type="button"
                  onClick={() => handleDelete(recurso.id)}
                  disabled={deletingId === recurso.id}
                  aria-label="Eliminar recurso"
                  className="inline-flex items-center rounded-lg bg-red-600 p-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletingId === recurso.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="repositorio-modal-title"
          onClick={closeModal}
        >
          <div
            className="max-h-[90vh] w-11/12 overflow-y-auto rounded-xl bg-white p-4 shadow-xl sm:p-6 md:max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2
                  id="repositorio-modal-title"
                  className="flex items-center gap-2 text-lg font-semibold text-slate-900"
                >
                  <FolderArchive className="h-5 w-5 text-indigo-600" />
                  Agregar Recurso
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Sube un PDF a Storage o pega una URL externa.
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
                  Título del proyecto
                </label>
                <input
                  id="titulo"
                  name="titulo"
                  type="text"
                  required
                  value={form.titulo}
                  onChange={handleChange}
                  placeholder="Ej. Proyecto Final - Base de Datos"
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
                  placeholder="Ej. Bases de Datos"
                  className={inputClasses} autoComplete="off" autoCorrect="off" spellCheck="false" />
              </div>

              <div>
                <label
                  htmlFor="descripcion"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Descripción breve
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  rows={3}
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Nota rápida sobre el contenido del archivo..."
                  className={`${inputClasses} resize-none`} autoComplete="off" autoCorrect="off" spellCheck="false" />
              </div>

              <div>
                <label
                  htmlFor="archivo_pdf"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Subir PDF
                </label>
                <label
                  htmlFor="archivo_pdf"
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition ${
                    file
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                      : 'border-slate-300 bg-slate-50 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50'
                  } ${submitting ? 'pointer-events-none opacity-60' : ''}`}
                >
                  {submitting && uploadProgress ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {uploadProgress}
                    </>
                  ) : file ? (
                    <>
                      <FileText className="h-4 w-4" />
                      {file.name}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Seleccionar archivo PDF
                    </>
                  )}
                  <input
                    id="archivo_pdf"
                    name="archivo_pdf"
                    type="file"
                    accept=".pdf,application/pdf"
                    className="sr-only"
                    onChange={handleFileChange}
                    disabled={submitting} autoComplete="off" autoCorrect="off" spellCheck="false" />
                </label>

                {file && !submitting && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full w-full rounded-full bg-indigo-500" />
                  </div>
                )}

                {uploadProgress && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    {uploadProgress}
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="archivo_url"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  O pegar URL externa (opcional)
                </label>
                <input
                  id="archivo_url"
                  name="archivo_url"
                  type="url"
                  value={externalUrl}
                  onChange={(e) => {
                    setExternalUrl(e.target.value)
                    if (e.target.value.trim()) setFile(null)
                  }}
                  disabled={Boolean(file) || submitting}
                  placeholder="https://drive.google.com/... o enlace a PDF"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className={`${inputClasses} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  {file
                    ? 'Se usará el PDF subido a Storage.'
                    : 'Si subes un PDF, este campo se ignora.'}
                </p>
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
                  disabled={submitting || (!file && !externalUrl.trim())}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 md:py-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {submitting
                    ? uploadProgress || 'Guardando...'
                    : file
                      ? 'Subir y guardar'
                      : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
