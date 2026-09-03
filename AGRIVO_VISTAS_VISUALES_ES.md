# 📱 Agrivo - Documento Visual de Vistas de la Plataforma

## Guía Visual Completa de la Interfaz de Usuario

---

## 1. Landing Page (Página Principal)

La página principal presenta el hero con imagen de drone agrícola, estadísticas de la plataforma, categorías de servicios, trabajos destacados y profesionales verificados.

![Landing Page - Hero Section](https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-11/sisztdacaiza/vista-01-landing-hero.png)

### Elementos principales:
- **Header**: Logo Agrivo, navegación (Home, Jobs, Professionals, Pricing), selector de idioma, botones Sign In/Sign Up
- **Hero Section**: Imagen de drone agrícola, título "Conecta con los mejores profesionales del campo", CTAs principales
- **Banderas de países**: España, Brasil, Argentina, USA, Portugal, Francia, India, Australia, Ucrania, México
- **Estadísticas**: 2,400+ profesionales activos, 1,344 trabajos completados, 4 países operativos, 47% satisfacción
- **Sección "¿Cómo funciona?"**: 3 pasos (Publica, Recibe ofertas, Contrata)
- **Categorías de servicios**: 12 categorías con emojis (Drones, Cosecha, Poda, Arado, Siembra, Riego, etc.)
- **Trabajos recientes**: Cards con trabajos publicados
- **Profesionales destacados**: Cards con los mejores profesionales
- **CTA final**: "¿Listo para transformar tu campo?"
- **Footer**: Links de navegación, servicios, legal

---

## 2. Listado de Trabajos

Página con todos los trabajos disponibles, filtros por categoría, país y tipo de contrato.

![Listado de Trabajos](https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-11/siszt6iaai2q/vista-02-jobs-listing.png)

### Elementos principales:
- **Filtros laterales**: Categoría (dropdown), País (selector con banderas), Tipo de contrato (radio buttons)
- **Barra de búsqueda**: Input de texto para buscar trabajos
- **Cards de trabajos**: Bandera del país, badge de categoría, estado "Abierto", título, descripción, ubicación, presupuesto
- **Paginación**: Navegación entre páginas de resultados
- **Ordenamiento**: Por fecha, presupuesto, relevancia

---

## 3. Detalle del Trabajo

Vista completa de un trabajo individual con sistema de pujas/ofertas.

![Detalle del Trabajo](https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-11/siszulacaizq/vista-03-job-detail.png)

### Elementos principales:
- **Cabecera**: Título del trabajo, badge de estado, fecha de publicación
- **Información del trabajo**: Descripción completa, requisitos, categoría, ubicación, presupuesto
- **Formulario de oferta**: Monto, días para completar, propuesta (textarea), botón "Enviar Oferta"
- **Lista de ofertas existentes**: Avatar del profesional, monto ofertado, plazo, valoración
- **Información del cliente**: Nombre, ubicación, trabajos publicados anteriormente

---

## 4. Directorio de Profesionales

Página con todos los profesionales registrados y verificados en la plataforma.

![Directorio de Profesionales](https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-11/siszuxycai2a/vista-04-professionals.png)

### Elementos principales:
- **Barra de búsqueda**: Filtro por nombre o especialidad
- **Filtros**: País, especialidad, valoración mínima
- **Cards de profesionales**: Avatar circular con iniciales, nombre, rating con estrellas (4.8-4.9), número de trabajos completados, bandera del país, especialidades como tags, bio corta, botón "Contactar"
- **Badges**: "Verificado" (verde), "Top Pro" (dorado)
- **Paginación**: Navegación entre páginas

---

## 5. Página de Precios

Planes de suscripción con integración de pagos Stripe.

![Página de Precios](https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-11/siszvgqcaiyq/vista-05-pricing.png)

### Elementos principales:
- **Plan Básico (Gratis)**: Funciones limitadas, 3 ofertas/mes, soporte por email
- **Plan Pro (€19/mes)**: Badge "Popular", ofertas ilimitadas, prioridad en búsqueda, soporte prioritario, analytics básico
- **Plan Enterprise (€29/mes)**: Todo de Pro + API access, soporte dedicado, analytics avanzado, equipo multi-usuario
- **Checkmarks/X marks**: Indicadores visuales de features incluidas/excluidas
- **Botones CTA**: "Comenzar" en verde para planes de pago
- **Comparativa de features**: Tabla detallada debajo de los cards

---

## 6. Dashboard del Usuario

Panel de control personal con gestión de trabajos, ofertas y estadísticas.

![Dashboard del Usuario](https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-11/siszvvacaiya/vista-06-dashboard.png)

### Elementos principales:
- **Sidebar de navegación**: Dashboard, Mis Trabajos, Mis Ofertas, Mensajes, Perfil, KYC
- **Cards de estadísticas**: Trabajos Activos, Ofertas Recibidas, Mensajes nuevos, Valoración promedio
- **Tabla de trabajos activos**: Título, estado (badges de color), fecha, acciones
- **Actividad reciente**: Timeline de eventos (nuevas ofertas, mensajes, pagos)
- **Accesos rápidos**: Publicar trabajo, Ver mensajes, Completar perfil

---

## 7. Sistema de Mensajería

Chat en tiempo real entre agricultores y profesionales.

![Sistema de Mensajería](https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-11/siszwcacaiza/vista-07-messaging.png)

### Elementos principales:
- **Panel izquierdo - Lista de conversaciones**: Avatares, nombres, último mensaje, timestamp, indicador de no leídos
- **Panel derecho - Chat activo**: Burbujas de mensajes (verde enviados, gris recibidos), timestamps
- **Cabecera del chat**: Nombre del contacto, estado online/offline
- **Input de mensaje**: Campo de texto, botón de enviar, adjuntar archivos
- **Información contextual**: Trabajo relacionado con la conversación

---

## 8. Verificación KYC

Formulario de verificación de identidad para profesionales.

![Verificación KYC](https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-11/siszwpacaizq/vista-08-kyc-verification.png)

### Elementos principales:
- **Indicador de progreso**: Pasos 1-2-3 (Datos personales, Documentos, Confirmación)
- **Campos del formulario**:
  - Nombre completo
  - Tipo de documento (DNI/Pasaporte/Licencia)
  - Número de documento
  - País de residencia
  - Zona de carga de documento (drag & drop)
  - Especialidad principal
  - Años de experiencia
  - Certificaciones
- **Botón de envío**: "Enviar Verificación" en verde
- **Badges de seguridad**: Iconos de encriptación y protección de datos

---

## 9. Panel de Administración

Panel para gestión de verificaciones KYC, usuarios y trabajos.

![Panel de Administración](https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-11/siszw3ycai2a/vista-09-admin-panel.png)

### Elementos principales:
- **Sidebar oscuro**: Dashboard, KYC Pendientes, Usuarios, Trabajos, Reportes, Configuración
- **Cards de estadísticas**: Total Usuarios, KYC Pendientes, Trabajos Activos, Ingresos
- **Tabla de verificaciones KYC**: Columnas (Nombre, País, Especialidad, Fecha, Estado, Acciones)
- **Badges de estado**: Pendiente (amarillo), Aprobado (verde), Rechazado (rojo)
- **Botones de acción**: Aprobar (verde), Rechazar (rojo), Ver detalles
- **Gráficos**: Estadísticas de uso de la plataforma

---

## 10. Perfil Público del Profesional

Página pública con toda la información del profesional.

![Perfil Público del Profesional](https://mgx-backend-cdn.metadl.com/generate/images/1410088/2026-07-11/siszxiqcaiyq/vista-10-professional-profile.png)

### Elementos principales:
- **Banner de cabecera**: Gradiente verde
- **Avatar grande**: Circular con iniciales sobre fondo verde
- **Información principal**: Nombre, badge verificado, rating con estrellas, número de reseñas
- **Ubicación**: Ciudad, país con bandera
- **Bio/Descripción**: Texto completo del profesional
- **Tags de especialidades**: Riego, Olivar, Agricultura de Precisión, etc.
- **Galería/Portfolio**: Thumbnails de trabajos realizados
- **Sección de reseñas**: Estrellas, comentarios de clientes, fechas
- **Botones de acción**: "Contactar", "Invitar a Trabajo"

---

## 🎨 Paleta de Colores de la Plataforma

| Color | Hex | Uso |
|-------|-----|-----|
| Verde primario | #166534 | Botones, badges, acentos |
| Verde esmeralda | #059669 | Avatares, iconos |
| Naranja acento | #ea580c | Alertas, CTAs secundarios |
| Tierra | #92400e | Elementos earth-tone |
| Blanco cálido | #fafaf5 | Fondo principal |
| Gris oscuro | #1f2937 | Texto principal |

## 📝 Tipografía

- **Títulos**: Poppins (Bold, Semi-Bold)
- **Cuerpo**: Open Sans (Regular, Medium)

## 🌐 Idiomas Soportados

- 🇪🇸 Español (principal)
- 🇬🇧 English
- 🇧🇷 Português
- 🇫🇷 Français

---

*Documento generado el 11 de julio de 2026 - Plataforma Agrivo v1.0*