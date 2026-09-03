# AGRIVO - Documentación Detallada de Vistas de la Plataforma

## Guía Visual Completa de Todas las Pantallas

---

## 📋 ÍNDICE DE VISTAS

1. [Header (Navegación Global)](#1-header-navegación-global)
2. [Footer (Pie de Página)](#2-footer-pie-de-página)
3. [Landing Page (Página Principal)](#3-landing-page-página-principal)
4. [Listado de Trabajos](#4-listado-de-trabajos)
5. [Detalle de Trabajo](#5-detalle-de-trabajo)
6. [Crear Trabajo](#6-crear-trabajo)
7. [Directorio de Profesionales](#7-directorio-de-profesionales)
8. [Perfil del Profesional](#8-perfil-del-profesional)
9. [Planes y Precios](#9-planes-y-precios)
10. [Dashboard (Panel de Usuario)](#10-dashboard-panel-de-usuario)
11. [Mensajería](#11-mensajería)
12. [Centro de Disputas](#12-centro-de-disputas)
13. [Verificación KYC](#13-verificación-kyc)
14. [Panel de Administración](#14-panel-de-administración)
15. [Pago Exitoso](#15-pago-exitoso)
16. [Páginas Legales](#16-páginas-legales)
17. [Autenticación](#17-autenticación)

---

## 1. HEADER (NAVEGACIÓN GLOBAL)

### Descripción
Barra de navegación fija (sticky) en la parte superior de todas las páginas. Se adapta al scroll con efecto backdrop-blur y sombra.

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo Agrivo]  │  Inicio  Trabajos  Profesionales  Precios  │ 🇪🇸 ES ▼ │ [Login] [Registrarse] │
└─────────────────────────────────────────────────────────────────────┘
```

### Elementos UI

| Elemento | Componente | Descripción |
|----------|-----------|-------------|
| Logo | `<img>` + `<span>` | Logo 36x36px con nombre "Agrivo" en Poppins bold |
| Navegación | `<Link>` | 4 enlaces: Inicio, Trabajos, Profesionales, Precios |
| Selector idioma | `DropdownMenu` | Banderas con código (ES, EN, PT, FR) |
| Login | `Button ghost` | Texto "Iniciar Sesión" |
| Registro | `Button gradient` | Gradiente emerald-to-teal, texto "Registrarse" |
| Menú usuario | `DropdownMenu` | Avatar circular + nombre (cuando está logueado) |
| Menú móvil | `Sheet` (lateral derecho) | Hamburguesa visible solo en móvil |

### Estados

**Sin autenticación:**
- Muestra botones "Iniciar Sesión" y "Registrarse"
- Los botones se muestran inmediatamente sin esperar la verificación de auth

**Con autenticación:**
- Muestra avatar + nombre del usuario
- Dropdown con: Dashboard, Mensajes, Disputas, Admin Panel, Cerrar Sesión

**Scroll:**
- Sin scroll: fondo sólido, sin borde
- Con scroll (>10px): `bg-background/95 backdrop-blur-md shadow-sm border-b`

### Enlace activo
- Color primario con fondo `bg-primary/5`
- Los demás: `text-muted-foreground`

### Responsive
- Desktop (md+): Navegación horizontal completa
- Móvil: Hamburguesa → Sheet lateral con menú vertical

---

## 2. FOOTER (PIE DE PÁGINA)

### Descripción
Pie de página con información de la empresa, enlaces rápidos, categorías y datos legales.

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo Agrivo]          │ Enlaces Rápidos    │ Categorías        │ Legal           │
│ Descripción corta      │ • Trabajos         │ • Drones          │ • Privacidad    │
│                        │ • Profesionales    │ • Cosecha         │ • Términos      │
│ Banderas países        │ • Precios          │ • Poda            │ • Cookies       │
│                        │ • Dashboard        │ • Riego           │                 │
├─────────────────────────────────────────────────────────────────────┤
│ © 2026 Agrivo. Todos los derechos reservados.                       │
└─────────────────────────────────────────────────────────────────────┘
```

### Elementos
- Grid de 4 columnas (responsive: 1 col en móvil, 2 en tablet, 4 en desktop)
- Banderas de los 10 países operativos
- Links a páginas legales (`/legal/privacidad`, `/legal/terminos`, `/legal/cookies`)
- Copyright con año actual

---

## 3. LANDING PAGE (PÁGINA PRINCIPAL)

**Ruta:** `/`  
**Archivo:** `src/pages/Index.tsx`

### Secciones

#### 3.1 Hero Section
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Imagen de fondo: Dron agrícola sobrevolando campos]                │
│ ┌─────────────────────────────────────────────────────────┐         │
│ │ ● Marketplace Global de Servicios Agrícolas             │         │
│ │                                                         │         │
│ │ Conecta con los mejores                                 │         │
│ │ profesionales del campo  (gradiente emerald)            │         │
│ │                                                         │         │
│ │ Publica tu trabajo, recibe ofertas competitivas...      │         │
│ │                                                         │         │
│ │ [Publicar Trabajo →]  [Explorar Profesionales]          │         │
│ │                                                         │         │
│ │ Operamos en: 🇪🇸🇧🇷🇦🇷🇺🇸🇵🇹🇫🇷🇮🇳🇦🇺🇺🇦🇲🇽              │         │
│ └─────────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

**Elementos:**
- Imagen de fondo a pantalla completa (min-height 600px)
- Overlay con gradiente oscuro (`from-slate-900/90 via-slate-900/70 to-slate-900/40`)
- Badge animado con punto pulsante verde
- Título h1 con texto en gradiente emerald-to-teal
- Subtítulo en slate-300
- 2 botones CTA: primario (gradiente) y secundario (outline blanco)
- Fila de banderas de países con tooltip

#### 3.2 Estadísticas Animadas
```
┌─────────────────────────────────────────────────────────────────────┐
│    5,000+           2,800            10              98%            │
│ Profesionales    Trabajos        Países         Satisfacción       │
│   activos       completados    operativos                          │
└─────────────────────────────────────────────────────────────────────┘
```

**Elementos:**
- Grid 4 columnas (2 en móvil)
- Números con animación de conteo (2 segundos)
- Tipografía Poppins bold en emerald-600
- Fondo blanco con borde inferior

#### 3.3 Cómo Funciona
```
┌─────────────────────────────────────────────────────────────────────┐
│              ¿Cómo funciona Agrivo?                                  │
│                                                                      │
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│ │ [🌐]         │  │ [🛡️]         │  │ [⚡]         │               │
│ │ Publica tu   │  │ Recibe       │  │ Contrata y   │               │
│ │ trabajo      │  │ ofertas      │  │ paga seguro  │               │
│ │              │  │ verificadas  │  │              │               │
│ │ Describe lo  │  │ Profesionales│  │ Elige al     │               │
│ │ que necesitas│  │ con KYC...   │  │ mejor...     │               │
│ │           1  │  │           2  │  │           3  │               │
│ └──────────────┘  └──────────────┘  └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘
```

**Elementos:**
- Badge "Simple y Efectivo" en emerald
- 3 cards con hover effect (border-emerald + shadow)
- Cada card: icono en gradiente, título, descripción, número grande en esquina
- Iconos: Globe, Shield, Zap (de lucide-react)
- Fondo slate-50

#### 3.4 Categorías de Servicios
```
┌─────────────────────────────────────────────────────────────────────┐
│ Categorías de servicios                        [Ver todos →]        │
│                                                                      │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                         │
│ │ 🚁 │ │ 🌾 │ │ ✂️ │ │ 🚜 │ │ 🌱 │ │ 💧 │                         │
│ │Dron│ │Cos.│ │Pod.│ │Ara.│ │Sie.│ │Rie.│                         │
│ ├────┤ ├────┤ ├────┤ ├────┤ ├────┤ ├────┤                         │
│ │ 🧪 │ │ 🔬 │ │ 📐 │ │ 🐄 │ │ 📋 │ │ 🚛 │                         │
│ │Fum.│ │Aná.│ │Top.│ │Gan.│ │Con.│ │Tra.│                         │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Elementos:**
- Grid 6 columnas (2 en móvil, 3 en tablet)
- 12 categorías con emoji + nombre
- Cada categoría es un Link a `/jobs?category=X`
- Hover: scale-110 del emoji, border-emerald, bg-emerald-50/50
- Fondo blanco

#### 3.5 Últimos Trabajos Publicados
```
┌─────────────────────────────────────────────────────────────────────┐
│ Últimos trabajos publicados                    [Ver todos →]        │
│                                                                      │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │
│ │ 🇪🇸 Poda │ Abierto│ │ 🇪🇸 Riego │Abierto│ │ 🇧🇷 Drones│Abierto│     │
│ │                  │ │                  │ │                  │     │
│ │ Poda de 3.000    │ │ Riego por goteo  │ │ Fumigación con   │     │
│ │ olivos           │ │ en olivar        │ │ drones en viñedo │     │
│ │                  │ │                  │ │                  │     │
│ │ Descripción...   │ │ Descripción...   │ │ Descripción...   │     │
│ │──────────────────│ │──────────────────│ │──────────────────│     │
│ │ 📍 Jaén  $8,000  │ │ 📍 Jaén  $8,000  │ │ 📍 Haro  $3,000  │     │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

**Elementos:**
- Grid 3 columnas (1 en móvil, 2 en tablet)
- 6 cards de trabajo
- Cada card: bandera país + badge categoría + badge estado, título, descripción (2 líneas), ubicación + presupuesto
- Datos: mezcla de BD real + seed data (mínimo 6 mostrados)
- Hover: shadow-lg + border-emerald-200
- Fondo slate-50

#### 3.6 Profesionales Destacados
```
┌─────────────────────────────────────────────────────────────────────┐
│ Profesionales destacados                       [Ver todos →]        │
│                                                                      │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │
│ │ [Avatar] María   │ │ [Avatar] Miguel  │ │ [Avatar] Carlos  │     │
│ │ ⭐ 4.8 · 45 trab.│ │ ⭐ 4.6 · 38 trab.│ │ ⭐ 4.9 · 52 trab.│     │
│ │ 🇪🇸 España · Poda │ │ 🇪🇸 España · Arado│ │ 🇪🇸 España · Riego│     │
│ │ Descripción...   │ │ Descripción...   │ │ Descripción...   │     │
│ │ [✓ Verificado]   │ │ [⭐ Top Pro]      │ │ [⭐ Top Pro]      │     │
│ │ [Contactar]      │ │ [Contactar]      │ │ [Contactar]      │     │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

**Elementos:**
- Grid 3 columnas (1 en móvil, 2 en tablet)
- 6 cards de profesional
- Avatar generado con DiceBear (iniciales, fondo verde o dorado)
- Top Pro: borde dorado (border-amber-300 ring-1 ring-amber-200/50)
- Insignias: PlanBadge (Verificado verde o Top Pro dorado)
- Botón "Contactar" con icono MessageSquare
- Ordenados: Enterprise primero, luego Pro
- Fondo blanco

#### 3.7 CTA Final
```
┌─────────────────────────────────────────────────────────────────────┐
│          (Fondo gradiente emerald-700 → teal-700 → emerald-800)     │
│                                                                      │
│              ¿Listo para transformar tu campo?                       │
│                                                                      │
│     Únete a miles de agricultores y profesionales que ya están      │
│     revolucionando el agro en 10 países.                            │
│                                                                      │
│         [Publicar un Trabajo →]  [Soy Profesional]                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Elementos:**
- Fondo gradiente con esferas decorativas blur
- Texto blanco centrado
- 2 botones: primario (blanco con texto emerald) y secundario (outline blanco)

#### 3.8 Cookie Consent
- Banner flotante en la parte inferior
- Aparece al primer acceso
- Botones "Aceptar" y "Rechazar"
- Se guarda en localStorage

---

## 4. LISTADO DE TRABAJOS

**Ruta:** `/jobs`  
**Archivo:** `src/pages/Jobs.tsx`

### Layout General
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Header]                                                             │
├─────────────────────────────────────────────────────────────────────┤
│ Trabajos Disponibles                           [+ Publicar Trabajo] │
│ Encuentra oportunidades agrícolas en 10 países                      │
├─────────────────────────────────────────────────────────────────────┤
│ [🔍 Buscar...] [Categoría ▼] [País ▼] [Tipo ▼]                     │
├─────────────────────────────────────────────────────────────────────┤
│ 14 trabajos encontrados                                             │
│                                                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                             │
│ │ Card 1   │ │ Card 2   │ │ Card 3   │                             │
│ └──────────┘ └──────────┘ └──────────┘                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                             │
│ │ Card 4   │ │ Card 5   │ │ Card 6   │                             │
│ └──────────┘ └──────────┘ └──────────┘                             │
│ ...                                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ [Footer]                                                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Sección de Filtros (Sticky)
- Barra sticky debajo del header (top-16 z-40)
- Fondo blanco con sombra
- 4 controles en fila (columna en móvil):
  1. **Input búsqueda** con icono Search (busca por título)
  2. **Select categoría** (12 opciones + "Todas")
  3. **Select país** (10 opciones + "Todos")
  4. **Select tipo** ("Subasta Inversa" / "Precio Fijo" + "Todos")

### Card de Trabajo
```
┌──────────────────────────────────────────┐
│ 🇪🇸 [Poda] [Subasta] ........... [Abierto]│
│                                          │
│ Poda de 3.000 olivos                     │
│ Necesitamos equipo profesional para...   │
│──────────────────────────────────────────│
│ 📍 Jaén, Andalucía      $8,000 - $12,000│
└──────────────────────────────────────────┘
```

**Elementos de cada card:**
- Bandera del país (imagen 16px)
- Badge categoría (outline)
- Badge tipo contrato (outline)
- Badge estado (emerald para "Abierto", amber para "En Progreso")
- Título en Poppins semibold (1 línea, truncado)
- Descripción (2 líneas, truncada)
- Separador
- Ubicación con icono MapPin
- Rango de presupuesto en emerald-700 bold

### Estados
- **Cargando:** 6 cards skeleton (animate-pulse)
- **Sin resultados:** Icono Search grande + mensaje + botón "Publicar Trabajo"
- **Con datos:** Grid de cards + contador de resultados

### Datos
- Carga trabajos reales de la BD + seed data como relleno
- Filtros se aplican tanto a datos reales como seed
- Seed data se excluye si hay duplicados por título

---

## 5. DETALLE DE TRABAJO

**Ruta:** `/jobs/:id`  
**Archivo:** `src/pages/JobDetail.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ [← Volver a trabajos]                                               │
│                                                                      │
│ ┌───────────────────────────────────┐ ┌─────────────────────────┐   │
│ │ DETALLE DEL TRABAJO               │ │ ENVIAR OFERTA           │   │
│ │                                   │ │                         │   │
│ │ 🇪🇸 [Poda] [Subasta] [Abierto]    │ │ Monto (USD) *           │   │
│ │                                   │ │ [________]              │   │
│ │ Poda de 3.000 olivos              │ │                         │   │
│ │                                   │ │ Mensaje                 │   │
│ │ Descripción completa del trabajo  │ │ [________________]      │   │
│ │ con todos los detalles...         │ │                         │   │
│ │                                   │ │ [Enviar Oferta]         │   │
│ │ ─────────────────────────────     │ │                         │   │
│ │ 📍 Ubicación: Jaén, Andalucía     │ └─────────────────────────┘   │
│ │ 🌾 Hectáreas: 45                  │                               │
│ │ 💰 Presupuesto: $8,000-$12,000    │ ┌─────────────────────────┐   │
│ │ 📋 Tipo: Subasta Inversa          │ │ OFERTAS RECIBIDAS (3)   │   │
│ │ 📅 Publicado: 07/07/2026          │ │                         │   │
│ │                                   │ │ [Avatar] María G.       │   │
│ └───────────────────────────────────┘ │ $7,500 · Pendiente      │   │
│                                       │ "Tengo experiencia..."  │   │
│                                       │                         │   │
│                                       │ [Avatar] Carlos M.      │   │
│                                       │ $8,200 · Pendiente      │   │
│                                       │ "Equipo disponible..."  │   │
│                                       └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Elementos
- **Columna izquierda (2/3):** Detalle completo del trabajo
- **Columna derecha (1/3):** Formulario de oferta + lista de ofertas
- Botón "Volver" con icono ArrowLeft
- Información del trabajo: badges, título, descripción, metadatos
- Formulario de oferta: monto (number input), mensaje (textarea), botón submit
- Lista de ofertas: avatar + nombre + monto + estado + mensaje

### Interacciones
- Enviar oferta requiere autenticación (redirige a login si no está logueado)
- El dueño del trabajo ve las ofertas y puede aceptar/rechazar
- Toast de confirmación al enviar oferta
- Validación: monto obligatorio

---

## 6. CREAR TRABAJO

**Ruta:** `/jobs/new`  
**Archivo:** `src/pages/CreateJob.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│              Publicar Nuevo Trabajo                                   │
│                                                                      │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ Título del trabajo *                                           │   │
│ │ [_________________________________________________]            │   │
│ │                                                                │   │
│ │ Descripción *                                                  │   │
│ │ [_________________________________________________]            │   │
│ │ [_________________________________________________]            │   │
│ │                                                                │   │
│ │ ┌──────────────────┐  ┌──────────────────┐                    │   │
│ │ │ Categoría *      │  │ País *           │                    │   │
│ │ │ [Seleccionar ▼]  │  │ [Seleccionar ▼]  │                    │   │
│ │ └──────────────────┘  └──────────────────┘                    │   │
│ │                                                                │   │
│ │ Ubicación específica *          Hectáreas                      │   │
│ │ [___________________]           [_______]                      │   │
│ │                                                                │   │
│ │ ┌──────────────────┐  ┌──────────────────┐                    │   │
│ │ │ Presupuesto mín. │  │ Presupuesto máx. │                    │   │
│ │ │ [_______] USD     │  │ [_______] USD     │                    │   │
│ │ └──────────────────┘  └──────────────────┘                    │   │
│ │                                                                │   │
│ │ Tipo de contrato *                                             │   │
│ │ ○ Subasta Inversa (profesionales compiten con ofertas)         │   │
│ │ ○ Precio Fijo (tú defines el precio)                           │   │
│ │                                                                │   │
│ │ [Publicar Trabajo]                                             │   │
│ └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Campos del Formulario
| Campo | Tipo | Obligatorio | Validación |
|-------|------|-------------|------------|
| Título | Input text | ✓ | Min 5 caracteres |
| Descripción | Textarea | ✓ | Min 20 caracteres |
| Categoría | Select (12 opciones) | ✓ | - |
| País | Select (10 opciones) | ✓ | - |
| Ubicación | Input text | ✓ | - |
| Hectáreas | Input number | - | Positivo |
| Presupuesto mínimo | Input number | - | Positivo |
| Presupuesto máximo | Input number | - | > mínimo |
| Tipo contrato | Radio buttons | ✓ | - |

### Interacciones
- Requiere autenticación (redirige a login si no está logueado)
- Validación en tiempo real con React Hook Form + Zod
- Toast de éxito al publicar
- Redirige a `/jobs/:id` después de crear

---

## 7. DIRECTORIO DE PROFESIONALES

**Ruta:** `/pros`  
**Archivo:** `src/pages/Professionals.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Profesionales Verificados                                            │
│ Encuentra expertos agrícolas en tu zona                              │
├─────────────────────────────────────────────────────────────────────┤
│ [🔍 Buscar...] [Categoría ▼] [País ▼]                               │
├─────────────────────────────────────────────────────────────────────┤
│ 14 profesionales encontrados                                         │
│                                                                      │
│ ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐     │
│ │ [Avatar dorado]  │ │ [Avatar verde]   │ │ [Avatar dorado]  │     │
│ │ Miguel Ángel R.  │ │ María García L.  │ │ Carlos Martínez  │     │
│ │ ⭐ 4.6 · 38 trab.│ │ ⭐ 4.8 · 45 trab.│ │ ⭐ 4.9 · 52 trab.│     │
│ │ 🇪🇸 España        │ │ 🇪🇸 España        │ │ 🇪🇸 España        │     │
│ │ Arado            │ │ Poda             │ │ Riego            │     │
│ │ Descripción...   │ │ Descripción...   │ │ Descripción...   │     │
│ │ [⭐ Top Pro]      │ │ [✓ Verificado]   │ │ [⭐ Top Pro]      │     │
│ │ [Contactar]      │ │ [Contactar]      │ │ [Contactar]      │     │
│ │ [Ver Perfil]     │ │ [Ver Perfil]     │ │ [Ver Perfil]     │     │
│ └──────────────────┘ └──────────────────┘ └──────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Filtros
- Input búsqueda (por nombre)
- Select categoría (12 opciones)
- Select país (10 opciones)

### Card de Profesional
- Avatar DiceBear (fondo dorado para Enterprise, verde para Pro)
- Nombre en Poppins semibold
- Rating con estrella + número de trabajos
- País con bandera + especialidad
- Descripción truncada (2 líneas)
- Insignia de plan (PlanBadge)
- Botón "Contactar" (outline, hover emerald)
- Link "Ver Perfil" → `/pros/:id`

### Diferenciación Visual
- **Top Pro (Enterprise):** Borde dorado, avatar con ring dorado
- **Verificado (Pro):** Avatar con fondo verde
- **Free:** Sin insignia especial

---

## 8. PERFIL DEL PROFESIONAL

**Ruta:** `/pros/:id`  
**Archivo:** `src/pages/ProProfile.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ [← Volver al directorio]                                            │
│                                                                      │
│ ┌─────────────────┐  ┌─────────────────────────────────────────┐   │
│ │ PERFIL          │  │ SOBRE MÍ                                 │   │
│ │                 │  │                                           │   │
│ │ [Avatar 96px]   │  │ Descripción completa del profesional     │   │
│ │                 │  │ con su experiencia, equipamiento y       │   │
│ │ Carlos Martínez │  │ servicios que ofrece...                  │   │
│ │ ⭐ 4.9 · 52 trab│  │                                           │   │
│ │                 │  ├─────────────────────────────────────────┤   │
│ │ [⭐ Top Pro]     │  │ RESEÑAS (5)                              │   │
│ │                 │  │                                           │   │
│ │ 🇪🇸 España       │  │ ⭐⭐⭐⭐⭐  07/07/2026                      │   │
│ │ 💼 Riego         │  │ "Excelente trabajo, muy profesional"    │   │
│ │ 📅 15 años exp.  │  │ — Juan Pérez                            │   │
│ │ 🏆 Ing. Agrónomo │  │                                           │   │
│ │                 │  │ ⭐⭐⭐⭐☆  05/07/2026                      │   │
│ │ [Contactar]     │  │ "Buen servicio, puntual"                │   │
│ │                 │  │ — Ana López                              │   │
│ └─────────────────┘  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Columna Izquierda (1/3) - Card de Perfil
- Avatar grande (96px) con DiceBear
- Nombre en Poppins h2
- Rating + trabajos completados
- Insignia de plan
- Metadatos: país (con bandera), especialidad, experiencia, certificaciones
- Botón "Contactar" full-width (gradiente emerald)

### Columna Derecha (2/3)
- **Card "Sobre mí":** Descripción larga del profesional
- **Card "Reseñas":** Lista de reseñas con estrellas, fecha, comentario y nombre del reviewer
  - Estrellas coloreadas (amber-500 fill) vs vacías (slate-300)
  - Fondo slate-50 con borde para cada reseña
  - Badge con contador de reseñas

### Interacciones
- "Contactar" requiere auth → redirige a mensajes
- Si el profesional no existe: página "No encontrado" con botón volver

---

## 9. PLANES Y PRECIOS

**Ruta:** `/precios`  
**Archivo:** `src/pages/Pricing.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│              Planes y Precios                                         │
│     Elige el plan perfecto para tu negocio                          │
├─────────────────────────────────────────────────────────────────────┤
│     Plan Profesional: [✓ Verificado]    Plan Empresa: [⭐ Top Pro]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌──────────────┐  ┌────────────────────┐  ┌──────────────────┐     │
│ │ [⚡]          │  │ [👑] Más Popular    │  │ [🚀]              │     │
│ │              │  │                    │  │                  │     │
│ │ Básico       │  │ Profesional        │  │ Empresa          │     │
│ │ Para empezar │  │ Para crecer        │  │ Para líderes     │     │
│ │              │  │                    │  │                  │     │
│ │ Gratis       │  │ €19 /mes           │  │ €29 /mes         │     │
│ │              │  │ [✓ Verificado]     │  │ [⭐ Top Pro]      │     │
│ │              │  │                    │  │                  │     │
│ │ ✓ 3 trabajos │  │ ✓ KYC verificado   │  │ ✓ Destacado      │     │
│ │ ✓ 5 ofertas  │  │ ✓ Insignia ✓      │  │ ✓ Insignia ⭐    │     │
│ │ ✓ Perfil     │  │ ✓ Pujas ilimitadas │  │ ✓ Analíticas     │     │
│ │   básico     │  │ ✓ Ranking prior.   │  │ ✓ Soporte prio.  │     │
│ │              │  │                    │  │                  │     │
│ │ [Comenzar]   │  │ [Suscribirme]      │  │ [Suscribirme]    │     │
│ └──────────────┘  └────────────────────┘  └──────────────────┘     │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│ 💡 Sobre cambios de plan                                             │
│ Si cambias de plan, solo pagarás la diferencia proporcional...      │
├─────────────────────────────────────────────────────────────────────┤
│ Preguntas frecuentes                                                 │
│ • ¿Puedo cambiar de plan en cualquier momento?                      │
│ • ¿Qué métodos de pago aceptan?                                    │
│ • ¿Qué incluye la insignia Verificado?                              │
│ • ¿Qué ventajas tiene ser Top Pro?                                  │
│ • ¿Puedo cancelar mi suscripción?                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Cards de Planes

| Aspecto | Free | Pro | Enterprise |
|---------|------|-----|-----------|
| Icono | Zap (⚡) | Crown (👑) | Rocket (🚀) |
| Fondo icono | slate-100 | emerald gradient | amber gradient |
| Borde | slate-200 | emerald-500 + ring | slate-200 |
| Escala | normal | scale-[1.02] | normal |
| Badge | - | "Más Popular" | - |
| Precio | Gratis | €19/mes | €29/mes |
| CTA | "Comenzar Gratis" | "Suscribirme" | "Suscribirme" |
| Color CTA | outline | emerald gradient | amber gradient |

### Interacciones
- Click en "Suscribirme" → verifica auth → crea sesión Stripe → redirige a checkout
- Si ya tiene plan: botón deshabilitado "Plan Actual"
- Prorrateo automático al hacer upgrade
- FAQ expandible con preguntas comunes

---

## 10. DASHBOARD (PANEL DE USUARIO)

**Ruta:** `/dashboard`  
**Archivo:** `src/pages/Dashboard.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ ¡Hola, Carlos!                              [+ Publicar Trabajo]    │
│ Gestiona tus trabajos y ofertas desde aquí                          │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ 💼 3     │ │ 💰 5     │ │ 📈 2     │ │ 💬 0     │               │
│ │Mis Trab. │ │Mis Ofert.│ │ Activos  │ │ Mensajes │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│ [Mis Trabajos] [Mis Ofertas]                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ Poda de 3.000 olivos  [Abierto]                    07/07/2026 │   │
│ │ Poda · Jaén, Andalucía · $8,000 - $12,000 USD                │   │
│ └───────────────────────────────────────────────────────────────┘   │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ Riego por goteo en olivar  [En Progreso]           05/07/2026 │   │
│ │ Riego · Jaén, Andalucía · $8,000 - $15,000 USD               │   │
│ └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Secciones

#### Stats Cards (4 columnas)
| Card | Icono | Color fondo | Dato |
|------|-------|-------------|------|
| Mis Trabajos | Briefcase | emerald-100 | Conteo de jobs propios |
| Mis Ofertas | DollarSign | amber-100 | Conteo de bids propios |
| Activos | TrendingUp | teal-100 | Jobs con status "open" |
| Mensajes | MessageSquare | blue-100 | Conteo de mensajes |

#### Tabs
- **"Mis Trabajos":** Lista de trabajos publicados por el usuario
  - Cada item: título + badge estado + categoría + ubicación + presupuesto + fecha
  - Click navega a `/jobs/:id`
  - Estado vacío: icono + mensaje + botón "Publicar Trabajo"

- **"Mis Ofertas":** Lista de ofertas enviadas
  - Cada item: "Oferta #ID" + badge estado (Pendiente/Aceptada/Rechazada) + monto + mensaje
  - Estado vacío: icono + mensaje + botón "Explorar Trabajos"

### Protección
- Requiere autenticación
- Si no está logueado → redirige a login automáticamente

---

## 11. MENSAJERÍA

**Ruta:** `/messages`  
**Archivo:** `src/pages/Messages.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Mensajes                                                             │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐  ┌─────────────────────────────────────────┐   │
│ │ Conversaciones  │  │ [Avatar] María García                    │   │
│ │                 │  ├─────────────────────────────────────────┤   │
│ │ ┌─────────────┐│  │                                           │   │
│ │ │[👤] María G. ││  │         Hola, me interesa tu             │   │
│ │ │ Último msg...││  │         servicio de poda                 │   │
│ │ └─────────────┘│  │                              14:30        │   │
│ │ ┌─────────────┐│  │                                           │   │
│ │ │[👤] Carlos M.││  │    Perfecto, tengo disponibilidad        │   │
│ │ │ Último msg...││  │    la próxima semana                     │   │
│ │ └─────────────┘│  │    14:32                                  │   │
│ │                 │  │                                           │   │
│ │                 │  │         ¿Cuántas hectáreas son?           │   │
│ │                 │  │                              14:35        │   │
│ │                 │  │                                           │   │
│ │                 │  ├─────────────────────────────────────────┤   │
│ │                 │  │ [Escribe un mensaje...        ] [Enviar]  │   │
│ └─────────────────┘  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Panel Izquierdo (1/3) - Lista de Conversaciones
- Título "Conversaciones"
- Lista scrollable (540px altura)
- Cada conversación: avatar circular + nombre + último mensaje (truncado)
- Conversación seleccionada: fondo emerald-50 + borde izquierdo emerald
- Badge de mensajes no leídos (emerald-500)
- Estado vacío: icono MessageSquare + "No tienes conversaciones aún"

### Panel Derecho (2/3) - Área de Chat
- **Header:** Avatar + nombre del contacto
- **Mensajes:** Burbujas de chat
  - Mensajes propios: alineados a la derecha, fondo emerald-600, texto blanco, esquina br redondeada
  - Mensajes recibidos: alineados a la izquierda, fondo slate-100, texto oscuro, esquina bl redondeada
  - Hora debajo de cada mensaje
- **Input:** Campo de texto + botón enviar (icono Send)
  - Enter para enviar
  - Botón deshabilitado si campo vacío

### Sin conversación seleccionada
- Área central con icono MessageSquare + "Selecciona una conversación"

### Protección
- Requiere autenticación

---

## 12. CENTRO DE DISPUTAS

**Ruta:** `/disputes`  
**Archivo:** `src/pages/Disputes.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ Centro de Disputas                          [⚠️ Nueva Disputa]       │
│ Resuelve conflictos de forma justa y transparente                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ NUEVA DISPUTA (formulario expandible)                          │   │
│ │                                                                │   │
│ │ Trabajo relacionado *    [_________________________]           │   │
│ │ Motivo *                 [Seleccionar ▼]                       │   │
│ │ Monto en disputa (USD)   [_______]                             │   │
│ │ Descripción detallada *  [_________________________]           │   │
│ │                          [_________________________]           │   │
│ │                                                                │   │
│ │ [Enviar Disputa] [Cancelar]                                    │   │
│ └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ 🕐 Poda de 3.000 olivos                        [En revisión]  │   │
│ │ El profesional no completó el trabajo...                       │   │
│ │ [Calidad] · $5,000 USD                                        │   │
│ └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ ℹ️ Proceso de resolución                                       │   │
│ │ 1. Envías tu disputa con toda la documentación                │   │
│ │ 2. Nuestro equipo contacta a ambas partes en 24-48h           │   │
│ │ 3. Se evalúan las pruebas y se propone una solución           │   │
│ │ 4. Si ambas partes aceptan, se ejecuta la resolución          │   │
│ │ 5. En caso de desacuerdo, un mediador toma la decisión final  │   │
│ └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Formulario de Nueva Disputa
| Campo | Tipo | Obligatorio |
|-------|------|-------------|
| Trabajo relacionado | Input text | ✓ |
| Motivo | Select (7 opciones) | ✓ |
| Monto en disputa | Input number | - |
| Descripción | Textarea (5 rows) | ✓ |

**Motivos disponibles:**
- Calidad del trabajo insatisfactoria
- Trabajo no completado
- El profesional no se presentó
- Cobro excesivo
- Daños causados
- Falta de comunicación
- Otro motivo

### Lista de Disputas
- Cada disputa: icono estado + título + descripción + badges (motivo, monto) + badge estado
- Estados con colores:
  - En revisión: amber (Clock)
  - Resuelta: emerald (CheckCircle)
  - Rechazada: red (XCircle)

### Panel Informativo
- Fondo emerald-50/50 con borde emerald-200
- Proceso de resolución en 5 pasos

---

## 13. VERIFICACIÓN KYC

**Ruta:** `/kyc?plan=pro|enterprise`  
**Archivo:** `src/pages/KycVerification.tsx`

### Layout (Formulario)
```
┌─────────────────────────────────────────────────────────────────────┐
│              [🛡️]                                                     │
│     Verificación de identidad                                        │
│     Completa tu perfil profesional para obtener tu insignia         │
│     [Plan Profesional] [✓ Verificado]                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ Datos de verificación KYC                                      │   │
│ │                                                                │   │
│ │ ── DATOS PERSONALES ──                                         │   │
│ │ Nombre completo *        [_________________________]           │   │
│ │ Tipo de documento *      [Seleccionar ▼]                       │   │
│ │ Número de documento *    [_____________]                       │   │
│ │ País *                   [Seleccionar ▼]                       │   │
│ │ Dirección                [_________________________]           │   │
│ │                                                                │   │
│ │ ── DOCUMENTO DE IDENTIDAD ──                                   │   │
│ │ ┌─────────────────────────────────────────┐                    │   │
│ │ │         [📤]                             │                    │   │
│ │ │  Sube una foto clara de tu documento    │                    │   │
│ │ │  Formatos: JPG, PNG, PDF · Máximo 5MB   │                    │   │
│ │ │  [Seleccionar archivo]                  │                    │   │
│ │ │  ✓ documento_carlos.jpg                 │                    │   │
│ │ └─────────────────────────────────────────┘                    │   │
│ │                                                                │   │
│ │ ── INFORMACIÓN PROFESIONAL ──                                  │   │
│ │ Especialidad principal * [Seleccionar ▼]                       │   │
│ │ Años de experiencia      [___]                                 │   │
│ │ Certificaciones          [_________________________]           │   │
│ │ Descripción profesional  [_________________________]           │   │
│ │                          [_________________________]           │   │
│ │                                                                │   │
│ │ 🔒 Privacidad: Tu documento se almacena de forma segura...    │   │
│ │                                                                │   │
│ │ [Enviar para verificación]                                     │   │
│ └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Layout (Post-envío)
```
┌─────────────────────────────────────────────────────────────────────┐
│              [✓]                                                      │
│     ¡Verificación en proceso!                                        │
│                                                                      │
│     Hemos recibido tu documentación. Nuestro equipo revisará       │
│     tu información en un plazo de 24-48 horas.                      │
│                                                                      │
│     Tu insignia será: [✓ Verificado]                                │
│                                                                      │
│     ⚠️ Estado: Pendiente de revisión. Tu plan ya está activo,        │
│     la insignia se mostrará una vez verificado.                     │
│                                                                      │
│     [Ir a Mi Panel]                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Campos del Formulario
| Sección | Campo | Tipo | Obligatorio |
|---------|-------|------|-------------|
| Personal | Nombre completo | Input | ✓ |
| Personal | Tipo documento | Select (DNI/Pasaporte/Licencia/NIF) | ✓ |
| Personal | Número documento | Input | ✓ |
| Personal | País | Select (10 países) | ✓ |
| Personal | Dirección | Input | - |
| Documento | Foto documento | File upload (JPG/PNG/PDF, max 5MB) | ✓ |
| Profesional | Especialidad | Select (12 categorías) | ✓ |
| Profesional | Años experiencia | Input number | - |
| Profesional | Certificaciones | Input | - |
| Profesional | Descripción | Textarea | - |

### Flujo
1. Usuario llega después de pagar plan Pro/Enterprise
2. Completa formulario con datos personales y profesionales
3. Sube foto de documento de identidad
4. Envía → se crea registro en `kyc_verifications` con status "pending"
5. Se crea/actualiza perfil profesional
6. Muestra pantalla de confirmación
7. Admin revisa y aprueba/rechaza desde Panel Admin

---

## 14. PANEL DE ADMINISTRACIÓN

**Ruta:** `/admin`  
**Archivo:** `src/pages/Admin.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ [🛡️] Panel de Administración                                        │
│     Gestiona verificaciones KYC y usuarios                          │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│ │ 🕐 3         │  │ ✓ 8          │  │ ✗ 2          │               │
│ │ Pendientes   │  │ Aprobados    │  │ Rechazados   │               │
│ └──────────────┘  └──────────────┘  └──────────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│ [Pendientes (3)] [Todas (13)]                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ [👤] María García López                        [🕐 Pendiente]  │   │
│ │ ID: a1b2c3d4...                                                │   │
│ │                                                                │   │
│ │ Documento: DNI    Número: 12345678A                            │   │
│ │ País: España      Especialidad: Poda                           │   │
│ │ Experiencia: 15 años   Certificaciones: Ing. Agrónomo          │   │
│ │ Fecha: 07/07/2026                                              │   │
│ │                                                                │   │
│ │                              [✓ Aprobar] [✗ Rechazar]          │   │
│ └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌───────────────────────────────────────────────────────────────┐   │
│ │ [👤] Carlos Martínez Herrera                   [🕐 Pendiente]  │   │
│ │ ...                                                            │   │
│ │                              [✓ Aprobar] [✗ Rechazar]          │   │
│ └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Stats Cards (3 columnas)
| Card | Icono | Color | Dato |
|------|-------|-------|------|
| Pendientes | Clock | amber-100 | Conteo pendientes |
| Aprobados | CheckCircle | emerald-100 | Conteo aprobados |
| Rechazados | XCircle | red-100 | Conteo rechazados |

### Tabs
- **Pendientes:** Cards expandidas con toda la info + botones de acción
- **Todas:** Lista compacta con nombre + tipo doc + país + especialidad + fecha + badge estado

### Card de KYC Pendiente
- Avatar + nombre + ID usuario (truncado)
- Grid de metadatos (2-4 columnas): documento, número, país, especialidad, experiencia, certificaciones, fecha
- Botones de acción:
  - "Aprobar" (emerald-600, icono CheckCircle)
  - "Rechazar" (destructive/rojo, icono XCircle)
- Estado de procesamiento (disabled durante la acción)

### Interacciones
- Aprobar: actualiza status a "approved" + envía email de notificación
- Rechazar: actualiza status a "rejected" + envía email de notificación
- Toast de confirmación después de cada acción
- Recarga automática de datos

---

## 15. PAGO EXITOSO

**Ruta:** `/payment-success?session_id=xxx&plan=pro|enterprise`  
**Archivo:** `src/pages/PaymentSuccess.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│              [✓ animado]                                              │
│                                                                      │
│     ¡Pago completado con éxito!                                     │
│                                                                      │
│     Tu suscripción al plan Profesional está activa.                 │
│     Ahora completa tu verificación KYC para obtener                 │
│     tu insignia de profesional verificado.                          │
│                                                                      │
│     [Completar Verificación KYC →]                                   │
│     [Ir al Dashboard]                                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Flujo
1. Stripe redirige aquí después de pago exitoso
2. Se verifica el pago con `client.payment.verifyPayment(sessionId)`
3. Se crea registro de suscripción en BD
4. Muestra confirmación con animación
5. CTA principal: ir a verificación KYC
6. CTA secundario: ir al dashboard

---

## 16. PÁGINAS LEGALES

**Ruta:** `/legal/:page` (privacidad, terminos, cookies)  
**Archivo:** `src/pages/Legal.tsx`

### Layout
```
┌─────────────────────────────────────────────────────────────────────┐
│ [← Volver]                                                           │
│                                                                      │
│ Política de Privacidad                                               │
│                                                                      │
│ Última actualización: julio 2026                                    │
│                                                                      │
│ 1. Información que recopilamos                                      │
│    Lorem ipsum dolor sit amet...                                    │
│                                                                      │
│ 2. Cómo usamos tu información                                      │
│    Lorem ipsum dolor sit amet...                                    │
│                                                                      │
│ 3. Compartir información                                            │
│    Lorem ipsum dolor sit amet...                                    │
│                                                                      │
│ ...                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Páginas Disponibles
- `/legal/privacidad` - Política de Privacidad
- `/legal/terminos` - Términos y Condiciones
- `/legal/cookies` - Política de Cookies

### Elementos
- Contenido renderizado en prosa (max-width 3xl)
- Tipografía legible con espaciado
- Botón "Volver" en la parte superior
- Navegación entre páginas legales

---

## 17. AUTENTICACIÓN

### Auth Callback (`/auth/callback`)
**Archivo:** `src/pages/AuthCallback.tsx`

- Pantalla de carga con spinner
- Procesa el callback OAuth
- Retry logic (hasta 3 intentos) para propagación de sesión
- Redirige a Dashboard si éxito
- Redirige a `/auth/error` si falla

### Auth Error (`/auth/error`)
**Archivo:** `src/pages/AuthError.tsx`

- Icono de error
- Mensaje "Error de autenticación"
- Descripción del problema
- Botón "Volver al inicio"
- Botón "Intentar de nuevo"

### Logout Callback (`/auth/logout`)
**Archivo:** `src/pages/LogoutCallbackPage.tsx`

- Procesa el cierre de sesión
- Limpia estado local
- Redirige a la página principal

---

## RESUMEN DE COMPONENTES UI UTILIZADOS

### shadcn/ui Components
| Componente | Uso Principal |
|-----------|---------------|
| Button | CTAs, acciones, navegación |
| Card, CardContent, CardHeader, CardTitle | Contenedores de información |
| Badge | Estados, categorías, planes |
| Input | Campos de texto |
| Textarea | Campos de texto largo |
| Select, SelectContent, SelectItem, SelectTrigger, SelectValue | Dropdowns |
| Tabs, TabsContent, TabsList, TabsTrigger | Navegación por pestañas |
| Sheet, SheetContent, SheetTrigger | Menú móvil lateral |
| DropdownMenu, DropdownMenuContent, DropdownMenuItem | Menús desplegables |
| Label | Etiquetas de formulario |

### Lucide React Icons
| Icono | Uso |
|-------|-----|
| Star | Ratings, valoraciones |
| MapPin | Ubicaciones |
| ArrowRight, ArrowLeft | Navegación, CTAs |
| Shield | Seguridad, KYC, admin |
| Globe | Internacional |
| Zap | Plan básico, rapidez |
| MessageSquare | Mensajes, contacto |
| Search | Búsqueda |
| Plus | Crear nuevo |
| Briefcase | Trabajos |
| DollarSign | Ofertas, pagos |
| TrendingUp | Estadísticas |
| Send | Enviar mensaje |
| User | Avatar, perfil |
| LogOut | Cerrar sesión |
| LayoutDashboard | Dashboard |
| AlertTriangle | Disputas, advertencias |
| Upload | Subir archivos |
| CheckCircle | Éxito, aprobado |
| XCircle | Error, rechazado |
| Clock | Pendiente |
| Crown | Plan Pro |
| Rocket | Plan Enterprise |
| Award | Certificaciones |
| Calendar | Fechas, experiencia |
| FileText | Documentos |
| Menu | Menú hamburguesa |
| Check | Lista de features |

### Componentes Personalizados
| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| Header | `components/Header.tsx` | Navegación global con auth y idioma |
| Footer | `components/Footer.tsx` | Pie de página con links |
| CookieConsent | `components/CookieConsent.tsx` | Banner de cookies |
| Badges (VerifiedBadge, TopProBadge, PlanBadge) | `components/Badges.tsx` | Insignias de verificación |
| LoadingSpinner | `components/LoadingSpinner.tsx` | Indicador de carga |
| ProtectedAdminRoute | `components/ProtectedAdminRoute.tsx` | HOC para rutas admin |

---

## PALETA DE COLORES POR VISTA

| Vista | Color Dominante | Fondo |
|-------|----------------|-------|
| Landing Hero | Emerald gradient sobre imagen oscura | Imagen + overlay |
| Estadísticas | Emerald-600 (números) | Blanco |
| Cómo funciona | Emerald-500 (iconos) | Slate-50 |
| Categorías | Emerald hover | Blanco |
| Trabajos | Emerald-700 (precios) | Slate-50 |
| Profesionales | Emerald (Pro) / Amber (Enterprise) | Blanco |
| Pricing | Emerald (Pro) / Amber (Enterprise) | Slate-50 |
| Dashboard | Emerald + Amber + Teal + Blue | Slate-50 |
| Mensajes | Emerald-600 (burbujas propias) | Blanco |
| Disputas | Amber (pendiente) / Emerald (resuelto) | Slate-50 |
| KYC | Emerald gradient (botones) | Slate-50 |
| Admin | Emerald + Amber + Red (estados) | Slate-50 |

---

## TIPOGRAFÍA

| Elemento | Fuente | Peso | Uso |
|----------|--------|------|-----|
| Headings (h1-h4) | Poppins | 600-700 | Títulos de sección, nombres |
| Body text | Open Sans (system) | 400 | Párrafos, descripciones |
| Números/Stats | Poppins | 700 | Contadores, precios |
| Badges/Labels | System | 500-600 | Etiquetas, estados |
| Buttons | System | 500 | Texto de botones |

---

## RESPONSIVE BREAKPOINTS

| Breakpoint | Ancho | Comportamiento |
|-----------|-------|----------------|
| Mobile | < 768px | 1 columna, menú hamburguesa, cards apiladas |
| Tablet (md) | 768px+ | 2 columnas, navegación visible |
| Desktop (lg) | 1024px+ | 3 columnas, layout completo |
| Wide (xl) | 1280px+ | 6 columnas para categorías |

---

*Documento generado el 11 de julio de 2026*
*Versión: 1.0*
*Plataforma: Agrivo - Marketplace Global de Servicios Agrícolas*