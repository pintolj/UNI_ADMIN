const MATERIA_PASTEL = [
  {
    key: 'azul',
    block:
      'border-sky-300 bg-sky-100 text-sky-900 hover:border-sky-400 hover:bg-sky-200',
    badge: 'border-sky-300 bg-sky-100 text-sky-800',
    chip: 'bg-sky-50 text-sky-800 ring-sky-200',
  },
  {
    key: 'verde',
    block:
      'border-emerald-300 bg-emerald-100 text-emerald-900 hover:border-emerald-400 hover:bg-emerald-200',
    badge: 'border-emerald-300 bg-emerald-100 text-emerald-800',
    chip: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  },
  {
    key: 'rosa',
    block:
      'border-rose-300 bg-rose-100 text-rose-900 hover:border-rose-400 hover:bg-rose-200',
    badge: 'border-rose-300 bg-rose-100 text-rose-800',
    chip: 'bg-rose-50 text-rose-800 ring-rose-200',
  },
  {
    key: 'amarillo',
    block:
      'border-amber-300 bg-amber-100 text-amber-900 hover:border-amber-400 hover:bg-amber-200',
    badge: 'border-amber-300 bg-amber-100 text-amber-800',
    chip: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  {
    key: 'morado',
    block:
      'border-violet-300 bg-violet-100 text-violet-900 hover:border-violet-400 hover:bg-violet-200',
    badge: 'border-violet-300 bg-violet-100 text-violet-800',
    chip: 'bg-violet-50 text-violet-800 ring-violet-200',
  },
  {
    key: 'turquesa',
    block:
      'border-teal-300 bg-teal-100 text-teal-900 hover:border-teal-400 hover:bg-teal-200',
    badge: 'border-teal-300 bg-teal-100 text-teal-800',
    chip: 'bg-teal-50 text-teal-800 ring-teal-200',
  },
  {
    key: 'naranja',
    block:
      'border-orange-300 bg-orange-100 text-orange-900 hover:border-orange-400 hover:bg-orange-200',
    badge: 'border-orange-300 bg-orange-100 text-orange-800',
    chip: 'bg-orange-50 text-orange-800 ring-orange-200',
  },
  {
    key: 'indigo',
    block:
      'border-indigo-300 bg-indigo-100 text-indigo-900 hover:border-indigo-400 hover:bg-indigo-200',
    badge: 'border-indigo-300 bg-indigo-100 text-indigo-800',
    chip: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  },
]

const hashString = (value) => {
  const text = String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  let hash = 0

  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i)
    hash |= 0
  }

  return Math.abs(hash)
}

export const getMateriaColor = (materia) => {
  const index = hashString(materia) % MATERIA_PASTEL.length
  return MATERIA_PASTEL[index]
}

export const getMateriaBlockClass = (materia) =>
  getMateriaColor(materia).block

export const getMateriaBadgeClass = (materia) =>
  getMateriaColor(materia).badge

export const getMateriaChipClass = (materia) =>
  getMateriaColor(materia).chip
