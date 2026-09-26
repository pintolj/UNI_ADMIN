<div align="center">

  # 🎓 Mi Espacio — UNI_ADMIN
  **Dashboard de Organización Académica Personal**

  Un sistema integral, moderno y responsive diseñado para centralizar la vida universitaria, gestionar horarios, tareas, calificaciones, recursos y contactos en tiempo real.

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
  [![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#licencia)

  [Explorar Funcionalidades](#-características) • [Instalación](#-instalación) • [Configuración de Base de Datos](#-base-de-datos--supabase) • [Estructura](#-estructura-del-proyecto)

</div>

---

## 📑 Índice
- [Acerca del Proyecto](#-acerca-del-proyecto)
- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Base de Datos & Supabase](#-base-de-datos--supabase)
  - [Tablas SQL](#1-creación-de-tablas)
  - [Migración: Teléfono y campos opcionales](#2-migración-teléfono-y-campos-opcionales-estudiantes)
  - [Políticas de Seguridad (RLS)](#3-seguridad-y-permisos-rls)
  - [Almacenamiento de Archivos (Storage)](#4-configuración-de-storage-pdfs)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Licencia](#-licencia)

---

## 🚀 Acerca del Proyecto

**UNI_ADMIN / Mi Espacio** es un dashboard académico en tiempo real pensado para estudiantes que buscan optimizar su tiempo y llevar un control total de su rendimiento académico. Permite sincronizar calendarios, calcular un promedio ponderado de calificaciones, gestionar repositorios de archivos PDF y organizar tareas con prioridades.

---

## ✨ Características

| Módulo | Descripción |
| :--- | :--- |
| 📅 **Horarios y Exámenes** | Gestión visual de la agenda semanal, aulas, profesores y fechas clave de exámenes. |
| 📝 **Mis Tareas** | Control de entregas por prioridad (alta, media, baja) y materias asociadas. |
| 📁 **Repositorio PDF** | Subida y descarga directa de documentos, guías y libros desde Supabase Storage. |
| 🧮 **Calculadora de Notas** | Seguimiento de evaluaciones con ponderación porcentual y proyección de promedios. |
| 🔗 **Enlaces Rápidos** | Accesos directos organizados por materia a aulas virtuales, drives y recursos. |
| 👥 **Profesores y Estudiantes** | Directorio de contactos con correo, teléfono y detalles académicos. Los teléfonos se muestran como enlace directo a **WhatsApp** (`wa.me/58...`). |
| 🔐 **Autenticación y RLS** | Rutas protegidas y seguridad a nivel de filas mediante Supabase Auth. |
| 📱 **Diseño Responsive** | Interfaz adaptada a dispositivos móviles, tablets y escritorio. |

---

## 🛠️ Stack Tecnológico

- **Frontend:** [React 19](https://react.dev/), [React Router](https://reactrouter.com/)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **Backend & BaaS:** [Supabase](https://supabase.com/) (PostgreSQL, Authentication, Storage, Realtime)

---

## 📋 Requisitos Previos

Asegúrate de contar con lo siguiente instalado en tu entorno local:

- **Node.js**: Versión `18.0.0` o superior
- **npm** / **pnpm** / **yarn**
- Una cuenta activa en [Supabase](https://supabase.com) con un proyecto creado.

---

## 💻 Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/TU_REPO.git
   cd TU_REPO
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales de Supabase:
   ```env
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

---

## 🗄️ Base de Datos & Supabase

Abre el **SQL Editor** en tu panel de control de Supabase y ejecuta las siguientes sentencias para estructurar tu base de datos:

### 1. Creación de Tablas

```sql
-- Tabla de Horarios
create table if not exists horarios (
  id uuid primary key default gen_random_uuid(),
  materia text not null,
  profesor text,
  dia_semana text not null,
  hora_inicio time not null,
  hora_fin time not null,
  aula text
);

-- Tabla de Tareas
create table if not exists tareas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  materia text not null,
  fecha_entrega date not null,
  prioridad text not null default 'media',
  descripcion text
);

-- Tabla de Repositorio
create table if not exists repositorio (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  materia text not null,
  descripcion text,
  archivo_url text not null
);

-- Tabla de Enlaces
create table if not exists enlaces (
  id uuid primary key default gen_random_uuid(),
  materia text not null,
  tipo text not null,
  nombre text not null,
  url text not null
);

-- Tabla de Evaluaciones
create table if not exists evaluaciones (
  id uuid primary key default gen_random_uuid(),
  materia text not null,
  nombre text not null,
  porcentaje numeric not null,
  nota numeric
);

-- Tabla de Exámenes
create table if not exists examenes (
  id uuid primary key default gen_random_uuid(),
  materia text not null,
  fecha date not null,
  hora time,
  aula text
);

-- Tabla de Profesores
create table if not exists profesores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  email text,
  telefono text,
  especialidad text
);

-- Tabla de Estudiantes
create table if not exists estudiantes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellido text not null,
  carrera text not null,
  telefono text,
  matricula text,
  email text,
  semestre int
);
```

> **Nota:** `nombre`, `apellido`, `telefono` y `carrera` son los campos obligatorios del formulario. `matricula`, `email` y `semestre` son opcionales, por lo que deben admitir `null` (si se dejan en blanco, no se envían al insertar).

### 2. Migración: Teléfono y campos opcionales (Estudiantes)

Si tu tabla `estudiantes` fue creada con la versión anterior (sin `telefono` y con `matricula`/`email`/`semestre` como `not null`), ejecuta esta migración en el **SQL Editor**:

```sql
-- Agregar columna de teléfono (enlace WhatsApp)
alter table public.estudiantes add column if not exists telefono text;

-- Hacer opcionales los campos que ya no son requeridos
alter table public.estudiantes alter column matricula drop not null;
alter table public.estudiantes alter column email drop not null;
alter table public.estudiantes alter column semestre drop not null;
```

> Los teléfonos se guardan como texto libre (ej. `0412 1234567`); al generar el enlace de WhatsApp la app limpia el formato, elimina el `0` inicial y antepone el código de país `58` → `https://wa.me/584121234567`.

### 3. Seguridad y Permisos (RLS)

Aplica el siguiente bloque PL/pgSQL para habilitar **Row Level Security (RLS)** y asignar permisos sobre todas las tablas:

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

### 4. Configuración de Storage (PDFs)

1. En Supabase, ve a **Storage** y crea un bucket **público** llamado: `pdfs-repositorio`.
2. En **Storage → Policies**, agrega las siguientes políticas:

```sql
-- Permitir lectura pública de archivos
create policy "public read"
  on storage.objects for select
  to anon
  using (bucket_id = 'pdfs-repositorio');

-- Permitir subida pública de archivos
create policy "public upload"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'pdfs-repositorio');
```

---

## 📁 Estructura del Proyecto

```text
src/
├── components/
│   └── ProtectedRoute.jsx   # Control de acceso e inicio de sesión
├── contexts/
│   └── AuthContext.jsx      # Proveedor global de autenticación
├── layouts/
│   └── AdminLayout.jsx      # Layout principal con navegación y sidebar
├── pages/
│   ├── Login.jsx            # Vista de inicio de sesión
│   ├── Home.jsx             # Dashboard principal / Resumen
│   ├── Horarios.jsx         # Gestión de horarios académicos
│   ├── MisTareas.jsx        # Lista de tareas y prioridades
│   ├── Repositorio.jsx      # Gestión y descarga de PDFs
│   ├── Enlaces.jsx          # Accesos directos y enlaces de interés
│   ├── CalculadoraNotas.jsx # Calculadora de promedio y ponderaciones
│   ├── Profesores.jsx       # Directorio de docentes
│   └── Estudiantes.jsx      # Registro y directorio de estudiantes
├── supabase/
│   └── client.js            # Cliente e inicialización de Supabase
└── utils/
    └── materiaColors.js     # Utilidad de codificación de colores por materia
```

---

## 📜 Licencia

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo `LICENSE` para obtener más información.

---

<div align="center">
  <sub>Desarrollado para simplificar la gestión universitaria. Usar con responsabilidad.</sub>
</div>