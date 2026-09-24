# UNI ADMIN — Organización Académica Personal

Dashboard personal para organizar tu vida universitaria: horarios, tareas,
repositorio de PDFs, enlaces rápidos, notas, profesores y estudiantes.

**URL:** https://uni-admin.vercel.app

**Stack:** React 19 · Vite · Tailwind CSS · Supabase · React Router

---

## Requisitos

- Node.js 18+
- Un proyecto en [Supabase](https://supabase.com)

---

## Instalación

```bash
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
npm install
```

### Variables de entorno

Crea un archivo `.env.local` en la raíz:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

> Encuentras ambos valores en **Supabase → Project Settings → API**.

---

## Base de datos

En el **SQL Editor de Supabase**, ejecuta:

```sql
create table if not exists horarios (
  id uuid primary key default gen_random_uuid(),
  materia text not null,
  profesor text,
  dia_semana text not null,
  hora_inicio time not null,
  hora_fin time not null,
  aula text
);

create table if not exists tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  materia text not null,
  fecha_entrega date not null,
  prioridad text not null default 'media',
  descripcion text
);

create table if not exists repositorio (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  materia text not null,
  descripcion text,
  archivo_url text not null
);

create table if not exists enlaces (
  id uuid primary key default gen_random_uuid(),
  materia text not null,
  tipo text not null,
  nombre text not null,
  url text not null
);

create table if not exists evaluaciones (
  id uuid primary key default gen_random_uuid(),
  materia text not null,
  nombre text not null,
  porcentaje numeric not null,
  nota numeric
);

create table if not exists examenes (
  id uuid primary key default gen_random_uuid(),
  materia text not null,
  fecha date not null,
  hora time,
  aula text
);

create table if not exists profesores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  email text,
  telefono text,
  especialidad text
);

create table if not exists estudiantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  matricula text not null,
  email text,
  carrera text not null,
  semestre int not null
);
```

### Permisos y RLS

```sql
do $$
declare
  t text;
  tables text[] := array[
    'horarios','profesores','estudiantes','tareas',
    'repositorio','evaluaciones','enlaces','examenes'
  ];
begin
  foreach t in array tables loop
    if to_regclass('public.' || t) is null then continue; end if;

    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "%s_full" on public.%I', t, t);
    execute format(
      'create policy "%s_full" on public.%I for all to anon using (true) with check (true)',
      t, t
    );
    execute format('grant all on public.%I to anon', t);
    execute format('grant all on public.%I to authenticated', t);
  end loop;
end $$;
```

### Storage (PDFs)

1. Crea un bucket público llamado `pdfs-repositorio`.
2. En **Storage → Policies** agrega:

```sql
create policy "public read"
  on storage.objects for select
  to anon
  using (bucket_id = 'pdfs-repositorio');

create policy "public upload"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'pdfs-repositorio');
```

---

## Ejecutar en local

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173).

---

## Scripts

| Comando           | Descripción              |
|-------------------|--------------------------|
| `npm run dev`     | Servidor de desarrollo   |
| `npm run build`   | Build de producción      |
| `npm run preview` | Vista previa del build   |
| `npm run lint`    | Lint (oxlint)            |

---

## Funcionalidades

- **Inicio** — métricas, próximo examen con cuenta regresiva
- **Horario semanal** — vista por días (mobile) y grilla (desktop)
- **Tareas** — prioridades, fechas de entrega, filtros
- **Repositorio** — subir PDFs a Storage o enlazar URLs externas
- **Enlaces rápidos** — Moodle, Drive, Zoom, WhatsApp por materia
- **Calculadora de notas** — proyección de promedio 0–20 / 0–100
- **Profesores y estudiantes** — directorio con búsqueda
- **Auth** — login/registro con Supabase Auth y rutas protegidas
- **Responsive** — mobile-first con sidebar colapsable

---

## Estructura

```
src/
├── components/ProtectedRoute.jsx
├── contexts/AuthContext.jsx
├── layouts/AdminLayout.jsx
├── pages/
│   ├── Login.jsx
│   ├── Home.jsx
│   ├── Horarios.jsx
│   ├── MisTareas.jsx
│   ├── Repositorio.jsx
│   ├── Enlaces.jsx
│   ├── CalculadoraNotas.jsx
│   ├── Profesores.jsx
│   └── Estudiantes.jsx
├── supabase/client.js
└── utils/materiaColors.js
```

---

## Deploy en Vercel

1. Sube el repo a GitHub.
2. Importa el proyecto en [Vercel](https://vercel.com/new).
3. Framework preset: **Vite** · Build: `npm run build` · Output: `dist`.
4. Agrega las env vars `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
5. Deploy → https://uni-admin.vercel.app

---

## Descripción para GitHub

```
Dashboard de organización académica personal con React + Supabase: horarios, tareas, repositorio de PDFs, enlaces rápidos, calculadora de notas, profesores y estudiantes. Incluye autenticación, diseño responsive y CRUD en tiempo real.
```

---

## Licencia

MIT
